#!/usr/bin/env node
/**
 * Remove deprecated content.heroHeadline from listing documents.
 * Identity title is the canonical page headline.
 *
 * Usage:
 *   pnpm --filter sanity migrate:unset-hero-headline -- --dataset development
 *   pnpm --filter sanity migrate:unset-hero-headline -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const LISTING_TYPES = ['propertyListing', 'development'] as const;

type ListingDoc = {
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

async function fetchListingsWithHeroHeadline(client: SanityClient): Promise<ListingDoc[]> {
	return client.fetch(
		`*[
			_type in $types
			&& defined(content.heroHeadline)
		]{ _id, _type }`,
		{ types: LISTING_TYPES }
	);
}

async function main() {
	const client = createMigrationClient();
	const listings = await fetchListingsWithHeroHeadline(client);

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Listings with content.heroHeadline: ${listings.length}`);

	if (listings.length === 0) {
		return;
	}

	const transaction = client.transaction();

	for (const doc of listings) {
		transaction.patch(doc._id, { unset: ['content.heroHeadline'] });
	}

	if (dryRun) {
		console.log(
			'Would unset content.heroHeadline on:',
			listings.map((doc) => doc._id).join(', ')
		);
		return;
	}

	await transaction.commit();
	console.log(`Unset content.heroHeadline on ${listings.length} document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
