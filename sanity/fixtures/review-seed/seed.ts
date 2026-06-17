#!/usr/bin/env tsx
/**
 * Seed a batch of approved Marbella property listings into the Sanity
 * `development` dataset so the listing grid can be reviewed with real cards
 * while real properties are still being approved.
 *
 * Every document is gated to PASS the public filter (approved_for_publish +
 * visible pricing + hero image) and is tagged with a `reviewSeed-`
 * id prefix so it can be removed in one command.
 *
 * Usage (from sanity/):
 *   pnpm reviewseed:seed              # upsert listings
 *   pnpm reviewseed:seed -- --dry-run # print plan, write nothing
 *   pnpm reviewseed:delete            # remove every reviewSeed- listing
 *
 * Auth: SANITY_API_TOKEN (write), or a logged-in Sanity CLI (`sanity login`).
 */
import { createClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const DATASET = process.env.SANITY_STUDIO_DATASET ?? 'development';
const API_VERSION = '2025-05-01';

const dryRun = process.argv.includes('--dry-run');
const deleteMode = process.argv.includes('--delete');

const ID_PREFIX = 'reviewSeed-';

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

const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

// --- Taxonomy refs (existing development-dataset docs) ---
const COUNTRY = 'places-country-spain';
const LOCATION = 'places-location-marbella';
const COMMUNITY = {
	goldenMile: 'places-community-golden-mile',
	lomasDelVirrey: 'places-community-lomas-del-virrey',
	puertoBanus: 'places-community-puerto-banus'
} as const;

const COMMUNITY_ADDRESS: Record<string, string> = {
	[COMMUNITY.goldenMile]: 'Golden Mile, Marbella',
	[COMMUNITY.lomasDelVirrey]: 'Lomas del Virrey, Marbella',
	[COMMUNITY.puertoBanus]: 'Puerto Banús, Marbella'
};

/**
 * Real property photography already in the dataset, cycled across the seed
 * listings so the 3:2 card crop can be reviewed against actual source ratios.
 * Resolved at runtime (no uploads) so it tracks whatever real photos exist.
 */
const PROPERTY_IMAGE_QUERY = `*[_type=="sanity.imageAsset" && originalFilename match "DJI*"]._id | order(@)`;

type Listing = {
	slug: string;
	title: string;
	propertyType: 'villa' | 'apartment' | 'penthouse' | 'townhouse';
	bedrooms: number;
	bathrooms: number;
	price: number;
	builtArea: number;
	community: string;
};

const LISTINGS: Listing[] = [
	{ slug: 'modern-villa-golden-mile', title: 'Modern Villa on the Golden Mile', propertyType: 'villa', bedrooms: 5, bathrooms: 5, price: 4_250_000, builtArea: 520, community: COMMUNITY.goldenMile },
	{ slug: 'beachside-apartment-puerto-banus', title: 'Beachside Apartment, Puerto Banús', propertyType: 'apartment', bedrooms: 2, bathrooms: 2, price: 745_000, builtArea: 140, community: COMMUNITY.puertoBanus },
	{ slug: 'frontline-penthouse-puerto-banus', title: 'Frontline Penthouse, Puerto Banús', propertyType: 'penthouse', bedrooms: 3, bathrooms: 3, price: 1_950_000, builtArea: 210, community: COMMUNITY.puertoBanus },
	{ slug: 'hillside-villa-lomas-del-virrey', title: 'Hillside Villa in Lomas del Virrey', propertyType: 'villa', bedrooms: 6, bathrooms: 6, price: 3_650_000, builtArea: 610, community: COMMUNITY.lomasDelVirrey },
	{ slug: 'garden-townhouse-golden-mile', title: 'Garden Townhouse, Golden Mile', propertyType: 'townhouse', bedrooms: 3, bathrooms: 3, price: 1_150_000, builtArea: 240, community: COMMUNITY.goldenMile },
	{ slug: 'contemporary-villa-lomas-del-virrey', title: 'Contemporary Villa, Lomas del Virrey', propertyType: 'villa', bedrooms: 4, bathrooms: 4, price: 2_450_000, builtArea: 380, community: COMMUNITY.lomasDelVirrey },
	{ slug: 'marina-apartment-puerto-banus', title: 'Marina Apartment, Puerto Banús', propertyType: 'apartment', bedrooms: 2, bathrooms: 2, price: 595_000, builtArea: 120, community: COMMUNITY.puertoBanus },
	{ slug: 'classic-villa-golden-mile', title: 'Classic Andalusian Villa, Golden Mile', propertyType: 'villa', bedrooms: 5, bathrooms: 4, price: 5_200_000, builtArea: 540, community: COMMUNITY.goldenMile },
	{ slug: 'sky-penthouse-golden-mile', title: 'Sky Penthouse on the Golden Mile', propertyType: 'penthouse', bedrooms: 4, bathrooms: 4, price: 3_100_000, builtArea: 320, community: COMMUNITY.goldenMile },
	{ slug: 'sea-view-apartment-puerto-banus', title: 'Sea-view Apartment, Puerto Banús', propertyType: 'apartment', bedrooms: 3, bathrooms: 2, price: 985_000, builtArea: 165, community: COMMUNITY.puertoBanus },
	{ slug: 'family-villa-lomas-del-virrey', title: 'Family Villa in Lomas del Virrey', propertyType: 'villa', bedrooms: 4, bathrooms: 3, price: 1_795_000, builtArea: 300, community: COMMUNITY.lomasDelVirrey },
	{ slug: 'grand-villa-golden-mile', title: 'Grand Villa on the Golden Mile', propertyType: 'villa', bedrooms: 6, bathrooms: 7, price: 6_850_000, builtArea: 943, community: COMMUNITY.goldenMile }
];

const euro = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const client = createClient({
	projectId: PROJECT_ID,
	dataset: DATASET,
	apiVersion: API_VERSION,
	token: TOKEN,
	useCdn: false
});

async function runDelete() {
	const ids: string[] = await client.fetch(
		`*[_type=="propertyListing" && string::startsWith(_id, $prefix)]._id`,
		{ prefix: ID_PREFIX }
	);
	console.log(`Found ${ids.length} reviewSeed listing(s) to delete.`);
	if (dryRun) {
		ids.forEach((id) => console.log(`  [dry-run] delete ${id}`));
		return;
	}
	for (const id of ids) {
		await client.delete(id);
		console.log(`  ✓ deleted ${id}`);
	}
	// Best-effort: remove the uploaded review-seed image assets too.
	const assetIds: string[] = await client.fetch(
		`*[_type=="sanity.imageAsset" && string::startsWith(label, $prefix)]._id`,
		{ prefix: ID_PREFIX }
	);
	for (const id of assetIds) {
		try {
			await client.delete(id);
			console.log(`  ✓ deleted asset ${id}`);
		} catch {
			console.log(`  · asset ${id} still referenced, left in place`);
		}
	}
}

/** Resolve real property photo asset IDs already in the dataset. */
async function resolvePropertyImageAssetIds(): Promise<string[]> {
	const ids: string[] = await client.fetch(PROPERTY_IMAGE_QUERY);
	if (!ids || ids.length === 0) {
		throw new Error(
			'No real property images found (originalFilename match "DJI*"). ' +
				'Adjust PROPERTY_IMAGE_QUERY to match your uploaded photos.'
		);
	}
	console.log(`  found ${ids.length} real property photo(s) to cycle through`);
	return ids;
}

function buildListing(listing: Listing, index: number, assetId: string) {
	const priceDisplay = euro.format(listing.price);
	return {
		_id: `${ID_PREFIX}marbella-${listing.slug}`,
		_type: 'propertyListing',
		ghiListingId: `GHISEED${String(index + 1).padStart(2, '0')}`,
		title: listing.title,
		slug: { _type: 'slug', current: listing.slug },
		listingKind: 'property',
		propertyType: listing.propertyType,
		transactionType: 'sale',
		status: 'published',
		location: {
			_type: 'locationFields',
			country: { _type: 'reference', _ref: COUNTRY },
			location: { _type: 'reference', _ref: LOCATION },
			community: { _type: 'reference', _ref: listing.community },
			addressDisplay: COMMUNITY_ADDRESS[listing.community]
		},
		pricing: {
			_type: 'propertyPricingFields',
			price: listing.price,
			priceDisplay,
			currency: 'EUR'
		},
		specs: {
			_type: 'specsFields',
			bedrooms: listing.bedrooms,
			bathrooms: listing.bathrooms,
			builtArea: listing.builtArea,
			builtAreaUnit: 'sqm'
		},
		content: {
			_type: 'contentFields',
			shortDescription: `${listing.title} — sample listing seeded for design review of the property grid.`
		},
		media: {
			_type: 'mediaFields',
			gallery: [
				{
					_type: 'mediaAssetMetadata',
					asset: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
					altText: `${listing.title} — exterior`
				}
			]
		}
	};
}

async function runSeed() {
	console.log('Resolving real property images…');
	const assetIds = await resolvePropertyImageAssetIds();

	const documents = LISTINGS.map((listing, index) =>
		buildListing(listing, index, assetIds[index % assetIds.length])
	);

	console.log(`\nUpserting ${documents.length} listing(s)…`);
	for (const doc of documents) {
		if (dryRun) {
			console.log(`  [dry-run] ${doc._id} (${doc.propertyType}, ${euro.format(doc.pricing.price)})`);
			continue;
		}
		await client.createOrReplace(doc);
		console.log(`  ✓ ${doc._id}`);
	}

	console.log(`\nReview at: http://localhost:5173/spain/marbella`);
	console.log(`Remove later with: pnpm reviewseed:delete`);
}

async function main() {
	console.log(
		`Review seed → ${PROJECT_ID}/${DATASET}${dryRun ? ' (dry run)' : ''}${deleteMode ? ' [delete]' : ''}`
	);
	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Either export SANITY_API_TOKEN=… or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}
	if (DATASET === 'production') {
		console.error('Refusing to run against the production dataset.');
		process.exit(1);
	}
	if (deleteMode) {
		await runDelete();
	} else {
		await runSeed();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
