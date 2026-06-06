#!/usr/bin/env node
/**
 * Unset the removed `caption` field from every mediaAssetMetadata object in the dataset.
 *
 * The image caption feature has been removed from the schema and the site. `caption`
 * is unique to mediaAssetMetadata, so we recursively collect a Sanity unset path for
 * every `caption` key found anywhere in a document (gallery items, galleryGroups,
 * floorplans, thumbnailOverride, brochure, sharedGallery, heroImage, openGraphImage,
 * golfCourse media, unit/unitType galleries, siteSettings hero — at any depth) and
 * unset them all in a single patch. Array items are addressed by `_key` when present.
 *
 * Usage:
 *   pnpm --filter sanity migrate:unset-caption -- --dataset development
 *   pnpm --filter sanity migrate:unset-caption -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = [
	'propertyListing',
	'development',
	'unit',
	'unitType',
	'golfCourse',
	'locationTaxonomy',
	'siteSettings'
] as const;

const SYSTEM_KEYS = new Set(['_id', '_rev', '_type', '_key', '_ref', '_createdAt', '_updatedAt']);

type DocumentRecord = { _id: string; _type: string; [key: string]: unknown };

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

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

/** Collect Sanity unset paths for every `caption` key found anywhere in `value`. */
function collectCaptionPaths(value: unknown, basePath: string, out: string[]): void {
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			if (item && typeof item === 'object') {
				const key = (item as { _key?: unknown })._key;
				const segment = typeof key === 'string' ? `[_key=="${key}"]` : `[${index}]`;
				collectCaptionPaths(item, `${basePath}${segment}`, out);
			}
		});
		return;
	}

	if (value && typeof value === 'object') {
		for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
			if (SYSTEM_KEYS.has(key)) continue;
			const path = basePath ? `${basePath}.${key}` : key;
			if (key === 'caption') {
				out.push(path);
			} else {
				collectCaptionPaths(child, path, out);
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
	let captionCount = 0;

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);

	for (const doc of documents) {
		const paths: string[] = [];
		collectCaptionPaths(doc, '', paths);
		if (paths.length === 0) continue;

		migratedCount++;
		captionCount += paths.length;
		console.log(`  ${doc._type} ${doc._id}: unsetting ${paths.length} caption(s)`);

		if (dryRun) continue;

		await client.patch(doc._id).unset(paths).commit({ autoGenerateArrayKeys: false });
	}

	console.log(
		migratedCount === 0
			? 'No documents had captions to unset.'
			: dryRun
				? `Dry run: ${migratedCount} document(s) / ${captionCount} caption(s) would be unset.`
				: `Migration complete: ${migratedCount} document(s) / ${captionCount} caption(s) unset.`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
