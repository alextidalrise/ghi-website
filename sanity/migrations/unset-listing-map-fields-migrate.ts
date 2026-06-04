#!/usr/bin/env node
/**
 * Remove deprecated per-listing map fields and locationTaxonomy.mapPrivacyDefault.
 *
 * Usage:
 *   pnpm --filter sanity migrate:unset-listing-map-fields -- --dataset development
 *   pnpm --filter sanity migrate:unset-listing-map-fields -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const LISTING_TYPES = ['propertyListing', 'development'] as const;

const LISTING_LOCATION_UNSET_KEYS = [
	'location.coordinates',
	'location.coordinateSource',
	'location.mapPrivacyLevel',
	'location.mapDisplayApproved',
	'location.mapDisplayApprovedBy',
	'location.mapDisplayApprovedAt',
	'location.publicMapNotes'
] as const;

const TAXONOMY_UNSET_KEYS = ['mapPrivacyDefault'] as const;

type ListingDoc = {
	_id: string;
	_type: string;
};

type TaxonomyDoc = {
	_id: string;
	_type: string;
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

async function fetchListingsWithMapFields(client: SanityClient): Promise<ListingDoc[]> {
	return client.fetch(
		`*[
			_type in $types
			&& (
				defined(location.coordinates)
				|| defined(location.coordinateSource)
				|| defined(location.mapPrivacyLevel)
				|| defined(location.mapDisplayApproved)
				|| defined(location.mapDisplayApprovedBy)
				|| defined(location.mapDisplayApprovedAt)
				|| defined(location.publicMapNotes)
			)
		]{ _id, _type }`,
		{ types: LISTING_TYPES }
	);
}

async function fetchTaxonomyWithMapPrivacyDefault(client: SanityClient): Promise<TaxonomyDoc[]> {
	return client.fetch(
		`*[
			_type == "locationTaxonomy"
			&& defined(mapPrivacyDefault)
		]{ _id, _type }`
	);
}

async function main() {
	const client = createMigrationClient();
	const [listings, taxonomy] = await Promise.all([
		fetchListingsWithMapFields(client),
		fetchTaxonomyWithMapPrivacyDefault(client)
	]);

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Listings with deprecated map fields: ${listings.length}`);
	console.log(`Taxonomy docs with mapPrivacyDefault: ${taxonomy.length}`);

	if (listings.length === 0 && taxonomy.length === 0) {
		return;
	}

	const transaction = client.transaction();

	for (const doc of listings) {
		transaction.patch(doc._id, { unset: [...LISTING_LOCATION_UNSET_KEYS] });
	}

	for (const doc of taxonomy) {
		transaction.patch(doc._id, { unset: [...TAXONOMY_UNSET_KEYS] });
	}

	if (dryRun) {
		if (listings.length > 0) {
			console.log(
				'Would unset listing map fields on:',
				listings.map((doc) => doc._id).join(', ')
			);
		}
		if (taxonomy.length > 0) {
			console.log(
				'Would unset mapPrivacyDefault on:',
				taxonomy.map((doc) => doc._id).join(', ')
			);
		}
		return;
	}

	await transaction.commit();
	console.log(
		`Unset listing map fields on ${listings.length} document(s); mapPrivacyDefault on ${taxonomy.length} taxonomy document(s).`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
