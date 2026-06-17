#!/usr/bin/env tsx
/**
 * Clean up the Marketing group on `propertyListing` and `development` documents.
 *
 * The shared `marketingFields` object now keeps only `marketingDescription`
 * (renamed from `longFormDescription`) and `keyHooks`. The old long-form copy is
 * copied across to the new field, and the retired marketing/CTA paths are unset
 * from existing documents in both document types.
 *
 * Renamed:
 *   marketing.longFormDescription → marketing.marketingDescription
 *
 * Removed:
 *   marketing.lifestyleAngle, marketing.investmentAngle, marketing.audienceFit,
 *   marketing.channelNotes, ctas.enquiryRouting
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/marketing-cleanup-migrate.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/marketing-cleanup-migrate.ts --dataset development --dry-run
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

/** Both listing types share the `marketingFields` and `ctaFields` objects. */
const DOCUMENT_TYPES = ['propertyListing', 'development'] as const;

/** Marketing/CTA paths removed from the schema. */
const UNSET_PATHS = [
	'marketing.longFormDescription',
	'marketing.lifestyleAngle',
	'marketing.investmentAngle',
	'marketing.audienceFit',
	'marketing.channelNotes',
	'ctas.enquiryRouting'
] as const;

type Candidate = {
	_id: string;
	_type: string;
	longFormDescription?: unknown;
	marketingDescription?: unknown;
};

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

async function fetchCandidates(client: SanityClient): Promise<Candidate[]> {
	const orClauses = UNSET_PATHS.map((path) => `defined(${path})`).join(' || ');
	return client.fetch<Candidate[]>(
		`*[_type in $types && (${orClauses})]{
			_id,
			_type,
			"longFormDescription": marketing.longFormDescription,
			"marketingDescription": marketing.marketingDescription
		}`,
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

	console.log(`Marketing cleanup → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	const candidates = await fetchCandidates(client);
	console.log(`Found ${candidates.length} document(s) carrying retired marketing data.`);

	for (const doc of candidates) {
		// Copy long-form copy into the renamed field when it has content and the
		// new field is not already populated.
		const willCopy = doc.longFormDescription != null && doc.marketingDescription == null;
		console.log(
			`  ${doc._type} ${doc._id}: ${willCopy ? 'copy longFormDescription→marketingDescription, ' : ''}unset ${UNSET_PATHS.length} path(s)`
		);
		if (dryRun) continue;

		let patch = client.patch(doc._id);
		if (willCopy) {
			patch = patch.set({ 'marketing.marketingDescription': doc.longFormDescription });
		}
		await patch.unset([...UNSET_PATHS]).commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Migration complete.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
