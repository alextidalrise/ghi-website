#!/usr/bin/env tsx
/**
 * Remove the legacy pricing/availability fields from `propertyListing` documents.
 *
 * Properties now use the slim `propertyPricingFields` object (price, priceDisplay,
 * currency). The following pricing paths no longer exist on the property schema and
 * are unset from existing documents. The object's `_type` is also rewritten so docs
 * adopt the new object type name. Developments, units and unit types are untouched —
 * they keep the shared `pricingFields` shape.
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/unset-property-pricing-fields-migrate.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/unset-property-pricing-fields-migrate.ts --dataset development --dry-run
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

/** Only Properties lose these fields. */
const DOCUMENT_TYPES = ['propertyListing'] as const;

/** Pricing paths removed from the property schema. */
const UNSET_PATHS = [
	'pricing.priceFrom',
	'pricing.priceTo',
	'pricing.priceQualifier',
	'pricing.priceConfirmed',
	'pricing.availabilityStatus',
	'pricing.completionStatus',
	'pricing.completionDate',
	'pricing.buildStatus'
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
	const orClauses = UNSET_PATHS.map((path) => `defined(${path})`).join(' || ');
	return client.fetch<Array<{ _id: string; _type: string }>>(
		`*[_type in $types && ((${orClauses}) || pricing._type == "pricingFields")]{ _id, _type }`,
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
		`Unset property pricing fields → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const candidates = await fetchCandidates(client);
	console.log(`Found ${candidates.length} property document(s) carrying legacy pricing data.`);

	for (const doc of candidates) {
		console.log(`  ${doc._type} ${doc._id}: unset ${UNSET_PATHS.length} path(s) + retype pricing`);
		if (dryRun) continue;
		await client
			.patch(doc._id)
			.unset([...UNSET_PATHS])
			.set({ 'pricing._type': 'propertyPricingFields' })
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
