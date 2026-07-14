#!/usr/bin/env node
/**
 * Backfill `country` on existing guide documents.
 *
 * The listing enquiry shelf resolves its buying guide from the listing's country, which
 * needs a country on the guide to key off. Guides authored before that field existed have
 * the market only in their title and slug, so infer it from the slug and set it once.
 *
 * Guides whose slug names neither market are left alone: a guide that is not
 * country-specific should keep `country` empty (the field is optional by design).
 *
 * Usage:
 *   pnpm --filter sanity migrate:guide-country -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:guide-country -- --dataset development
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

type GuideDoc = {
	_id: string;
	title?: string | null;
	slug?: string | null;
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

/** Read the market off the slug ("buying-property-in-spain-uk-buyers" → spain). */
function countryFromSlug(slug: string | null | undefined): Country | null {
	if (!slug) return null;
	return COUNTRIES.find((country) => slug.includes(country)) ?? null;
}

/** Guides that have no country yet — drafts included, so an in-progress edit isn't skipped. */
async function fetchGuidesWithoutCountry(client: SanityClient): Promise<GuideDoc[]> {
	return client.fetch(
		`*[_type == "guide" && !defined(country)]{ _id, title, "slug": slug.current }`
	);
}

async function main() {
	const client = createMigrationClient();
	const guides = await fetchGuidesWithoutCountry(client);

	const resolved = guides
		.map((guide) => ({ guide, country: countryFromSlug(guide.slug) }))
		.filter((entry): entry is { guide: GuideDoc; country: Country } => entry.country != null);

	const skipped = guides.length - resolved.length;

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Guides without a country: ${guides.length}`);
	console.log(`Resolvable from slug: ${resolved.length}`);
	if (skipped > 0) {
		console.log(`Left unset (no market in the slug): ${skipped}`);
	}

	if (resolved.length === 0) {
		return;
	}

	for (const { guide, country } of resolved) {
		console.log(`  ${guide.slug ?? guide._id} → ${country}`);
	}

	if (dryRun) {
		console.log('Dry run: nothing written.');
		return;
	}

	const transaction = client.transaction();
	for (const { guide, country } of resolved) {
		transaction.patch(guide._id, { set: { country } });
	}

	await transaction.commit();
	console.log(`Set country on ${resolved.length} guide(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
