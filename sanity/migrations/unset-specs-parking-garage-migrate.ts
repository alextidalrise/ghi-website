#!/usr/bin/env node
/**
 * Unset deprecated specs.parkingSpaces and specs.garageSpaces from listings, units, and unit types.
 *
 * Usage:
 *   pnpm --filter sanity migrate:unset-specs-parking-garage -- --dataset development
 *   pnpm --filter sanity migrate:unset-specs-parking-garage:dry-run -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'unit', 'unitType'] as const;

const SPECS_UNSET_KEYS = ['specs.parkingSpaces', 'specs.garageSpaces'] as const;

type SpecsDoc = {
	_id: string;
	_type: string;
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

async function fetchDocsWithParkingOrGarage(client: SanityClient): Promise<SpecsDoc[]> {
	return client.fetch(
		`*[
			_type in $types
			&& (defined(specs.parkingSpaces) || defined(specs.garageSpaces))
		]{ _id, _type }`,
		{ types: DOCUMENT_TYPES }
	);
}

async function main() {
	const client = createMigrationClient();
	const docs = await fetchDocsWithParkingOrGarage(client);

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Documents with specs.parkingSpaces or specs.garageSpaces: ${docs.length}`);

	if (docs.length === 0) {
		return;
	}

	if (dryRun) {
		console.log('Would unset on:', docs.map((doc) => `${doc._type}:${doc._id}`).join(', '));
		return;
	}

	const transaction = client.transaction();
	for (const doc of docs) {
		transaction.patch(doc._id, { unset: [...SPECS_UNSET_KEYS] });
	}

	await transaction.commit();
	console.log(`Unset parking/garage specs on ${docs.length} document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
