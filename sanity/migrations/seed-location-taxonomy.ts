#!/usr/bin/env node
/**
 * Wipe and re-seed locationTaxonomy documents with consistent, Studio-visible IDs.
 *
 * Usage:
 *   pnpm --filter sanity seed:location-taxonomy -- --dataset development
 *   pnpm --filter sanity seed:location-taxonomy -- --dataset development --dry-run
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

type TaxonomyLevel = 'country' | 'location' | 'community';

type SeedDoc = {
	_id: string;
	name: string;
	slug: string;
	type: TaxonomyLevel;
	parentId?: string;
};

/** Stable IDs — no dots. See sanity/fixtures/verification/constants.ts */
const SEED_DOCS: SeedDoc[] = [
	{ _id: 'taxonomy-country-spain', name: 'Spain', slug: 'spain', type: 'country' },
	{
		_id: 'taxonomy-location-sotogrande',
		name: 'Sotogrande',
		slug: 'sotogrande',
		type: 'location',
		parentId: 'taxonomy-country-spain'
	},
	{
		_id: 'taxonomy-location-benahavis',
		name: 'Benahavis',
		slug: 'benahavis',
		type: 'location',
		parentId: 'taxonomy-country-spain'
	},
	{
		_id: 'taxonomy-location-marbella',
		name: 'Marbella',
		slug: 'marbella',
		type: 'location',
		parentId: 'taxonomy-country-spain'
	},
	{
		_id: 'taxonomy-community-kings-and-queens',
		name: 'Kings and Queens',
		slug: 'kings-and-queens',
		type: 'community',
		parentId: 'taxonomy-location-sotogrande'
	},
	{
		_id: 'taxonomy-community-la-quinta',
		name: 'La Quinta',
		slug: 'la-quinta',
		type: 'community',
		parentId: 'taxonomy-location-benahavis'
	},
	{
		_id: 'taxonomy-community-san-pedro-de-alcantara',
		name: 'San Pedro de Alcántara',
		slug: 'san-pedro-de-alcantara',
		type: 'community',
		parentId: 'taxonomy-location-marbella'
	},
	{
		_id: 'taxonomy-community-el-rosario',
		name: 'El Rosario',
		slug: 'el-rosario',
		type: 'community',
		parentId: 'taxonomy-location-marbella'
	},
	{
		_id: 'taxonomy-community-marbella-golden-mile',
		name: 'Marbella Golden Mile',
		slug: 'marbella-golden-mile',
		type: 'community',
		parentId: 'taxonomy-location-marbella'
	}
];

const SEED_ID_SET = new Set(SEED_DOCS.map((doc) => doc._id));

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

function buildDocument(seed: SeedDoc) {
	return {
		_id: seed._id,
		_type: 'locationTaxonomy' as const,
		name: seed.name,
		slug: { _type: 'slug' as const, current: seed.slug },
		type: seed.type,
		...(seed.parentId
			? { parent: { _type: 'reference' as const, _ref: seed.parentId } }
			: {})
	};
}

function remapTaxonomyRef(ref: string): string {
	const bySlug = SEED_DOCS.find((doc) => doc._id === ref);
	if (bySlug) return ref;

	const legacyMap: Record<string, string> = {
		'3aeb4bde-5d9e-4065-a0ad-b5d41c8b1c5b': 'taxonomy-location-sotogrande',
		'f0231086-cf13-43c2-8bd2-095d85adbda3': 'taxonomy-location-benahavis',
		'5bed3d4e-a0aa-4528-8186-b1527c43204e': 'taxonomy-community-kings-and-queens',
		'8cff10c4-44a7-48fc-aac4-58dc1d913293': 'taxonomy-community-la-quinta',
		'03809825-9727-49ad-b5e7-8f3e0b4c03f0': 'taxonomy-community-san-pedro-de-alcantara',
		'ea121e21-1002-4cf5-86d3-1202cd1bc74f': 'taxonomy-community-el-rosario'
	};

	return legacyMap[ref] ?? ref;
}

async function main() {
	console.log(
		`Location taxonomy seed → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createClientOrThrow();
	const actions: string[] = [];

	const rank = (id: string, type?: string) => {
		const seed = SEED_DOCS.find((doc) => doc._id === id);
		const level = seed?.type ?? type;
		if (level === 'community') return 2;
		if (level === 'location') return 1;
		if (level === 'country') return 0;
		return 1;
	};

	const existing = await client.fetch<Array<{ _id: string; type?: string }>>(
		`*[_type == "locationTaxonomy"]{ _id, type }`
	);

	const toDelete = existing
		.filter((doc) => !SEED_ID_SET.has(doc._id))
		.sort((a, b) => rank(b._id, b.type) - rank(a._id, a.type));

	for (const doc of toDelete) {
		actions.push(`delete ${doc._id}`);
		if (!dryRun) await client.delete(doc._id);
	}

	for (const seed of SEED_DOCS) {
		actions.push(`upsert ${seed._id} (${seed.type}: ${seed.name})`);
		if (!dryRun) await client.createOrReplace(buildDocument(seed));
	}

	const referencingDocs = await client.fetch<Array<{ _id: string; _type: string }>>(
		`*[_type != "locationTaxonomy" && references(*[_type == "locationTaxonomy"]._id)]{ _id, _type }`
	);

	for (const doc of referencingDocs) {
		const full = await client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, {
			id: doc._id
		});
		if (!full) continue;

		let changed = false;
		const patch: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(full)) {
			if (key.startsWith('_')) continue;
			if (
				value &&
				typeof value === 'object' &&
				'_type' in value &&
				value._type === 'reference' &&
				'_ref' in value &&
				typeof value._ref === 'string'
			) {
				const nextRef = remapTaxonomyRef(value._ref);
				if (nextRef !== value._ref) {
					patch[key] = { ...value, _ref: nextRef };
					changed = true;
				}
			}
		}

		if (!changed) continue;
		actions.push(`patch ${doc._id} (${doc._type}) taxonomy refs`);
		if (!dryRun) await client.patch(doc._id).set(patch).commit();
	}

	console.log(`\nPlanned actions: ${actions.length}`);
	for (const action of actions) console.log(`  • ${action}`);

	const verify = await client.fetch<{
		total: number;
		countries: number;
		locations: number;
		communities: number;
		dotted: number;
	}>(
		`{
      "total": count(*[_type == "locationTaxonomy"]),
      "countries": count(*[_type == "locationTaxonomy" && type == "country"]),
      "locations": count(*[_type == "locationTaxonomy" && type == "location"]),
      "communities": count(*[_type == "locationTaxonomy" && type == "community"]),
      "dotted": count(*[_type == "locationTaxonomy" && _id match "*.*"])
    }`
	);

	console.log('\nPost-seed verification:');
	console.log(`  total: ${verify.total} (expected ${SEED_DOCS.length})`);
	console.log(`  countries: ${verify.countries}, locations: ${verify.locations}, communities: ${verify.communities}`);
	console.log(`  dotted IDs: ${verify.dotted}`);

	if (
		!dryRun &&
		(verify.total !== SEED_DOCS.length ||
			verify.countries !== 1 ||
			verify.locations !== 3 ||
			verify.communities !== 5 ||
			verify.dotted > 0)
	) {
		console.error('\nSeed verification failed.');
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
