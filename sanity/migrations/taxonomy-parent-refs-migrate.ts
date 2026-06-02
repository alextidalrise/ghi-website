#!/usr/bin/env node
/**
 * Create missing locationTaxonomy documents referenced by broken parent refs
 * and repair community parent links so Presentation location resolution works.
 *
 * Usage:
 *   pnpm --filter sanity migrate:taxonomy-parent-refs -- --dataset development
 *   pnpm --filter sanity migrate:taxonomy-parent-refs -- --dataset development --dry-run
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

type Reference = { _type: 'reference'; _ref: string };

type TaxonomyDoc = {
	_id: string;
	_type: 'locationTaxonomy';
	name?: string;
	slug?: { _type?: string; current?: string };
	type?: string;
	parent?: Reference | null;
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

/** Communities with no parent that should belong to a known location ref. */
const COMMUNITY_PARENT_OVERRIDES: Record<string, string> = {
	'ea121e21-1002-4cf5-86d3-1202cd1bc74f': stablePlacesId('location', 'marbella')
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

function slugToName(slug: string): string {
	return slug
		.split('-')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function legacyRefToStableId(refId: string): string | null {
	return legacyRefToStablePlacesId(refId);
}

function refExists(refId: string, existingIds: Set<string>): boolean {
	if (existingIds.has(refId)) return true;
	const stableId = legacyRefToStableId(refId);
	return stableId ? existingIds.has(stableId) : false;
}

function ref(value: string): Reference {
	return { _type: 'reference', _ref: value };
}

function inferTaxonomyFromLegacyId(id: string): Pick<TaxonomyDoc, 'name' | 'slug' | 'type' | 'parent'> & { _id: string } | null {
	const parsed = parseDottedPlacesId(id);
	if (!parsed) return null;

	const doc = {
		_id: stablePlacesId(parsed.type, parsed.slug),
		type: parsed.type,
		name: slugToName(parsed.slug),
		slug: { _type: 'slug' as const, current: parsed.slug }
	};

	if (parsed.type === 'location') {
		return { ...doc, parent: ref(stablePlacesId('country', 'spain')) };
	}

	return doc;
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

async function main() {
	console.log(
		`Taxonomy parent ref migration → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createMigrationClient();
	const taxonomyDocs = await client.fetch<TaxonomyDoc[]>(
		`*[_type == "locationTaxonomy"]{ _id, _type, name, slug, type, parent }`
	);
	const existingIds = new Set(taxonomyDocs.map((doc) => doc._id));
	const actions: string[] = [];

	const missingRefIds = new Set<string>();
	for (const doc of taxonomyDocs) {
		const parentRef = doc.parent?._ref;
		if (parentRef && !refExists(parentRef, existingIds)) {
			missingRefIds.add(parentRef);
		}
	}

	function refSortPriority(id: string): number {
		const parsed = parseDottedPlacesId(id);
		if (!parsed) return 3;
		if (parsed.type === 'country') return 0;
		if (parsed.type === 'location') return 1;
		if (parsed.type === 'community') return 2;
		return 3;
	}

	while (missingRefIds.size > 0) {
		const refId = [...missingRefIds].sort((a, b) => refSortPriority(a) - refSortPriority(b))[0];
		missingRefIds.delete(refId);

		if (existingIds.has(refId) || (legacyRefToStableId(refId) && existingIds.has(legacyRefToStableId(refId)!))) {
			continue;
		}

		const inferred = inferTaxonomyFromLegacyId(refId);
		if (!inferred) {
			actions.push(`skip unrecognised missing ref ${refId}`);
			continue;
		}

		if (inferred.parent?._ref && !refExists(inferred.parent._ref, existingIds)) {
			missingRefIds.add(inferred.parent._ref);
		}

		const doc: TaxonomyDoc = {
			_id: inferred._id,
			_type: 'locationTaxonomy',
			name: inferred.name,
			slug: inferred.slug,
			type: inferred.type,
			...(inferred.parent ? { parent: inferred.parent } : {})
		};

		actions.push(`create taxonomy ${refId} (${inferred.type})`);
		existingIds.add(refId);

		if (!dryRun) {
			await client.createIfNotExists(doc);
		}
	}

	// Re-fetch if we created docs so overrides see updated state.
	const docsAfterCreate = dryRun
		? taxonomyDocs
		: await client.fetch<TaxonomyDoc[]>(
				`*[_type == "locationTaxonomy"]{ _id, _type, name, slug, type, parent }`
			);

	for (const [communityId, locationId] of Object.entries(COMMUNITY_PARENT_OVERRIDES)) {
		const community = docsAfterCreate.find((doc) => doc._id === communityId);
		if (!community || community.type !== 'community') continue;
		if (community.parent?._ref === locationId) continue;

		actions.push(`set parent on ${communityId} (${community.name ?? 'community'}) → ${locationId}`);
		if (!dryRun) {
			await client.patch(communityId).set({ parent: ref(locationId) }).commit();
		}
	}

	console.log(`\nPlanned actions: ${actions.length}`);
	for (const action of actions) console.log(`  • ${action}`);

	const verify = await client.fetch<{
		brokenParentRefs: number;
		communitiesMissingParent: number;
	}>(
		`{
      "brokenParentRefs": count(*[
        _type == "locationTaxonomy"
        && defined(parent._ref)
        && !defined(*[_id == ^.parent._ref][0]._id)
      ]),
      "communitiesMissingParent": count(*[
        _type == "locationTaxonomy"
        && type == "community"
        && !defined(parent._ref)
      ])
    }`,
		{},
		{ perspective: 'raw', cacheMode: 'noStale' }
	);

	console.log('\nPost-migration verification:');
	console.log(`  taxonomy docs with broken parent refs: ${verify.brokenParentRefs}`);
	console.log(`  communities missing parent: ${verify.communitiesMissingParent}`);

	if (!dryRun && (verify.brokenParentRefs > 0 || verify.communitiesMissingParent > 0)) {
		console.error('\nMigration verification failed.');
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
