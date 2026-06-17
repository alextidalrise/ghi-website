#!/usr/bin/env node
/**
 * Unset the removed `assetCategory` and `order` fields from every mediaAssetMetadata
 * object in the dataset.
 *
 * Both fields have been removed from the schema globally. They live nested at any
 * depth inside mediaAssetMetadata objects (gallery items, galleryGroups images,
 * floorplans, thumbnailOverride, brochure, sharedGallery, heroImage, openGraphImage,
 * golfCourse media, guide section images, partner logos, siteSettings hero, unit /
 * unitType galleries…). We recurse each document and, for every object whose
 * `_type === 'mediaAssetMetadata'`, collect a Sanity unset path for any `assetCategory`
 * / `order` key it carries. Array items are addressed by `_key` when present.
 *
 * `order` is intentionally scoped to mediaAssetMetadata objects only — unrelated
 * top-level `order` fields (e.g. partner category ordering) must be left intact.
 *
 * This is hygiene cleanup: dropping the schema fields already makes leftover data
 * invisible and unprojected, so it is safe to defer.
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/unset-media-asset-metadata-fields-migrate.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/unset-media-asset-metadata-fields-migrate.ts --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

/** Every document type that embeds a mediaAssetMetadata object somewhere. */
const DOCUMENT_TYPES = [
	'propertyListing',
	'development',
	'unit',
	'unitType',
	'golfCourse',
	'locationTaxonomy',
	'siteSettings',
	'guide',
	'partner'
] as const;

const SYSTEM_KEYS = new Set(['_id', '_rev', '_type', '_key', '_ref', '_createdAt', '_updatedAt']);

/** Fields removed from the mediaAssetMetadata object type. */
const TARGET_KEYS = ['assetCategory', 'order'] as const;

type DocumentRecord = { _id: string; _type: string; [key: string]: unknown };

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

if (dataset === 'production') {
	console.error('Refusing to run against the production dataset.');
	process.exit(1);
}

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

/**
 * Collect unset paths for `assetCategory` / `order` keys, but only on objects that
 * are themselves mediaAssetMetadata. Always recurse so nested media assets (inside
 * arrays/objects) are reached.
 */
function collectMediaMetadataPaths(value: unknown, basePath: string, out: string[]): void {
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			if (item && typeof item === 'object') {
				const key = (item as { _key?: unknown })._key;
				const segment = typeof key === 'string' ? `[_key=="${key}"]` : `[${index}]`;
				collectMediaMetadataPaths(item, `${basePath}${segment}`, out);
			}
		});
		return;
	}

	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		const isMediaAsset = record._type === 'mediaAssetMetadata';
		for (const [key, child] of Object.entries(record)) {
			if (SYSTEM_KEYS.has(key)) continue;
			const path = basePath ? `${basePath}.${key}` : key;
			if (isMediaAsset && (TARGET_KEYS as readonly string[]).includes(key)) {
				out.push(path);
			} else {
				collectMediaMetadataPaths(child, path, out);
			}
		}
	}
}

async function fetchDocuments(client: SanityClient): Promise<DocumentRecord[]> {
	return client.fetch<DocumentRecord[]>(`*[_type in $types]`, { types: DOCUMENT_TYPES });
}

async function main() {
	if (!TOKEN) {
		console.error('Missing SANITY_API_TOKEN or Sanity CLI auth token.');
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		token: TOKEN,
		apiVersion: '2024-01-01',
		useCdn: false
	});

	const documents = await fetchDocuments(client);
	let migratedCount = 0;
	let fieldCount = 0;

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);

	for (const doc of documents) {
		const paths: string[] = [];
		collectMediaMetadataPaths(doc, '', paths);
		if (paths.length === 0) continue;

		migratedCount++;
		fieldCount += paths.length;
		console.log(`  ${doc._type} ${doc._id}: unsetting ${paths.length} field(s)`);

		if (dryRun) continue;

		await client.patch(doc._id).unset(paths).commit({ autoGenerateArrayKeys: false });
	}

	console.log(
		migratedCount === 0
			? 'No documents had assetCategory/order to unset.'
			: dryRun
				? `Dry run: ${migratedCount} document(s) / ${fieldCount} field(s) would be unset.`
				: `Migration complete: ${migratedCount} document(s) / ${fieldCount} field(s) unset.`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
