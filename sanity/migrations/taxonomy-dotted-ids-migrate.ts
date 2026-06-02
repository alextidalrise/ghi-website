#!/usr/bin/env node
/**
 * Re-key locationTaxonomy documents to stable places-* IDs (no dots).
 * Sanity hides dotted IDs (location.* / places.*) from anonymous API clients.
 *
 * Usage:
 *   pnpm --filter sanity migrate:taxonomy-dotted-ids -- --dataset development
 *   pnpm --filter sanity migrate:taxonomy-dotted-ids -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { legacyRefToStablePlacesId, parseDottedPlacesId, stablePlacesId } from './lib/placesIds';

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

type TaxonomyDoc = {
	_id: string;
	_type: 'locationTaxonomy';
	_rev?: string;
	type?: string;
	slug?: { current?: string };
	[key: string]: unknown;
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

function createMigrationClient(): SanityClient {
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

function docSlug(doc: TaxonomyDoc): string {
	if (doc.slug?.current) return doc.slug.current;
	const parsed = parseDottedPlacesId(doc._id);
	if (parsed) return parsed.slug;
	return doc._id.split('.').pop() ?? doc._id;
}

function docLevel(doc: TaxonomyDoc): string {
	if (typeof doc.type === 'string') return doc.type;
	const parsed = parseDottedPlacesId(doc._id);
	return parsed?.type ?? 'taxonomy';
}

function typeRank(type: unknown): number {
	if (type === 'country') return 0;
	if (type === 'location') return 1;
	if (type === 'community') return 2;
	return 3;
}

function mapRef(ref: string | undefined, idMap: Record<string, string>): string | undefined {
	if (!ref) return ref;
	return idMap[ref] ?? legacyRefToStablePlacesId(ref) ?? ref;
}

function remapReferences(value: unknown, idMap: Record<string, string>): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => remapReferences(item, idMap));
	}

	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		if (record._type === 'reference' && typeof record._ref === 'string') {
			const nextRef = mapRef(record._ref, idMap);
			return nextRef === record._ref ? record : { ...record, _ref: nextRef };
		}

		const next: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(record)) {
			if (key.startsWith('_')) {
				next[key] = child;
			} else {
				next[key] = remapReferences(child, idMap);
			}
		}
		return next;
	}

	return value;
}

function buildReplacementDoc(doc: TaxonomyDoc, newId: string, idMap: Record<string, string>): TaxonomyDoc {
	const { _id: _oldId, _rev, _createdAt, _updatedAt, ...rest } = doc;
	const remapped = remapReferences(rest, idMap) as Omit<TaxonomyDoc, '_id' | '_rev'>;
	return {
		_id: newId,
		_type: 'locationTaxonomy',
		...remapped
	};
}

async function main() {
	console.log(
		`Place taxonomy ID migration → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createMigrationClient();
	const actions: string[] = [];

	const docsToMigrate = await client.fetch<TaxonomyDoc[]>(
		`*[
			_type == "locationTaxonomy"
			&& !(_id in path("drafts.**"))
			&& (
				_id match "location.*"
				|| _id match "places.*"
				|| (!(_id match "places-*") && !(_id match "*.*"))
			)
		]`
	);

	const idMap: Record<string, string> = {};
	for (const doc of docsToMigrate) {
		if (idMap[doc._id]) continue;
		const slug = docSlug(doc);
		const level = docLevel(doc);
		idMap[doc._id] = stablePlacesId(level, slug);
	}

	// Resolve duplicate targets (keep first source per stable ID).
	const targetToSource = new Map<string, string>();
	for (const [oldId, newId] of Object.entries(idMap)) {
		if (!targetToSource.has(newId)) {
			targetToSource.set(newId, oldId);
			continue;
		}
		const existing = targetToSource.get(newId)!;
		const keepExisting = typeRank(docLevel({ _id: existing, _type: 'locationTaxonomy' })) <= typeRank(docLevel({ _id: oldId, _type: 'locationTaxonomy' }));
		const drop = keepExisting ? oldId : existing;
		const keep = keepExisting ? existing : oldId;
		targetToSource.set(newId, keep);
		delete idMap[drop];
		actions.push(`skip duplicate target ${newId} (drop ${drop}, keep ${keep})`);
	}

	const sortedDocs = [...docsToMigrate]
		.filter((doc) => idMap[doc._id])
		.sort((a, b) => typeRank(docLevel(a)) - typeRank(docLevel(b)));

	for (const doc of sortedDocs) {
		const newId = idMap[doc._id];
		actions.push(`create ${newId} ← copy of ${doc._id}`);
		if (!dryRun) {
			await client.createOrReplace(buildReplacementDoc(doc, newId, idMap));
		}
	}

	const oldIds = Object.keys(idMap);
	const referencingDocs = await client.fetch<Array<{ _id: string; _type: string }>>(
		`*[references($oldIds)]{ _id, _type }`,
		{ oldIds }
	);

	for (const docId of referencingDocs.map((doc) => doc._id)) {
		if (oldIds.includes(docId)) continue;

		const doc = await client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, { id: docId });
		if (!doc) continue;

		const remapped = remapReferences(doc, idMap) as Record<string, unknown>;
		const changed = JSON.stringify(doc) !== JSON.stringify(remapped);
		if (!changed) continue;

		const { _id, _type, _rev, ...setFields } = remapped;
		actions.push(`patch ${docId} (remap references)`);
		if (!dryRun) {
			await client.patch(docId).set(setFields).commit();
		}
	}

	for (const oldId of [...oldIds].sort((a, b) => {
		const docA = docsToMigrate.find((doc) => doc._id === a);
		const docB = docsToMigrate.find((doc) => doc._id === b);
		return typeRank(docLevel(docB ?? { _id: b, _type: 'locationTaxonomy' })) - typeRank(docLevel(docA ?? { _id: a, _type: 'locationTaxonomy' }));
	})) {
		actions.push(`delete ${oldId}`);
		if (!dryRun) {
			await client.delete(oldId);
			if (!oldId.includes('.')) {
				try {
					await client.delete(`drafts.${oldId}`);
				} catch {
					// Draft may not exist.
				}
			}
		}
	}

	console.log(`\nPlanned actions: ${actions.length}`);
	for (const action of actions) console.log(`  • ${action}`);

	const verify = await client.fetch<{
		dottedLocationRemaining: number;
		dottedPlacesRemaining: number;
		legacyIdsRemaining: number;
		countries: number;
		locations: number;
		communities: number;
	}>(
		`{
      "dottedLocationRemaining": count(*[_type == "locationTaxonomy" && _id match "location.*"]),
      "dottedPlacesRemaining": count(*[_type == "locationTaxonomy" && _id match "places.*"]),
      "legacyIdsRemaining": count(*[
        _type == "locationTaxonomy"
        && !(_id match "places-*")
        && !(_id in path("drafts.**"))
      ]),
      "countries": count(*[_type == "locationTaxonomy" && type == "country"]),
      "locations": count(*[_type == "locationTaxonomy" && type == "location"]),
      "communities": count(*[_type == "locationTaxonomy" && type == "community"])
    }`,
		{},
		{ perspective: 'raw', cacheMode: 'noStale' }
	);

	console.log('\nPost-migration verification (authenticated):');
	console.log(`  location.* IDs remaining: ${verify.dottedLocationRemaining}`);
	console.log(`  places.* IDs remaining: ${verify.dottedPlacesRemaining}`);
	console.log(`  non-places-* root IDs remaining: ${verify.legacyIdsRemaining}`);
	console.log(`  countries / locations / communities: ${verify.countries} / ${verify.locations} / ${verify.communities}`);

	if (!dryRun) {
		const anon = createClient({
			projectId: PROJECT_ID,
			dataset,
			apiVersion: '2025-05-01',
			useCdn: false,
			perspective: 'published'
		});
		const marbella = await anon.fetch(
			`*[_type == "locationTaxonomy" && type == "location" && slug.current == "marbella" && parent->slug.current == "spain"][0]{ _id, name }`
		);
		console.log('\nAnonymous API check (marbella location):');
		console.log(marbella ? `  OK — ${marbella._id}` : '  FAILED — still not visible without auth');
		if (!marbella) process.exitCode = 1;
	}

	if (
		!dryRun &&
		(verify.dottedLocationRemaining > 0 ||
			verify.dottedPlacesRemaining > 0 ||
			verify.legacyIdsRemaining > 0)
	) {
		console.error('\nMigration verification failed.');
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
