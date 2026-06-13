#!/usr/bin/env tsx
/**
 * One-time wipe of legacy gating fields after the Sanity gating redesign.
 *
 * The new model expresses publishability with five fields only:
 *   - status (top-level)
 *   - pricing.availabilityStatus
 *   - pricing.priceConfirmed
 *   - reviewItems[]
 *   - internal { … }
 *
 * Every other governance field that the previous model carried is removed.
 * This script unsets those legacy paths from `propertyListing`, `development`,
 * `unit`, and `unitType` documents in the target dataset (defaults to
 * `development`). It is intentionally one-shot — there is no data migration:
 * launch content is reauthored under the new model on a fresh dev dataset.
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/wipe-legacy-gating-fields.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/wipe-legacy-gating-fields.ts --dataset development --dry-run
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

/**
 * Field paths to unset on each gateable document. Every entry here was part of
 * the pre-redesign governance model and has no representation in the new five
 * fields above.
 */
const LEGACY_PATHS = [
	// workflow object (entirely removed; replaced by top-level status + reviewItems)
	'workflow',
	// document-level governance flags that lived alongside workflow
	'sensitiveGovernance',
	'privateReporting',
	'sourceProvenance',
	'sourceFolderUrl',
	// pricing fields collapsed away
	'pricing.publicVisibility',
	'pricing.priceSourceStatus',
	'pricing.priceReviewedAt',
	'pricing.priceReviewedBy',
	'pricing.communityFeesAmount',
	'pricing.communityFeesPeriod',
	'pricing.ibiAmount',
	'pricing.garbageTaxAmount',
	'pricing.feesTaxSource',
	'pricing.feesTaxVisibility',
	// media fields collapsed to brochurePublic boolean
	'media.brochureVisibility',
	// development-level brochureVisibility (separate from media.*)
	'brochureVisibility',
	// unit-only legacy notes field, content already migrated to internal.notes
	// by migrate-unit-specific-notes.ts. Safety net for any re-runs.
	'unitSpecificNotes'
] as const;

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
	const orClauses = LEGACY_PATHS.map((path) => `defined(${path})`).join(' || ');
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
		`Wipe legacy gating fields → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const candidates = await fetchCandidates(client);
	console.log(`Found ${candidates.length} document(s) carrying at least one legacy path.`);

	for (const doc of candidates) {
		console.log(`  ${doc._type} ${doc._id}: unset ${LEGACY_PATHS.length} path(s)`);
		if (dryRun) continue;
		await client.patch(doc._id).unset([...LEGACY_PATHS]).commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Wipe complete.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
