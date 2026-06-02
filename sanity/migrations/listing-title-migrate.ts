#!/usr/bin/env node
/**
 * Rename publicTitle → title and remove internalTitle from listing documents.
 *
 * Usage:
 *   pnpm --filter sanity migrate:listing-title -- --dataset development
 *   pnpm --filter sanity migrate:listing-title:dry-run -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'development'] as const;

type ListingDocument = {
	_id: string;
	_type: string;
	publicTitle?: string | null;
	internalTitle?: string | null;
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
		&& (defined(publicTitle) || defined(internalTitle))
	]{ _id, _type, publicTitle, internalTitle }`;

	const docs = await client.fetch<ListingDocument[]>(query, {
		types: DOCUMENT_TYPES
	});

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Documents with publicTitle or internalTitle: ${docs.length}`);

	if (docs.length === 0) {
		return;
	}

	const transaction = client.transaction();
	for (const doc of docs) {
		transaction.patch(doc._id, (patch) =>
			patch.set({ title: doc.publicTitle }).unset(['publicTitle', 'internalTitle'])
		);
	}

	if (dryRun) {
		for (const doc of docs) {
			console.log(
				`Would set title="${doc.publicTitle ?? ''}" and unset publicTitle/internalTitle on ${doc._id}`
			);
		}
		return;
	}

	await transaction.commit();
	console.log(`Migrated title on ${docs.length} document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
