#!/usr/bin/env tsx
/**
 * Seed the two province-level `location` taxonomy nodes this feed maps to.
 *
 * The murciaservices Kyero feed resolves every listing to one of two provinces —
 * Murcia or Alicante (see `mapProvince`). Those two are the ONLY location nodes the
 * importer needs, and they are a fixed, closed set, so they are seeded here once.
 * Everything below them — the golf resorts and towns → `community` nodes — is created
 * on demand by the external review agents (which can match against the ~97 existing
 * communities and avoid duplicates), NOT by a script. See docs/kyero-feed-ingestion-plan.md.
 *
 * Uses `createIfNotExists`: an existing node is left completely untouched, so any
 * editorial enrichment a human later adds (hero image, publicDescription, tagline,
 * coordinates) survives a re-run. This makes the seed safe to run repeatedly.
 *
 *   pnpm --filter sanity kyero:seed-locations                 # dry-run: print what WOULD be seeded
 *   pnpm --filter sanity kyero:seed-locations -- --write      # create missing nodes → development
 *   pnpm --filter sanity kyero:seed-locations -- --write --dataset development
 *
 * Auth for --write: SANITY_API_TOKEN (write), or a logged-in Sanity CLI (`sanity login`).
 * Refuses the production dataset outright.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@sanity/client';
import type { ProvinceSlug } from './kyero-map';

const SPAIN_COUNTRY_ID = 'places-country-spain';
const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const API_VERSION = '2025-05-01';

/** The closed set of province locations this feed maps to. Slug === ProvinceSlug. */
const PROVINCE_LOCATIONS: { slug: ProvinceSlug; name: string }[] = [
	{ slug: 'murcia', name: 'Murcia' },
	{ slug: 'alicante', name: 'Alicante' }
];

interface LocationDoc {
	_id: string;
	_type: 'locationTaxonomy';
	name: string;
	slug: { _type: 'slug'; current: string };
	type: 'location';
	parent: { _type: 'reference'; _ref: string };
}

function buildLocation({ slug, name }: { slug: ProvinceSlug; name: string }): LocationDoc {
	return {
		_id: `places-location-${slug}`,
		_type: 'locationTaxonomy',
		name,
		slug: { _type: 'slug', current: slug },
		type: 'location',
		parent: { _type: 'reference', _ref: SPAIN_COUNTRY_ID }
	};
}

const argv = process.argv.slice(2);
const write = argv.includes('--write');
function arg(flag: string): string | undefined {
	const i = argv.indexOf(flag);
	return i >= 0 ? argv[i + 1] : undefined;
}
const dataset = arg('--dataset') ?? process.env.SANITY_STUDIO_DATASET ?? 'development';

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

async function main() {
	if (dataset === 'production') {
		console.error('Refusing to run against the production dataset.');
		process.exit(1);
	}

	const docs = PROVINCE_LOCATIONS.map(buildLocation);

	const H = (s: string) => `\n\x1b[1m${s}\x1b[0m`;
	const mode = write ? '\x1b[31mWRITE\x1b[0m' : '\x1b[32mdry-run\x1b[0m';
	console.log(`\x1b[1m\x1b[36mKYERO SEED — province locations\x1b[0m  (${mode})`);
	console.log(`target        : ${PROJECT_ID}/${dataset}`);
	console.log(`parent country : ${SPAIN_COUNTRY_ID}`);

	console.log(H('WOULD ENSURE (createIfNotExists — existing nodes untouched)'));
	for (const d of docs) {
		console.log(`  \x1b[36m${d._id}\x1b[0m  ${d.name}  (/spain/${d.slug.current}) → parent ${d.parent._ref}`);
	}

	if (!write) {
		console.log(H('DRY RUN — nothing written'));
		console.log('  no client created, no token read, no documents written.');
		console.log('  re-run with --write to create any missing province locations.\n');
		return;
	}

	const token =
		process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();
	if (!token) {
		console.error(
			'\x1b[31mMissing write credentials.\x1b[0m Export SANITY_API_TOKEN=… or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: API_VERSION,
		token,
		useCdn: false
	});

	// Report created vs already-present accurately (createIfNotExists is silent about which).
	const ids = docs.map((d) => d._id);
	const existing = new Set(
		await client.fetch<string[]>('*[_id in $ids]._id', { ids })
	);

	console.log(H(`WRITING → ${PROJECT_ID}/${dataset}`));
	let created = 0;
	let skipped = 0;
	for (const doc of docs) {
		if (existing.has(doc._id)) {
			console.log(`  · ${doc._id} already exists — left untouched`);
			skipped++;
			continue;
		}
		await client.createIfNotExists(doc);
		console.log(`  ✓ ${doc._id} created`);
		created++;
	}
	console.log(`\nDone. ${created} created, ${skipped} already present.`);
	console.log('Communities below these are created on demand by the external review agents.\n');
}

main().catch((err) => {
	console.error('\x1b[31mSeed failed:\x1b[0m', err instanceof Error ? err.message : err);
	process.exit(1);
});
