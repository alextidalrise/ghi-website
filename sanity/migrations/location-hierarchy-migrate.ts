#!/usr/bin/env node
/**
 * Migrate Sanity content from the 6-level location hierarchy to country → location → community.
 *
 * Usage:
 *   pnpm --filter sanity migrate:location-hierarchy -- --dataset development
 *   pnpm --filter sanity migrate:location-hierarchy -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:location-hierarchy -- --dataset production
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const LISTING_TYPES = ['propertyListing', 'development'] as const;
const TAXONOMY_TYPE_MAP: Record<string, 'country' | 'location' | 'community'> = {
	area: 'location',
	sub_area: 'community'
};
const OBSOLETE_TAXONOMY_TYPES = new Set(['region', 'micro_location']);

type Reference = { _type: 'reference'; _ref: string };
type LocationFields = Record<string, unknown> & {
	country?: Reference;
	region?: Reference;
	municipality?: Reference;
	area?: Reference;
	subArea?: Reference;
	location?: Reference;
	community?: Reference;
};

type TaxonomyDoc = {
	_id: string;
	_type: 'locationTaxonomy';
	name?: string;
	slug?: { _type?: string; current?: string };
	type?: string;
	parent?: Reference;
};

type ListingDoc = {
	_id: string;
	_type: string;
	location?: LocationFields;
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

function slugToName(slug: string): string {
	return slug
		.split('-')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function stableTaxonomyId(refId: string, inferredType: string, slug: string): string {
	if (refId.includes('.') && refId.startsWith('location.')) {
		return `taxonomy-${inferredType}-${slug}`;
	}
	return refId;
}

function ref(value: string): Reference {
	return { _type: 'reference', _ref: value };
}

function inferTaxonomyFromId(
	id: string,
	role: 'country' | 'location' | 'community' | 'region' | 'municipality' | 'area' | 'subArea'
): Pick<TaxonomyDoc, 'name' | 'slug' | 'type'> | null {
	if (OBSOLETE_TAXONOMY_TYPES.has(role) || id.startsWith('location.region.')) {
		return null;
	}

	if (id.startsWith('location.country.') || role === 'country') {
		const slug = id.startsWith('location.country.')
			? id.slice('location.country.'.length)
			: id;
		return { type: 'country', slug: { current: slug }, name: slugToName(slug) };
	}

	if (
		id.startsWith('location.area.') ||
		id.startsWith('location.municipality.') ||
		role === 'area' ||
		role === 'municipality'
	) {
		const slug = id.startsWith('location.area.')
			? id.slice('location.area.'.length)
			: id.startsWith('location.municipality.')
				? id.slice('location.municipality.'.length)
				: id;
		return { type: 'location', slug: { current: slug }, name: slugToName(slug) };
	}

	if (id.startsWith('location.subarea.') || role === 'subArea') {
		const slug = id.startsWith('location.subarea.')
			? id.slice('location.subarea.'.length)
			: id;
		return { type: 'community', slug: { current: slug }, name: slugToName(slug) };
	}

	return null;
}

function generalCommunityId(locationId: string): string {
	return `migration-community-${locationId}-general`;
}

async function fetchTaxonomy(client: SanityClient): Promise<TaxonomyDoc[]> {
	return client.fetch<TaxonomyDoc[]>(
		`*[_type == "locationTaxonomy"]{ _id, _type, name, slug, type, parent }`
	);
}

async function fetchListings(client: SanityClient): Promise<ListingDoc[]> {
	return client.fetch<ListingDoc[]>(
		`*[_type in $types]{ _id, _type, location }`,
		{ types: LISTING_TYPES }
	);
}

function collectLocationRefs(listings: ListingDoc[]) {
	const refs = new Map<string, 'country' | 'location' | 'community' | 'region' | 'municipality' | 'area' | 'subArea'>();

	for (const listing of listings) {
		const location = listing.location;
		if (!location) continue;

		if (location.country?._ref) refs.set(location.country._ref, 'country');
		if (location.region?._ref) refs.set(location.region._ref, 'region');
		if (location.municipality?._ref) refs.set(location.municipality._ref, 'municipality');
		if (location.area?._ref) refs.set(location.area._ref, 'area');
		if (location.subArea?._ref) refs.set(location.subArea._ref, 'subArea');
		if (location.location?._ref) refs.set(location.location._ref, 'location');
		if (location.community?._ref) refs.set(location.community._ref, 'community');
	}

	return refs;
}

function migrateTaxonomyType(type: string | undefined, usedAsArea: boolean): string | null {
	if (!type) return null;
	if (type in TAXONOMY_TYPE_MAP) return TAXONOMY_TYPE_MAP[type];
	if (type === 'municipality' && usedAsArea) return 'location';
	if (OBSOLETE_TAXONOMY_TYPES.has(type)) return null;
	if (type === 'country' || type === 'location' || type === 'community') return type;
	return null;
}

function buildMigratedLocation(
	location: LocationFields | undefined,
	taxonomyById: Map<string, TaxonomyDoc>
): LocationFields | undefined {
	if (!location) return undefined;

	const {
		region: _region,
		municipality,
		area,
		subArea,
		location: existingLocation,
		community: existingCommunity,
		...rest
	} = location;

	let locationRef = existingLocation?._ref ?? area?._ref;
	let communityRef = existingCommunity?._ref ?? subArea?._ref;

	if (locationRef) {
		const taxonomy = taxonomyById.get(locationRef);
		if (taxonomy?.type === 'community') {
			communityRef = communityRef ?? locationRef;
			locationRef = municipality?._ref;
		}
	}

	if (!locationRef && municipality?._ref) {
		locationRef = municipality._ref;
	}

	const migrated: LocationFields = { ...rest };
	if (location.country) migrated.country = location.country;
	if (locationRef) migrated.location = ref(locationRef);
	if (communityRef) migrated.community = ref(communityRef);

	return migrated;
}

async function main() {
	console.log(
		`Location hierarchy migration → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Export SANITY_API_TOKEN with Editor (or higher) access.\n' +
				'Note: SANITY_AUTH_TOKEN deploy tokens cannot mutate documents.'
		);
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-05-01',
		token: TOKEN,
		useCdn: false
	});

	const [taxonomyDocs, listings] = await Promise.all([
		fetchTaxonomy(client),
		fetchListings(client)
	]);

	const taxonomyById = new Map(taxonomyDocs.map((doc) => [doc._id, { ...doc }]));
	const refsNeeded = collectLocationRefs(listings);
	const usedAsArea = new Set(
		listings.map((listing) => listing.location?.area?._ref).filter(Boolean) as string[]
	);

	const actions: string[] = [];

	// Create missing taxonomy documents referenced by listings.
	for (const [refId, role] of refsNeeded) {
		if (taxonomyById.has(refId)) continue;

		const inferred = inferTaxonomyFromId(refId, role);
		if (!inferred) {
			actions.push(`skip missing obsolete ref ${refId} (${role})`);
			continue;
		}

		const slug = inferred.slug?.current ?? refId;
		const stableId = stableTaxonomyId(refId, inferred.type, slug);

		const doc: TaxonomyDoc = {
			_id: stableId,
			_type: 'locationTaxonomy',
			name: inferred.name,
			slug: { _type: 'slug', current: slug },
			type: inferred.type
		};

		taxonomyById.set(refId, doc);
		taxonomyById.set(stableId, doc);
		actions.push(`create taxonomy ${stableId} (${inferred.type})`);

		if (!dryRun) {
			await client.createIfNotExists(doc);
		}
	}

	// Patch taxonomy types and parents.
	for (const doc of taxonomyById.values()) {
		const nextType = migrateTaxonomyType(doc.type, usedAsArea.has(doc._id));
		if (!nextType) {
			const referenced = [...refsNeeded.keys()].some((id) => id === doc._id);
			if (!referenced && OBSOLETE_TAXONOMY_TYPES.has(doc.type ?? '')) {
				actions.push(`delete obsolete taxonomy ${doc._id} (${doc.type})`);
				if (!dryRun) await client.delete(doc._id);
			}
			continue;
		}

		if (nextType !== doc.type) {
			actions.push(`patch taxonomy ${doc._id}: ${doc.type} → ${nextType}`);
			doc.type = nextType;
			if (!dryRun) {
				await client.patch(doc._id).set({ type: nextType }).commit();
			}
		}
	}

	// Infer community → location parent links from listings.
	const communityParents = new Map<string, string>();
	for (const listing of listings) {
		const migrated = buildMigratedLocation(listing.location, taxonomyById);
		if (migrated?.community?._ref && migrated.location?._ref) {
			communityParents.set(migrated.community._ref, migrated.location._ref);
		}
	}

	for (const [communityId, locationId] of communityParents) {
		const community = taxonomyById.get(communityId);
		if (!community || community.type !== 'community') continue;
		if (community.parent?._ref === locationId) continue;

		actions.push(`set parent on ${communityId} → ${locationId}`);
		community.parent = ref(locationId);
		if (!dryRun) {
			await client.patch(communityId).set({ parent: ref(locationId) }).commit();
		}
	}

	// Migrate listing location fields and ensure every listing has a community.
	for (const listing of listings) {
		let migrated = buildMigratedLocation(listing.location, taxonomyById);
		if (!migrated?.location?._ref) {
			actions.push(`skip listing ${listing._id} — no location ref after migration`);
			continue;
		}

		if (!migrated.community?._ref) {
			const locationId = migrated.location._ref;
			const communityId = generalCommunityId(locationId);
			const locationDoc = taxonomyById.get(locationId);
			const locationSlug = locationDoc?.slug?.current ?? locationId;
			const communityDoc: TaxonomyDoc = {
				_id: communityId,
				_type: 'locationTaxonomy',
				name: `${locationDoc?.name ?? slugToName(locationSlug)} (general)`,
				slug: { _type: 'slug', current: `${locationSlug}-general` },
				type: 'community',
				parent: ref(locationId)
			};

			if (!taxonomyById.has(communityId)) {
				taxonomyById.set(communityId, communityDoc);
				actions.push(`create default community ${communityId} for listing ${listing._id}`);
				if (!dryRun) await client.createIfNotExists(communityDoc);
			}

			migrated = { ...migrated, community: ref(communityId) };
		}

		const hasLegacyFields =
			listing.location?.area ||
			listing.location?.subArea ||
			listing.location?.region ||
			listing.location?.municipality;

		const locationChanged =
			listing.location?.location?._ref !== migrated.location?._ref ||
			listing.location?.community?._ref !== migrated.community?._ref;

		if (hasLegacyFields || locationChanged) {
			actions.push(`migrate listing ${listing._id}`);
			if (!dryRun) {
				await client
					.patch(listing._id)
					.set({ location: migrated })
					.unset([
						'location.region',
						'location.municipality',
						'location.area',
						'location.subArea'
					])
					.commit();
			}
		}
	}

	console.log(`\nPlanned actions: ${actions.length}`);
	for (const action of actions) console.log(`  • ${action}`);

	const verify = await client.fetch<{
		oldTaxonomy: number;
		oldListingFields: number;
		missingCommunity: number;
	}>(
		`{
      "oldTaxonomy": count(*[_type == "locationTaxonomy" && type in ["area", "sub_area", "region", "municipality", "micro_location"]]),
      "oldListingFields": count(*[_type in $types && (defined(location.area) || defined(location.subArea) || defined(location.region) || defined(location.municipality))]),
      "missingCommunity": count(*[_type in $types && defined(location.location) && !defined(location.community)])
    }`,
		{ types: LISTING_TYPES },
		{ perspective: 'raw', cacheMode: 'noStale' }
	);

	console.log('\nPost-migration verification:');
	console.log(`  old taxonomy types remaining: ${verify.oldTaxonomy}`);
	console.log(`  listings with legacy location fields: ${verify.oldListingFields}`);
	console.log(`  listings missing community: ${verify.missingCommunity}`);

	if (!dryRun && (verify.oldTaxonomy > 0 || verify.oldListingFields > 0 || verify.missingCommunity > 0)) {
		console.error('\nMigration verification failed.');
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
