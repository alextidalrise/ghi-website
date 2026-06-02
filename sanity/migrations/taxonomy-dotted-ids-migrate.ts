#!/usr/bin/env node
/**
 * Re-key locationTaxonomy documents that use dotted IDs (e.g. location.country.spain).
 * Sanity hides dotted IDs from Studio document lists and anonymous API clients.
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

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

type Reference = { _type: 'reference'; _ref: string };

type TaxonomyDoc = {
	_id: string;
	_type: 'locationTaxonomy';
	_rev?: string;
	[key: string]: unknown;
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

/** Map legacy dotted IDs to stable, Studio-visible IDs. */
const ID_MAP: Record<string, string> = {
	'location.country.spain': 'taxonomy-country-spain',
	'location.municipality.marbella': 'taxonomy-location-marbella',
	'location.area.marbella-golden-mile': 'taxonomy-community-marbella-golden-mile'
};

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

function mapRef(ref: string | undefined, idMap: Record<string, string>): string | undefined {
	if (!ref) return ref;
	return idMap[ref] ?? ref;
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
		`Taxonomy dotted ID migration → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createMigrationClient();
	const actions: string[] = [];

	const dottedDocs = await client.fetch<TaxonomyDoc[]>(
		`*[_type == "locationTaxonomy" && _id match "location.*"]`
	);

	const idMap = { ...ID_MAP };
	for (const doc of dottedDocs) {
		if (!idMap[doc._id]) {
			const slug =
				typeof doc.slug === 'object' &&
				doc.slug !== null &&
				'current' in doc.slug &&
				typeof doc.slug.current === 'string'
					? doc.slug.current
					: doc._id.split('.').pop() ?? doc._id;
			const level = typeof doc.type === 'string' ? doc.type : 'taxonomy';
			idMap[doc._id] = `taxonomy-${level}-${slug}`;
		}
	}

	const sortedDottedDocs = [...dottedDocs].sort((a, b) => {
		const rank = (type: unknown) =>
			type === 'country' ? 0 : type === 'location' ? 1 : type === 'community' ? 2 : 3;
		return rank(a.type) - rank(b.type);
	});

	for (const doc of sortedDottedDocs) {
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
		const docA = dottedDocs.find((doc) => doc._id === a);
		const docB = dottedDocs.find((doc) => doc._id === b);
		const rank = (type: unknown) =>
			type === 'country' ? 0 : type === 'location' ? 1 : type === 'community' ? 2 : 3;
		return rank(docB?.type) - rank(docA?.type);
	})) {
		actions.push(`delete ${oldId}`);
		if (!dryRun) {
			await client.delete(oldId);
		}
	}

	console.log(`\nPlanned actions: ${actions.length}`);
	for (const action of actions) console.log(`  • ${action}`);

	const verify = await client.fetch<{
		dottedRemaining: number;
		countriesVisible: number;
	}>(
		`{
      "dottedRemaining": count(*[_type == "locationTaxonomy" && _id match "location.*"]),
      "countriesVisible": count(*[_type == "locationTaxonomy" && type == "country"])
    }`,
		{},
		{ perspective: 'raw', cacheMode: 'noStale' }
	);

	console.log('\nPost-migration verification (authenticated):');
	console.log(`  dotted taxonomy IDs remaining: ${verify.dottedRemaining}`);
	console.log(`  countries found: ${verify.countriesVisible}`);

	if (!dryRun && verify.dottedRemaining > 0) {
		console.error('\nMigration verification failed.');
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
