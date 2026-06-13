#!/usr/bin/env tsx
/**
 * Backfill `status = "draft"` on every gateable document that is missing
 * a status. The Sanity gating redesign made `status` a required field on
 * `propertyListing`, `development`, `unit`, and `unitType`, but pre-redesign
 * documents have no value, which surfaces a validation error in Studio.
 *
 * This script is idempotent: it only patches docs where `status` is not
 * defined. Re-running it after a successful pass will report zero candidates.
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/set-default-status-migrate.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/set-default-status-migrate.ts --dataset development --dry-run
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

const DOCUMENT_TYPES = ['propertyListing', 'development', 'unit', 'unitType'] as const;
const DEFAULT_STATUS = 'draft';

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

async function fetchCandidates(
	client: SanityClient
): Promise<Array<{ _id: string; _type: string }>> {
	return client.fetch<Array<{ _id: string; _type: string }>>(
		`*[_type in $types && !defined(status)]{ _id, _type }`,
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
		`Backfill status="${DEFAULT_STATUS}" → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const candidates = await fetchCandidates(client);
	console.log(`Found ${candidates.length} document(s) missing a status value.`);

	for (const doc of candidates) {
		console.log(`  ${doc._type} ${doc._id}: set status=${DEFAULT_STATUS}`);
		if (dryRun) continue;
		await client.patch(doc._id).set({ status: DEFAULT_STATUS }).commit();
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Backfill complete.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
