#!/usr/bin/env node
/**
 * Move media.heroImage into gallery position 1, then remove the dedicated hero field.
 *
 * Usage:
 *   pnpm --filter sanity migrate:unset-hero-image -- --dataset development
 *   pnpm --filter sanity migrate:unset-hero-image -- --dataset development --dry-run
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
	asset?: { asset?: { _ref?: string } };
	fileAsset?: { asset?: { _ref?: string } };
	_key?: string;
	[key: string]: unknown;
};

type ListingDoc = {
	_id: string;
	_type: string;
	media?: {
		heroImage?: MediaAsset;
		gallery?: MediaAsset[];
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

function createMigrationClient(): SanityClient {
	if (!TOKEN) {
		throw new Error('Missing Sanity token. Set SANITY_API_TOKEN or log in via sanity CLI.');
	}

	return createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token: TOKEN,
		useCdn: false
	});
}

function assetRef(asset: MediaAsset | null | undefined): string | null {
	if (!asset) return null;
	return asset.asset?.asset?._ref ?? asset.fileAsset?.asset?._ref ?? null;
}

function sameAsset(a: MediaAsset | null | undefined, b: MediaAsset | null | undefined): boolean {
	const refA = assetRef(a);
	const refB = assetRef(b);
	if (refA && refB) return refA === refB;
	return false;
}

function ensureUniqueKeys(items: MediaAsset[]): MediaAsset[] {
	const used = new Set<string>();

	return items.map((item) => {
		let key = item._key?.trim();
		if (!key || used.has(key)) {
			let newKey = randomKey();
			while (used.has(newKey)) newKey = randomKey();
			key = newKey;
		}
		used.add(key);
		return key === item._key ? item : { ...item, _key: key };
	});
}

/** Merge hero into gallery front; skip duplicate asset refs; assign unique keys. */
function buildGalleryPatch(doc: ListingDoc): MediaAsset[] | undefined {
	const hero = doc.media?.heroImage;
	if (!hero) return undefined;

	const gallery = doc.media?.gallery ?? [];

	if (gallery.length === 0) {
		return ensureUniqueKeys([{ ...hero, _key: hero._key?.trim() || randomKey() }]);
	}

	if (gallery.some((item) => sameAsset(item, hero))) {
		return ensureUniqueKeys(gallery);
	}

	return ensureUniqueKeys([{ ...hero, _key: hero._key?.trim() || randomKey() }, ...gallery]);
}

async function fetchListingsWithHeroImage(client: SanityClient): Promise<ListingDoc[]> {
	return client.fetch(
		`*[
			_type in $types
			&& defined(media.heroImage)
		]{
			_id,
			_type,
			media{
				heroImage,
				gallery
			}
		}`,
		{ types: LISTING_TYPES }
	);
}

async function main() {
	const client = createMigrationClient();
	const listings = await fetchListingsWithHeroImage(client);

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Listings with media.heroImage: ${listings.length}`);

	if (listings.length === 0) {
		return;
	}

	let setGallery = 0;
	let prependGallery = 0;
	let galleryUnchanged = 0;

	const transaction = client.transaction();

	for (const doc of listings) {
		const galleryPatch = buildGalleryPatch(doc);

		if (galleryPatch) {
			const hadGallery = (doc.media?.gallery ?? []).length > 0;
			const heroInGallery = hadGallery && doc.media!.gallery!.some((item) => sameAsset(item, doc.media!.heroImage));

			if (!hadGallery) {
				setGallery++;
			} else if (heroInGallery) {
				galleryUnchanged++;
			} else {
				prependGallery++;
			}
			transaction.patch(doc._id, { set: { 'media.gallery': galleryPatch } });
		} else {
			galleryUnchanged++;
		}

		transaction.patch(doc._id, { unset: ['media.heroImage'] });
	}

	console.log(`Would set gallery from hero only: ${setGallery}`);
	console.log(`Would prepend hero to gallery: ${prependGallery}`);
	console.log(`Gallery deduped/re-keyed only: ${galleryUnchanged}`);

	if (dryRun) {
		console.log(
			'Would patch:',
			listings.map((doc) => doc._id).join(', ')
		);
		return;
	}

	await transaction.commit();
	console.log(`Migrated ${listings.length} document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
