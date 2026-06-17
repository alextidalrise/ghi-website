#!/usr/bin/env tsx
/**
 * Remove retired website-content and media fields from `propertyListing` documents.
 *
 * Properties now use slim `propertyContentFields` / `propertyMediaFields` objects.
 * The following paths no longer exist on the property schema and are unset from
 * existing documents; each object's `_type` is rewritten so docs adopt the new
 * object type names. Developments keep the shared `contentFields` / `mediaFields`
 * shapes and are untouched.
 *
 * Removed for properties:
 *   content.locationDescription, content.golfDescription, content.amenities
 *   media.galleryGroups, media.thumbnailOverride
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/unset-property-content-media-fields-migrate.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/unset-property-content-media-fields-migrate.ts --dataset development --dry-run
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

/** Content + media paths removed from the property schema. */
const UNSET_PATHS = [
	'content.locationDescription',
	'content.golfDescription',
	'content.amenities',
	'media.galleryGroups',
	'media.thumbnailOverride'
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
		`*[_type in $types && ((${orClauses}) || content._type == "contentFields" || media._type == "mediaFields")]{ _id, _type }`,
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
		`Unset property content/media fields → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const candidates = await fetchCandidates(client);
	console.log(`Found ${candidates.length} property document(s) carrying retired content/media data.`);

	for (const doc of candidates) {
		console.log(`  ${doc._type} ${doc._id}: unset ${UNSET_PATHS.length} path(s) + retype content/media`);
		if (dryRun) continue;
		await client
			.patch(doc._id)
			.unset([...UNSET_PATHS])
			.set({ 'content._type': 'propertyContentFields', 'media._type': 'propertyMediaFields' })
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
