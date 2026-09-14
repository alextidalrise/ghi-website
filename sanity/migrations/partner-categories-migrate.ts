#!/usr/bin/env node
/**
 * Migrate each partner's single `category` reference into the new `categories` array.
 *
 * The partner schema used to allow exactly one category (a single `reference`); it now takes
 * an array of references (`categories`), so a partner can appear under more than one section
 * of /partners. Partners created under the old schema carry their one category in the retired
 * `category` field — wrap it into a one-item `categories` array and drop the old field.
 *
 * The array item needs a stable `_key`: the referenced category id is unique within a
 * one-item array and deterministic, so a re-run produces the same document.
 *
 * Idempotent: the query selects only partners that still have the old `category` set, so a
 * partner already migrated (it has `categories`, not `category`) is skipped. Drafts are
 * included, so an in-progress edit is not left behind on the old shape. Nothing else on the
 * document is touched.
 *
 * Usage:
 *   pnpm --filter sanity migrate:partner-categories -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:partner-categories -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

type PartnerDoc = {
	_id: string;
	slug?: string | null;
	categoryRef?: string | null;
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

/** Partners still carrying the retired single `category` ref — drafts included. */
async function fetchPartnersWithLegacyCategory(client: SanityClient): Promise<PartnerDoc[]> {
	return client.fetch(
		`*[_type == "partner" && defined(category._ref)]{
			_id, "slug": slug.current, "categoryRef": category._ref
		}`
	);
}

async function main() {
	const client = createMigrationClient();
	const partners = await fetchPartnersWithLegacyCategory(client);

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Partners with a legacy single category: ${partners.length}`);

	const migratable = partners.filter((partner) => Boolean(partner.categoryRef));

	for (const partner of migratable) {
		console.log(`  ${partner.slug ?? partner._id} → categories: [${partner.categoryRef}]`);
	}

	if (migratable.length === 0) {
		return;
	}

	if (dryRun) {
		console.log('Dry run: nothing written.');
		return;
	}

	const transaction = client.transaction();
	for (const partner of migratable) {
		const ref = partner.categoryRef as string;
		transaction.patch(partner._id, (patch) =>
			patch
				.setIfMissing({
					categories: [{ _type: 'reference', _key: ref, _ref: ref }]
				})
				.unset(['category'])
		);
	}

	await transaction.commit();
	console.log(`Migrated ${migratable.length} partner(s) to the categories array.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
