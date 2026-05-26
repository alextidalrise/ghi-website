#!/usr/bin/env node
/**
 * Migrate legacy imageRightsStatus values to the refreshed enum.
 *
 * Usage:
 *   pnpm --filter sanity migrate:image-rights -- --dataset development
 *   pnpm --filter sanity migrate:image-rights -- --dataset development --dry-run
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

const RIGHTS_MAP: Record<string, string> = {
	assumed_approved: 'source_pack_provided',
	confirmed_approved: 'approved',
	needs_review: 'needs_rights_review',
	restricted: 'rejected',
	do_not_use: 'rejected'
};

const MEDIA_PATHS = [
	'media.heroImage',
	'media.gallery',
	'media.floorplans',
	'media.brochure',
	'media.thumbnailOverride',
	'media.galleryGroups',
	'sharedGallery',
	'floorplans',
	'seo.openGraphImage'
] as const;

type MediaAsset = {
	_type?: string;
	imageRightsStatus?: string;
	images?: MediaAsset[];
	[key: string]: unknown;
};

type DocumentRecord = {
	_id: string;
	_type: string;
	media?: Record<string, unknown>;
	sharedGallery?: MediaAsset[];
	floorplans?: MediaAsset[];
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

function mapRightsStatus(status: string | undefined): string | undefined {
	if (!status) return undefined;
	return RIGHTS_MAP[status] ?? status;
}

function migrateAsset(asset: MediaAsset | null | undefined): {
	asset: MediaAsset | null | undefined;
	changed: boolean;
} {
	if (!asset || typeof asset !== 'object') {
		return { asset, changed: false };
	}

	const nextStatus = mapRightsStatus(asset.imageRightsStatus);
	if (!nextStatus || nextStatus === asset.imageRightsStatus) {
		return { asset, changed: false };
	}

	return {
		asset: { ...asset, imageRightsStatus: nextStatus },
		changed: true
	};
}

function migrateAssetList(
	assets: MediaAsset[] | null | undefined
): { assets: MediaAsset[] | null | undefined; changed: boolean } {
	if (!Array.isArray(assets)) {
		return { assets, changed: false };
	}

	let changed = false;
	const next = assets.map((item) => {
		const result = migrateAsset(item);
		if (result.changed) changed = true;
		return result.asset ?? item;
	});

	return { assets: next, changed };
}

function migrateGalleryGroups(
	groups: Array<{ images?: MediaAsset[]; [key: string]: unknown }> | null | undefined
): { groups: typeof groups; changed: boolean } {
	if (!Array.isArray(groups)) {
		return { groups, changed: false };
	}

	let changed = false;
	const next = groups.map((group) => {
		const result = migrateAssetList(group.images);
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

		for (const key of ['heroImage', 'brochure', 'thumbnailOverride'] as const) {
			const result = migrateAsset(media[key] as MediaAsset);
			if (result.changed) {
				patch[`media.${key}`] = result.asset;
				changed = true;
			}
		}

		for (const key of ['gallery', 'floorplans'] as const) {
			const result = migrateAssetList(media[key] as MediaAsset[]);
			if (result.changed) {
				patch[`media.${key}`] = result.assets;
				changed = true;
			}
		}

		const groupsResult = migrateGalleryGroups(
			media.galleryGroups as Array<{ images?: MediaAsset[] }> | undefined
		);
		if (groupsResult.changed) {
			patch['media.galleryGroups'] = groupsResult.groups;
			changed = true;
		}
	}

	if (doc.sharedGallery) {
		const result = migrateAssetList(doc.sharedGallery);
		if (result.changed) {
			patch.sharedGallery = result.assets;
			changed = true;
		}
	}

	if (doc.floorplans) {
		const result = migrateAssetList(doc.floorplans);
		if (result.changed) {
			patch.floorplans = result.assets;
			changed = true;
		}
	}

	if (doc.seo?.openGraphImage) {
		const result = migrateAsset(doc.seo.openGraphImage);
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
		console.log(`  ${doc._type} ${doc._id}: updating image rights`);

		if (dryRun) continue;

		await client.patch(doc._id).set(patch).commit({ autoGenerateArrayKeys: false });
	}

	console.log(
		migratedCount === 0
			? 'No documents needed image rights migration.'
			: dryRun
				? `Dry run: ${migratedCount} document(s) would be updated.`
				: `Migration complete: ${migratedCount} document(s) updated.`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
