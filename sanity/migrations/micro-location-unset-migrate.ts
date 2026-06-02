#!/usr/bin/env node
/**
 * Remove deprecated location.microLocation from listing documents.
 *
 * Usage:
 *   pnpm --filter sanity migrate:micro-location-unset -- --dataset development
 *   pnpm --filter sanity migrate:micro-location-unset -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'development'] as const;

type DocumentWithMicroLocation = {
	_id: string;
	_type: string;
	location?: { microLocation?: string | null } | null;
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

async function main() {
	const client = createMigrationClient();
	const query = `*[
		_type in $types
		&& defined(location.microLocation)
	]{ _id, _type, location }`;

	const docs = await client.fetch<DocumentWithMicroLocation[]>(query, {
		types: DOCUMENT_TYPES
	});

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Documents with location.microLocation: ${docs.length}`);

	if (docs.length === 0) {
		return;
	}

	const transaction = client.transaction();
	for (const doc of docs) {
		transaction.patch(doc._id, { unset: ['location.microLocation'] });
	}

	if (dryRun) {
		console.log('Would unset location.microLocation on:', docs.map((doc) => doc._id).join(', '));
		return;
	}

	await transaction.commit();
	console.log(`Unset location.microLocation on ${docs.length} document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
