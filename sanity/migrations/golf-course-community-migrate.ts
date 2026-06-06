#!/usr/bin/env node
/**
 * Remove legacy golfCourse.location field (replaced by required community ref).
 *
 * Usage:
 *   pnpm --filter sanity migrate:golf-course-community -- --dataset development
 *   pnpm --filter sanity migrate:golf-course-community -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

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
	const docs = await client.fetch<{ _id: string }[]>(
		`*[_type == "golfCourse" && defined(location)]{ _id }`
	);

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Golf courses with legacy location field: ${docs.length}`);

	if (docs.length === 0) {
		return;
	}

	if (dryRun) {
		console.log('Would unset location on:', docs.map((doc) => doc._id).join(', '));
		return;
	}

	const transaction = client.transaction();
	for (const doc of docs) {
		transaction.patch(doc._id, { unset: ['location'] });
	}

	await transaction.commit();
	console.log(`Unset location on ${docs.length} golf course document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
