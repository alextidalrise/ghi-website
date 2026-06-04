#!/usr/bin/env node
/**
 * Unset legacy media rights / branding governance fields from all mediaAssetMetadata objects.
 *
 * Usage:
 *   pnpm --filter sanity migrate:unset-media-rights -- --dataset development
 *   pnpm --filter sanity migrate:unset-media-rights -- --dataset development --dry-run
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
	'golfCourse'
] as const;

const GOVERNANCE_FIELDS = [
	'assetBrandingType',
	'imageRightsStatus',
	'publicUseApproved',
	'requiresRebrandOrCrop',
	'brandingNotes',
	'imageUsageNotes',
	'approvedBy',
	'approvedAt'
] as const;

type MediaAsset = {
	_type?: string;
	images?: MediaAsset[];
	[key: string]: unknown;
};

type DocumentRecord = {
	_id: string;
	_type: string;
	media?: Record<string, unknown>;
	sharedGallery?: MediaAsset[];
	floorplans?: MediaAsset[];
	gallery?: MediaAsset[];
	unitGallery?: MediaAsset[];
	floorplan?: MediaAsset;
	seo?: { openGraphImage?: MediaAsset };
};

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

function stripGovernanceFields(asset: MediaAsset): { asset: MediaAsset; changed: boolean } {
	let changed = false;
	const next = { ...asset };

	for (const field of GOVERNANCE_FIELDS) {
		if (field in next) {
			delete next[field];
			changed = true;
		}
	}

	return { asset: next, changed };
}

function processAsset(asset: MediaAsset | null | undefined): {
	asset: MediaAsset | null | undefined;
	changed: boolean;
} {
	if (!asset || typeof asset !== 'object') {
		return { asset, changed: false };
	}
	return stripGovernanceFields(asset);
}

function processAssetList(
	assets: MediaAsset[] | null | undefined
): { assets: MediaAsset[] | null | undefined; changed: boolean } {
	if (!Array.isArray(assets)) {
		return { assets, changed: false };
	}

	let changed = false;
	const next = assets.map((item) => {
		const result = processAsset(item);
		if (result.changed) changed = true;
		return result.asset ?? item;
	});

	return { assets: next, changed };
}

function processGalleryGroups(
	groups: Array<{ images?: MediaAsset[]; [key: string]: unknown }> | null | undefined
): { groups: typeof groups; changed: boolean } {
	if (!Array.isArray(groups)) {
		return { groups, changed: false };
	}

	let changed = false;
	const next = groups.map((group) => {
		const result = processAssetList(group.images);
		if (result.changed) changed = true;
		return { ...group, images: result.assets ?? undefined };
	});

	return { groups: next, changed };
}

function migrateDocument(doc: DocumentRecord): { patch: Record<string, unknown>; changed: boolean } {
	const patch: Record<string, unknown> = {};
	let changed = false;

	if (doc.media) {
		const media = doc.media as Record<string, unknown>;

		for (const key of ['brochure', 'thumbnailOverride'] as const) {
			const result = processAsset(media[key] as MediaAsset);
			if (result.changed) {
				patch[`media.${key}`] = result.asset;
				changed = true;
			}
		}

		for (const key of ['gallery', 'floorplans'] as const) {
			const result = processAssetList(media[key] as MediaAsset[]);
			if (result.changed) {
				patch[`media.${key}`] = result.assets;
				changed = true;
			}
		}

		const groupsResult = processGalleryGroups(
			media.galleryGroups as Array<{ images?: MediaAsset[] }> | undefined
		);
		if (groupsResult.changed) {
			patch['media.galleryGroups'] = groupsResult.groups;
			changed = true;
		}
	}

	if (doc.sharedGallery) {
		const result = processAssetList(doc.sharedGallery);
		if (result.changed) {
			patch.sharedGallery = result.assets;
			changed = true;
		}
	}

	if (doc.floorplans) {
		const result = processAssetList(doc.floorplans);
		if (result.changed) {
			patch.floorplans = result.assets;
			changed = true;
		}
	}

	if (doc.gallery) {
		const result = processAssetList(doc.gallery);
		if (result.changed) {
			patch.gallery = result.assets;
			changed = true;
		}
	}

	if (doc.unitGallery) {
		const result = processAssetList(doc.unitGallery);
		if (result.changed) {
			patch.unitGallery = result.assets;
			changed = true;
		}
	}

	if (doc.floorplan) {
		const result = processAsset(doc.floorplan);
		if (result.changed) {
			patch.floorplan = result.asset;
			changed = true;
		}
	}

	if (doc.seo?.openGraphImage) {
		const result = processAsset(doc.seo.openGraphImage);
		if (result.changed) {
			patch['seo.openGraphImage'] = result.asset;
			changed = true;
		}
	}

	return { patch, changed };
}

async function fetchDocuments(client: SanityClient): Promise<DocumentRecord[]> {
	return client.fetch<DocumentRecord[]>(
		`*[_type in $types]{
			_id,
			_type,
			media,
			sharedGallery,
			floorplans,
			gallery,
			unitGallery,
			floorplan,
			seo{ openGraphImage }
		}`,
		{ types: DOCUMENT_TYPES }
	);
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

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);

	for (const doc of documents) {
		const { patch, changed } = migrateDocument(doc);
		if (!changed) continue;

		migratedCount++;
		console.log(`  ${doc._type} ${doc._id}: unsetting media governance fields`);

		if (dryRun) continue;

		await client.patch(doc._id).set(patch).commit({ autoGenerateArrayKeys: false });
	}

	console.log(
		migratedCount === 0
			? 'No documents had media governance fields to unset.'
			: dryRun
				? `Dry run: ${migratedCount} document(s) would be updated.`
				: `Migration complete: ${migratedCount} document(s) updated.`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
