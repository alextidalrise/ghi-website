#!/usr/bin/env node
/**
 * Repair media.gallery (and galleryGroups) array keys after unset-hero-image migration.
 * Studio hides arrays when keys are missing or duplicated.
 *
 * Usage:
 *   pnpm --filter sanity migrate:fix-gallery-keys -- --dataset development
 *   pnpm --filter sanity migrate:fix-gallery-keys -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const LISTING_TYPES = ['propertyListing', 'development'] as const;

type MediaAsset = {
	_type?: string;
	_key?: string;
	asset?: { asset?: { _ref?: string } };
	fileAsset?: { asset?: { _ref?: string } };
	[key: string]: unknown;
};

type GalleryGroup = {
	_key?: string;
	title?: string;
	images?: MediaAsset[];
};

type ListingDoc = {
	_id: string;
	_type: string;
	media?: {
		gallery?: MediaAsset[];
		galleryGroups?: GalleryGroup[];
	};
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) {
		return undefined;
	}

	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
			authToken?: string;
		};
		return config.authToken;
	} catch {
		return undefined;
	}
}

function randomKey(length = 12): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

function assetRef(asset: MediaAsset): string | null {
	return asset.asset?.asset?._ref ?? asset.fileAsset?.asset?._ref ?? null;
}

/** Drop later duplicates that share the same uploaded asset ref. */
function dedupeGalleryByAssetRef(items: MediaAsset[]): MediaAsset[] {
	const seen = new Set<string>();
	const next: MediaAsset[] = [];

	for (const item of items) {
		const ref = assetRef(item);
		if (ref) {
			if (seen.has(ref)) continue;
			seen.add(ref);
		}
		next.push(item);
	}

	return next;
}

function ensureUniqueKeys(items: MediaAsset[]): { next: MediaAsset[]; changed: boolean } {
	const used = new Set<string>();
	let changed = false;

	const next = items.map((item) => {
		let key = item._key?.trim();
		if (!key || used.has(key)) {
			let newKey = randomKey();
			while (used.has(newKey)) newKey = randomKey();
			key = newKey;
			changed = true;
		}
		used.add(key);
		if (key !== item._key) {
			return { ...item, _key: key };
		}
		return item;
	});

	return { next, changed };
}

function normalizeGallery(items: MediaAsset[] | undefined): {
	next: MediaAsset[];
	changed: boolean;
} {
	if (!Array.isArray(items) || items.length === 0) {
		return { next: items ?? [], changed: false };
	}

	const deduped = dedupeGalleryByAssetRef(items);
	const dedupeChanged = deduped.length !== items.length;
	const { next, changed: keysChanged } = ensureUniqueKeys(deduped);

	return { next, changed: dedupeChanged || keysChanged };
}

function normalizeGalleryGroups(groups: GalleryGroup[] | undefined): {
	next: GalleryGroup[];
	changed: boolean;
} {
	if (!Array.isArray(groups) || groups.length === 0) {
		return { next: groups ?? [], changed: false };
	}

	let changed = false;
	const next = groups.map((group) => {
		const images = normalizeGallery(group.images);
		if (images.changed) changed = true;
		return images.changed ? { ...group, images: images.next } : group;
	});

	return { next, changed };
}

function galleryNeedsFix(items: MediaAsset[] | undefined): boolean {
	if (!Array.isArray(items) || items.length === 0) return false;
	const keys = items.map((item) => item._key?.trim() ?? '');
	const unique = new Set(keys.filter(Boolean));
	if (keys.some((key) => !key)) return true;
	if (keys.filter(Boolean).length !== unique.size) return true;

	const refs = items.map((item) => assetRef(item)).filter(Boolean) as string[];
	return new Set(refs).size !== refs.length;
}

function createMigrationClient(): SanityClient {
	if (!TOKEN) {
		throw new Error('Missing Sanity token. Set SANITY_API_TOKEN or log in via sanity CLI.');
	}

	return createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token: TOKEN,
		useCdn: false,
		perspective: 'raw'
	});
}

async function fetchListings(client: SanityClient): Promise<ListingDoc[]> {
	return client.fetch(
		`*[
			_type in $types
			&& (
				defined(media.gallery)
				|| defined(media.galleryGroups)
			)
		]{
			_id,
			_type,
			media{
				gallery,
				galleryGroups
			}
		}`,
		{ types: LISTING_TYPES }
	);
}

async function main() {
	const client = createMigrationClient();
	const listings = await fetchListings(client);
	const needsFix = listings.filter(
		(doc) =>
			galleryNeedsFix(doc.media?.gallery) ||
			(doc.media?.galleryGroups ?? []).some((group) => galleryNeedsFix(group.images))
	);

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Listings with media.gallery/groups: ${listings.length}`);
	console.log(`Listings needing key repair: ${needsFix.length}`);

	if (needsFix.length === 0) {
		return;
	}

	const transaction = client.transaction();
	let galleryPatches = 0;
	let groupPatches = 0;

	for (const doc of needsFix) {
		const gallery = normalizeGallery(doc.media?.gallery);
		if (gallery.changed) {
			galleryPatches++;
			transaction.patch(doc._id, { set: { 'media.gallery': gallery.next } });
		}

		const groups = normalizeGalleryGroups(doc.media?.galleryGroups);
		if (groups.changed) {
			groupPatches++;
			transaction.patch(doc._id, { set: { 'media.galleryGroups': groups.next } });
		}
	}

	console.log(`Gallery patches: ${galleryPatches}`);
	console.log(`Gallery group patches: ${groupPatches}`);

	if (dryRun) {
		console.log(
			'Would patch:',
			needsFix.map((doc) => doc._id).join(', ')
		);
		return;
	}

	await transaction.commit();
	console.log(`Repaired ${needsFix.length} document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
