#!/usr/bin/env tsx
/**
 * Remove the retired `reviewStatus` field from `golfCourse` documents.
 *
 * The Review status field and its public gate have been removed — golf course
 * visibility is now controlled purely by Sanity draft/publish document status.
 * This unsets the now-orphaned `reviewStatus` value from existing documents
 * (published and drafts).
 *
 * ORDER MATTERS: run this ONLY AFTER the code change that removes the
 * `coalesce(reviewStatus, "draft") == "approved"` gate has deployed. The
 * currently-deployed site still gates on this field, so unsetting it before the
 * new code is live would coalesce the 7 approved courses to "draft" and pull
 * them off the site.
 *
 * Usage:
 *   pnpm --filter sanity migrate:unset-golf-review-status -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:unset-golf-review-status -- --dataset development
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

async function main() {
	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Either export SANITY_API_TOKEN=… or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}

	const client: SanityClient = createClient({
		projectId: PROJECT_ID,
		dataset,
		token: TOKEN,
		apiVersion: '2024-01-01',
		useCdn: false
	});

	console.log(`Unset golfCourse.reviewStatus → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	// Default (raw) perspective with a token returns published + draft docs.
	const candidates = await client.fetch<Array<{ _id: string }>>(
		`*[_type == "golfCourse" && defined(reviewStatus)]{ _id }`
	);
	console.log(`Found ${candidates.length} golf course document(s) carrying reviewStatus.`);

	for (const doc of candidates) {
		console.log(`  ${doc._id}: unset reviewStatus`);
		if (dryRun) continue;
		await client.patch(doc._id).unset(['reviewStatus']).commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Migration complete.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
