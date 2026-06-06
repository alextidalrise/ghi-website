#!/usr/bin/env node
/**
 * Upload the Nueva Andalucia location hero photograph and patch its taxonomy doc.
 *
 * Nueva Andalucia is the heart of Marbella's Golf Valley (Las Brisas, Los Naranjos,
 * Aloha) below the Sierra Blanca / La Concha massif. The country/location heroes were
 * seeded by curated-heroes-migrate.ts; Nueva Andalucia was added to the taxonomy later
 * and never got one, so this fills the gap with the same upload + patch-all-revisions
 * shape (published id plus its `drafts.` twin, so the hero resolves whether the read
 * path is published or dev preview-all).
 *
 * Usage:
 *   pnpm --filter sanity migrate:set-nueva-andalucia-hero -- --dataset development
 *   pnpm --filter sanity migrate:set-nueva-andalucia-hero -- --dataset development --dry-run
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
const ASSET_FILE = join(
	REPO_ROOT,
	'web',
	'static',
	'design-system',
	'assets',
	'locations',
	'loc-nueva-andalucia.jpg'
);

const COUNTRY_SLUG = 'spain';
const LOCATION_SLUG = 'nueva-andalucia';
const ALT_TEXT =
	"Golf Valley fairways and low-rise residences below the Sierra Blanca mountains in Nueva Andalucia, Marbella";

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

function publishedId(id: string): string {
	return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;
}

async function fetchLocationId(client: SanityClient): Promise<string | null> {
	const id = await client.fetch<string | null>(
		`*[
			_type == "locationTaxonomy"
			&& type == "location"
			&& slug.current == $locationSlug
			&& parent->slug.current == $countrySlug
		][0]._id`,
		{ countrySlug: COUNTRY_SLUG, locationSlug: LOCATION_SLUG }
	);
	return id ? publishedId(id) : null;
}

async function existingTargets(client: SanityClient, baseId: string): Promise<string[]> {
	const pub = publishedId(baseId);
	return client.fetch<string[]>(`*[_id in $ids]._id`, { ids: [pub, `drafts.${pub}`] });
}

async function uploadImage(client: SanityClient): Promise<string> {
	if (!existsSync(ASSET_FILE)) {
		throw new Error(`Missing asset file: ${ASSET_FILE}`);
	}
	if (dryRun) {
		console.log('  [dry-run] upload loc-nueva-andalucia.jpg');
		return 'image-dry-run-nueva-andalucia';
	}
	const asset = await client.assets.upload('image', readFileSync(ASSET_FILE), {
		filename: 'loc-nueva-andalucia.jpg'
	});
	console.log(`  uploaded loc-nueva-andalucia.jpg → ${asset._id}`);
	return asset._id;
}

async function main() {
	console.log(
		`Nueva Andalucia hero → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createClientOrThrow();

	const locationId = await fetchLocationId(client);
	if (!locationId) {
		throw new Error(`Location ${COUNTRY_SLUG}/${LOCATION_SLUG} not found in ${dataset}.`);
	}

	const targets = await existingTargets(client, locationId);
	if (targets.length === 0) {
		throw new Error(`No existing revision to patch for ${locationId}.`);
	}

	const assetId = await uploadImage(client);
	const patch = {
		heroImage: {
			_type: 'mediaAssetMetadata',
			asset: { _type: 'reference', _ref: assetId },
			altText: ALT_TEXT
		}
	};

	for (const id of targets) {
		console.log(`  patch ${id}`);
		if (!dryRun) {
			await client.patch(id).set(patch).commit();
		}
	}

	console.log('Done.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
