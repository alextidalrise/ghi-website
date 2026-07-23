#!/usr/bin/env tsx
/**
 * Patch the aboutPage document with the `places` array so the "Why these places"
 * tiles become linkable from the CMS.
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/seed-about-places-migrate.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/seed-about-places-migrate.ts --dataset production --allow-production
 *   pnpm --filter sanity exec tsx migrations/seed-about-places-migrate.ts --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allowProduction = args.includes('--allow-production');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	(datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ??
	process.env.SANITY_STUDIO_DATASET ??
	'development';

if (dataset === 'production' && !allowProduction) {
	console.error(
		'Refusing to run against the production dataset. Re-run with --allow-production if that is intended.'
	);
	process.exit(1);
}

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

const PLACES = [
	{
		_key: 'marbella',
		name: 'Marbella',
		region: 'Costa del Sol, Spain',
		heroSlug: 'marbella',
		alt: 'Golf fairways running down to the Mediterranean above Marbella on the Costa del Sol',
		href: '/spain/marbella'
	},
	{
		_key: 'sotogrande',
		name: 'Sotogrande',
		region: 'Cádiz, Spain',
		heroSlug: 'sotogrande',
		alt: 'Manicured championship course and low villas in the resort of Sotogrande',
		href: '/spain/sotogrande'
	},
	{
		_key: 'algarve',
		name: 'The Algarve',
		region: 'Southern Portugal',
		heroSlug: 'quinta-do-lago',
		alt: 'Pine-lined Algarve golf course above the Atlantic coastline in southern Portugal',
		href: '/portugal'
	}
];

async function main() {
	console.log(
		`Seed about-page places → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token: TOKEN ?? undefined,
		useCdn: false
	});

	const ids = ['aboutPage', 'drafts.aboutPage'];

	for (const id of ids) {
		const exists = await client.fetch<boolean>(`defined(*[_id == $id][0]._id)`, { id });
		if (!exists) {
			console.log(`  ${id}: not found, skipping`);
			continue;
		}

		console.log(`  ${id}: patching places (${PLACES.length} items)`);
		if (!dryRun) {
			await client.patch(id).set({ places: PLACES }).commit();
		}
	}

	console.log('Done.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
