#!/usr/bin/env node
/**
 * Repair malformed `mediaAssetMetadata` image/file fields.
 *
 * The schema defines `mediaAssetMetadata.asset` as `type: 'image'` and `fileAsset` as
 * `type: 'file'`, so their stored value must be a wrapper object:
 *   asset: { _type: 'image', asset: { _type: 'reference', _ref: 'image-…' } }
 * A seed wrote some of these as a *bare reference* instead:
 *   asset: { _type: 'reference', _ref: 'image-…' }
 * The reference target is a perfectly healthy asset, but the Studio image input expects
 * the wrapper and finds none, so the field renders blank — and any upload onto it attaches
 * `_upload` directly to the bare ref, which the API rejects with
 * `Key "_upload" not allowed in ref`. This rewrites every bare-reference `asset`/`fileAsset`
 * inside a `mediaAssetMetadata` into the correct wrapper, preserving the `_ref`. Array items
 * are addressed by `_key`. Drafts are included.
 *
 * Usage:
 *   pnpm --filter sanity migrate:fix-media-asset-shape -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:fix-media-asset-shape -- --dataset development
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

// mediaAssetMetadata fields and the wrapper `_type` their value must have.
const WRAPPED_FIELDS: Record<string, 'image' | 'file'> = { asset: 'image', fileAsset: 'file' };

type DocumentRecord = { _id: string; _type: string; [key: string]: unknown };
type Fix = { path: string; value: Record<string, unknown> };

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

function isBareReference(v: unknown): v is { _type: 'reference'; _ref: string } {
	return (
		!!v &&
		typeof v === 'object' &&
		(v as { _type?: unknown })._type === 'reference' &&
		typeof (v as { _ref?: unknown })._ref === 'string'
	);
}

/** Collect every bare-reference asset/fileAsset inside a mediaAssetMetadata object. */
function collectFixes(value: unknown, basePath: string, out: Fix[]): void {
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			if (item && typeof item === 'object') {
				const key = (item as { _key?: unknown })._key;
				const segment = typeof key === 'string' ? `[_key=="${key}"]` : `[${index}]`;
				collectFixes(item, `${basePath}${segment}`, out);
			}
		});
		return;
	}

	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		// `mediaAsset` is a stale/typo'd alias for `mediaAssetMetadata` left by a seed.
		if (obj._type === 'mediaAssetMetadata' || obj._type === 'mediaAsset') {
			if (obj._type === 'mediaAsset' && basePath) {
				out.push({ path: `${basePath}._type`, value: 'mediaAssetMetadata' as unknown as Record<string, unknown> });
			}
			for (const [field, wrapperType] of Object.entries(WRAPPED_FIELDS)) {
				const fieldValue = obj[field];
				if (isBareReference(fieldValue)) {
					out.push({
						path: `${basePath}.${field}`,
						value: {
							_type: wrapperType,
							asset: { _type: 'reference', _ref: fieldValue._ref }
						}
					});
				}
			}
		}
		for (const [key, child] of Object.entries(obj)) {
			if (SYSTEM_KEYS.has(key)) continue;
			collectFixes(child, basePath ? `${basePath}.${key}` : key, out);
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
	let docCount = 0;
	let fixCount = 0;

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);

	for (const doc of documents) {
		const fixes: Fix[] = [];
		collectFixes(doc, '', fixes);
		if (fixes.length === 0) continue;

		docCount++;
		fixCount += fixes.length;
		console.log(`  ${doc._type} ${doc._id}: fixing ${fixes.length} field(s)`);
		for (const fix of fixes) console.log(`      - ${fix.path}`);

		if (dryRun) continue;

		const patch = client.patch(doc._id);
		for (const fix of fixes) patch.set({ [fix.path]: fix.value });
		await patch.commit({ autoGenerateArrayKeys: false });
	}

	console.log(
		docCount === 0
			? 'No malformed media asset fields found.'
			: dryRun
				? `Dry run: ${docCount} document(s) / ${fixCount} field(s) would be fixed.`
				: `Done: ${docCount} document(s) / ${fixCount} field(s) fixed.`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
