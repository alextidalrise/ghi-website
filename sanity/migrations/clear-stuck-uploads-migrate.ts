#!/usr/bin/env node
/**
 * Clear stuck/interrupted image & file uploads from the dataset.
 *
 * When an asset upload is interrupted in Studio, the document keeps an optimistic
 * asset reference of the shape `{ _type: 'reference', _ref: 'image-…', _upload: {…} }`.
 * The `_upload` block is transient upload-progress metadata that Studio normally
 * strips once the upload completes. If the upload never finishes, autosave persists
 * it into the (draft) document and every subsequent commit is rejected by the API
 * with `Key "_upload" not allowed in ref`, which wedges the document entirely.
 *
 * This recursively finds every reference object that still carries an `_upload` key
 * (at any depth — gallery items, galleryGroups, thumbnailOverride, brochure,
 * sharedGallery, golf media, hero, etc.) and unsets that whole reference object so
 * the field returns to empty and ready for a fresh upload. Drafts are included
 * (they share `_type`, so the `*[_type in $types]` query returns them too).
 *
 * Usage:
 *   pnpm --filter sanity migrate:clear-stuck-uploads -- --dataset production --dry-run
 *   pnpm --filter sanity migrate:clear-stuck-uploads -- --dataset production
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
	'siteSettings',
	'partner',
	'guide'
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

/**
 * Collect the path of every reference object that still carries an `_upload` key.
 * The recorded path points at the reference object itself (e.g. `media.gallery[_key=="x"].asset`),
 * so unsetting it removes the half-uploaded `_ref` + `_upload` cleanly. Array items are
 * addressed by `_key` when present.
 */
function collectStuckUploadPaths(value: unknown, basePath: string, out: string[]): void {
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			if (item && typeof item === 'object') {
				const key = (item as { _key?: unknown })._key;
				const segment = typeof key === 'string' ? `[_key=="${key}"]` : `[${index}]`;
				collectStuckUploadPaths(item, `${basePath}${segment}`, out);
			}
		});
		return;
	}

	if (value && typeof value === 'object') {
		// A reference object mid-upload carries `_upload`; record and don't recurse into it.
		if (Object.prototype.hasOwnProperty.call(value, '_upload') && basePath) {
			out.push(basePath);
			return;
		}
		for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
			if (SYSTEM_KEYS.has(key)) continue;
			const path = basePath ? `${basePath}.${key}` : key;
			collectStuckUploadPaths(child, path, out);
		}
	}
}

async function fetchDocuments(client: SanityClient): Promise<DocumentRecord[]> {
	return client.fetch<DocumentRecord[]>(`*[_type in $types]`, { types: DOCUMENT_TYPES });
}

async function main() {
	if (!TOKEN) {
		console.error('Missing SANITY_API_TOKEN or Sanity CLI auth token (run `sanity login`).');
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
	let uploadCount = 0;

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);

	for (const doc of documents) {
		const paths: string[] = [];
		collectStuckUploadPaths(doc, '', paths);
		if (paths.length === 0) continue;

		migratedCount++;
		uploadCount += paths.length;
		console.log(`  ${doc._type} ${doc._id}: clearing ${paths.length} stuck upload(s)`);
		for (const path of paths) console.log(`      - ${path}`);

		if (dryRun) continue;

		await client.patch(doc._id).unset(paths).commit({ autoGenerateArrayKeys: false });
	}

	console.log(
		migratedCount === 0
			? 'No stuck uploads found.'
			: dryRun
				? `Dry run: ${migratedCount} document(s) / ${uploadCount} stuck upload(s) would be cleared.`
				: `Done: ${migratedCount} document(s) / ${uploadCount} stuck upload(s) cleared.`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
