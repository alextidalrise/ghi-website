#!/usr/bin/env node
/**
 * Upload curated hero imagery into Sanity and patch taxonomy + siteSettings fields.
 *
 * Usage:
 *   pnpm --filter sanity migrate:curated-heroes -- --dataset development
 *   pnpm --filter sanity migrate:curated-heroes -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCATIONS_ASSET_DIR = join(REPO_ROOT, 'web', 'static', 'design-system', 'assets', 'locations');
const HOMEPAGE_HERO_FILE = join(
	REPO_ROOT,
	'web',
	'static',
	'design-system',
	'assets',
	'andalucia-golf-villa.png'
);

const HOMEPAGE_TAGLINE =
	'A curated portfolio of residential properties on and near premier golf courses across southern Europe.';

type CountryHeroSeed = {
	slug: string;
	file: string;
	altText: string;
	tagline: string;
};

type LocationHeroSeed = {
	countrySlug: string;
	slug: string;
	file: string;
	altText: string;
	tagline: string;
};

const COUNTRY_HEROES: CountryHeroSeed[] = [
	{
		slug: 'spain',
		file: 'country-spain.jpg',
		altText: 'A pine-topped cove on the Spanish Mediterranean coast at dusk',
		tagline: "The Costa del Sol's Golf Valley, Sotogrande, and the southern coast."
	},
	{
		slug: 'portugal',
		file: 'country-portugal.jpg',
		altText: 'Golden limestone cliffs above turquoise water on the Algarve coast',
		tagline: 'The Algarve fairways, the Lisbon coast, and the Atlantic south.'
	}
];

const LOCATION_HEROES: LocationHeroSeed[] = [
	{
		countrySlug: 'spain',
		slug: 'marbella',
		file: 'loc-marbella.jpg',
		altText: 'Yachts moored at Puerto Banús below La Concha mountain, Marbella',
		tagline: 'Golf Valley flagship'
	},
	{
		countrySlug: 'spain',
		slug: 'estepona',
		file: 'loc-estepona.jpg',
		altText: 'Whitewashed old-town façade with flowering balconies in Estepona',
		tagline: 'Growing coastal market'
	},
	{
		countrySlug: 'spain',
		slug: 'sotogrande',
		file: 'loc-sotogrande.jpg',
		altText: 'Hillside residences above the sea at dusk in Sotogrande',
		tagline: 'Polo, Valderrama, exclusive'
	},
	{
		countrySlug: 'portugal',
		slug: 'algarve',
		file: 'loc-algarve.jpg',
		altText: 'A boardwalk leading down to a surf beach on the western Algarve coast',
		tagline: '40+ courses, golden coast'
	},
	{
		countrySlug: 'portugal',
		slug: 'comporta',
		file: 'loc-comporta.jpg',
		altText: 'A quiet golden-hour cove backed by limestone cliffs on the Portuguese coast',
		tagline: 'Hidden gem, Atlantic dunes'
	},
	{
		countrySlug: 'portugal',
		slug: 'cascais',
		file: 'loc-cascais.jpg',
		altText: 'Atlantic surf rolling onto a wide sandy beach near Cascais',
		tagline: 'Lisbon coast lifestyle'
	}
];

const HOMEPAGE_FEATURED_LOCATIONS = LOCATION_HEROES.map(
	(location) => `${location.countrySlug}/${location.slug}`
);

const COUNTRY_FEATURED_LOCATIONS: Record<string, string[]> = {
	spain: ['spain/marbella', 'spain/estepona', 'spain/sotogrande'],
	portugal: ['portugal/algarve', 'portugal/comporta', 'portugal/cascais']
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

function loadEnvFile(path: string): void {
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const separator = trimmed.indexOf('=');
		if (separator <= 0) continue;
		const key = trimmed.slice(0, separator).trim();
		const value = trimmed.slice(separator + 1).trim();
		if (key && process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

function createClientOrThrow(): SanityClient {
	if (!TOKEN && !dryRun) {
		throw new Error('Missing write credentials. Set SANITY_API_TOKEN or log in via sanity CLI.');
	}

	return createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token: TOKEN,
		useCdn: false
	});
}

function readAsset(path: string): Buffer {
	if (!existsSync(path)) {
		throw new Error(`Missing asset file: ${path}`);
	}
	return readFileSync(path);
}

async function uploadImage(
	client: SanityClient,
	path: string,
	filename: string
): Promise<string> {
	if (dryRun) {
		console.log(`  [dry-run] upload ${filename}`);
		return `image-dry-run-${filename}`;
	}

	const asset = await client.assets.upload('image', readAsset(path), { filename });
	console.log(`  uploaded ${filename} → ${asset._id}`);
	return asset._id;
}

function locationRef(refId: string) {
	return { _type: 'reference' as const, _ref: refId, _key: refId };
}

async function fetchCountryId(
	client: SanityClient,
	slug: string
): Promise<string | null> {
	return client.fetch<string | null>(
		`*[_type == "locationTaxonomy" && type == "country" && slug.current == $slug][0]._id`,
		{ slug }
	);
}

async function fetchLocationId(
	client: SanityClient,
	countrySlug: string,
	locationSlug: string
): Promise<string | null> {
	return client.fetch<string | null>(
		`*[
			_type == "locationTaxonomy"
			&& type == "location"
			&& slug.current == $locationSlug
			&& parent->slug.current == $countrySlug
		][0]._id`,
		{ countrySlug, locationSlug }
	);
}

async function resolveLocationPath(client: SanityClient, path: string): Promise<string | null> {
	const [countrySlug, locationSlug] = path.split('/');
	return fetchLocationId(client, countrySlug, locationSlug);
}

async function ensureSiteSettings(client: SanityClient): Promise<void> {
	const existing = await client.fetch<string | null>(`*[_id == "siteSettings"][0]._id`);
	if (existing) return;

	console.log('create siteSettings document');
	if (!dryRun) {
		await client.create({
			_id: 'siteSettings',
			_type: 'siteSettings'
		});
	}
}

async function main() {
	console.log(`Curated heroes migration → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	const client = createClientOrThrow();
	const locationIds = new Map<string, string>();

	for (const country of COUNTRY_HEROES) {
		const countryId = await fetchCountryId(client, country.slug);
		if (!countryId) {
			console.warn(`skip country ${country.slug} — taxonomy doc not found`);
			continue;
		}

		const assetPath = join(LOCATIONS_ASSET_DIR, country.file);
		const assetId = await uploadImage(client, assetPath, country.file);
		const patch = {
			heroImage: {
				_type: 'mediaAssetMetadata',
				asset: { _type: 'reference', _ref: assetId },
				altText: country.altText
			},
			tagline: country.tagline
		};

		console.log(`patch country ${country.slug} (${countryId})`);
		if (!dryRun) {
			await client.patch(countryId).set(patch).commit();
		}
	}

	for (const location of LOCATION_HEROES) {
		const locationId = await fetchLocationId(client, location.countrySlug, location.slug);
		if (!locationId) {
			console.warn(
				`skip location ${location.countrySlug}/${location.slug} — taxonomy doc not found`
			);
			continue;
		}

		locationIds.set(`${location.countrySlug}/${location.slug}`, locationId);

		const assetPath = join(LOCATIONS_ASSET_DIR, location.file);
		const assetId = await uploadImage(client, assetPath, location.file);
		const patch = {
			heroImage: {
				_type: 'mediaAssetMetadata',
				asset: { _type: 'reference', _ref: assetId },
				altText: location.altText
			},
			tagline: location.tagline
		};

		console.log(`patch location ${location.countrySlug}/${location.slug} (${locationId})`);
		if (!dryRun) {
			await client.patch(locationId).set(patch).commit();
		}
	}

	if (existsSync(HOMEPAGE_HERO_FILE)) {
		const homepageAssetId = await uploadImage(client, HOMEPAGE_HERO_FILE, 'andalucia-golf-villa.png');

		for (const path of HOMEPAGE_FEATURED_LOCATIONS) {
			if (!locationIds.has(path)) {
				const id = await resolveLocationPath(client, path);
				if (id) locationIds.set(path, id);
			}
		}

		const homepageFeaturedRefsResolved = HOMEPAGE_FEATURED_LOCATIONS.flatMap((path) => {
			const id = locationIds.get(path);
			if (!id) {
				console.warn(`skip homepage featured location ${path} — taxonomy doc not found`);
				return [];
			}
			return [locationRef(id)];
		});

		console.log('patch siteSettings homepageHero + homepageFeaturedLocations');
		if (!dryRun) {
			await ensureSiteSettings(client);
			await client
				.patch('siteSettings')
				.set({
					homepageHero: {
						image: {
							_type: 'mediaAssetMetadata',
							asset: { _type: 'reference', _ref: homepageAssetId },
							altText: ''
						},
						tagline: HOMEPAGE_TAGLINE
					},
					homepageFeaturedLocations: homepageFeaturedRefsResolved
				})
				.commit({ autoGenerateArrayKeys: true });
		}
	} else {
		console.warn(`skip homepage hero — missing asset ${HOMEPAGE_HERO_FILE}`);
	}

	for (const [countrySlug, paths] of Object.entries(COUNTRY_FEATURED_LOCATIONS)) {
		const countryId = await fetchCountryId(client, countrySlug);
		if (!countryId) {
			console.warn(`skip country featuredLocations ${countrySlug} — taxonomy doc not found`);
			continue;
		}

		const refs = (
			await Promise.all(
				paths.map(async (path) => {
					const id = locationIds.get(path) ?? (await resolveLocationPath(client, path));
					if (!id) {
						console.warn(`skip country featured location ${path} — taxonomy doc not found`);
						return null;
					}
					locationIds.set(path, id);
					return locationRef(id);
				})
			)
		).filter((ref): ref is ReturnType<typeof locationRef> => Boolean(ref));

		if (refs.length === 0) continue;

		console.log(`patch country featuredLocations ${countrySlug}`);
		if (!dryRun) {
			await client
				.patch(countryId)
				.set({ featuredLocations: refs })
				.commit({ autoGenerateArrayKeys: true });
		}
	}

	console.log('Done.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
