#!/usr/bin/env tsx
/**
 * Scrub the retired `location.exactAddressInternal` field from existing documents.
 *
 * The field has been removed from the `locationFields` object schema, so it no
 * longer appears in the Studio — but values already stored on documents persist
 * as orphans. Because it held internal street addresses, we unset it from every
 * document that still carries it. Both listing types embed `locationFields`.
 *
 * Removed:
 *   location.exactAddressInternal
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/unset-exact-address-internal-migrate.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/unset-exact-address-internal-migrate.ts --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	(datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ??
	process.env.SANITY_STUDIO_DATASET ??
	'development';

if (dataset === 'production') {
	console.error('Refusing to run against the production dataset.');
	process.exit(1);
}

/** Both listing types embed the shared `locationFields` object. */
const DOCUMENT_TYPES = ['propertyListing', 'development'] as const;

/** Internal address path removed from the schema. */
const UNSET_PATHS = ['location.exactAddressInternal'] as const;

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config/sanity/config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

async function fetchCandidates(client: SanityClient): Promise<Array<{ _id: string; _type: string }>> {
	const orClauses = UNSET_PATHS.map((path) => `defined(${path})`).join(' || ');
	return client.fetch<Array<{ _id: string; _type: string }>>(
		`*[_type in $types && (${orClauses})]{ _id, _type }`,
		{ types: DOCUMENT_TYPES }
	);
}

async function main() {
	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Either export SANITY_API_TOKEN=… or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		token: TOKEN,
		apiVersion: '2024-01-01',
		useCdn: false
	});

	console.log(
		`Unset internal exact address → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const candidates = await fetchCandidates(client);
	console.log(`Found ${candidates.length} document(s) carrying an internal exact address.`);

	for (const doc of candidates) {
		console.log(`  ${doc._type} ${doc._id}: unset ${UNSET_PATHS.length} path(s)`);
		if (dryRun) continue;
		await client
			.patch(doc._id)
			.unset([...UNSET_PATHS])
			.commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Migration complete.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
