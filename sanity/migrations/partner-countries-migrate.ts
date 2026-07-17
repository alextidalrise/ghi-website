#!/usr/bin/env node
/**
 * Backfill `countries` on existing partner documents.
 *
 * The listing enquiry shelf now scopes its specialists to partners that cover the
 * listing's country (`$countrySlug in countries`), so a partner with no `countries` set
 * appears on no listing. Partners created before that field existed carry their markets
 * only in the free-text `coverage` label, so set the structured field once.
 *
 * Markets are read out of each partner's current `coverage` — the editor-maintained truth,
 * which every existing partner now states plainly ("Spain", "Portugal", "Spain & Portugal").
 * A coverage that names no country (a region-only or blank label) defaults to Spain, the
 * founding market, so a partner is never tagged empty and silently dropped from every
 * listing. Deliberately NOT keyed off a hardcoded slug map: editors have since narrowed
 * some partners in Studio (e.g. a mortgage broker to Spain only), and their coverage is
 * the intent to honour, not the original seed.
 *
 * Non-destructive: patches only `countries`, and only on partners that lack it, so it is
 * safe to run repeatedly and will not touch logos or any other field.
 *
 * Usage:
 *   pnpm --filter sanity migrate:partner-countries -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:partner-countries -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const COUNTRIES = ['spain', 'portugal'] as const;
type Country = (typeof COUNTRIES)[number];

type PartnerDoc = {
	_id: string;
	name?: string | null;
	slug?: string | null;
	coverage?: string | null;
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) {
		return undefined;
	}

	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

function createMigrationClient(): SanityClient {
	if (!TOKEN) {
		throw new Error('Missing Sanity token. Set SANITY_API_TOKEN or log in via sanity CLI.');
	}

	return createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token: TOKEN,
		useCdn: false
	});
}

/** Read markets out of the coverage label; default to Spain so the result is never empty. */
function countriesFor(partner: PartnerDoc): Country[] {
	const haystack = (partner.coverage ?? '').toLowerCase();
	const found = COUNTRIES.filter((country) => haystack.includes(country));
	return found.length > 0 ? found : ['spain'];
}

/** Partners with no countries yet — drafts included, so an in-progress edit isn't skipped. */
async function fetchPartnersWithoutCountries(client: SanityClient): Promise<PartnerDoc[]> {
	return client.fetch(
		`*[_type == "partner" && (!defined(countries) || count(countries) == 0)]{
			_id, name, "slug": slug.current, coverage
		}`
	);
}

async function main() {
	const client = createMigrationClient();
	const partners = await fetchPartnersWithoutCountries(client);

	const resolved = partners.map((partner) => ({ partner, countries: countriesFor(partner) }));

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Partners without countries: ${partners.length}`);

	if (resolved.length === 0) {
		return;
	}

	for (const { partner, countries } of resolved) {
		console.log(`  ${partner.slug ?? partner._id} → [${countries.join(', ')}]`);
	}

	if (dryRun) {
		console.log('Dry run: nothing written.');
		return;
	}

	const transaction = client.transaction();
	for (const { partner, countries } of resolved) {
		transaction.patch(partner._id, { set: { countries } });
	}

	await transaction.commit();
	console.log(`Set countries on ${resolved.length} partner(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
