#!/usr/bin/env node
/**
 * Delete all locationTaxonomy documents and clear listing location references.
 *
 * Usage:
 *   pnpm --filter sanity wipe:location-taxonomy -- --dataset development
 *   pnpm --filter sanity wipe:location-taxonomy -- --dataset development --dry-run
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

const LOCATION_OBJECT_REF_FIELDS = [
	'location.country',
	'location.location',
	'location.community'
] as const;

const TOP_LEVEL_REF_FIELDS: Record<string, readonly string[]> = {
	golfCourse: ['location']
};

function isTaxonomyReference(value: unknown, taxonomyIds: Set<string>): boolean {
	if (
		value &&
		typeof value === 'object' &&
		'_type' in value &&
		value._type === 'reference' &&
		'_ref' in value &&
		typeof value._ref === 'string'
	) {
		return taxonomyIds.has(value._ref);
	}
	return false;
}

function collectTaxonomyReferencePaths(
	value: unknown,
	taxonomyIds: Set<string>,
	path = ''
): string[] {
	if (isTaxonomyReference(value, taxonomyIds)) {
		return path ? [path] : [];
	}

	if (Array.isArray(value)) {
		return value.flatMap((item, index) => {
			const itemPath = path ? `${path}[${index}]` : `[${index}]`;
			if (isTaxonomyReference(item, taxonomyIds)) return [itemPath];
			if (item && typeof item === 'object') {
				return collectTaxonomyReferencePaths(item, taxonomyIds, itemPath);
			}
			return [];
		});
	}

	if (value && typeof value === 'object') {
		return Object.entries(value).flatMap(([key, nested]) => {
			if (key.startsWith('_')) return [];
			const nestedPath = path ? `${path}.${key}` : key;
			return collectTaxonomyReferencePaths(nested, taxonomyIds, nestedPath);
		});
	}

	return [];
}

async function clearTaxonomyReferences(
	client: SanityClient,
	taxonomyIds: Set<string>,
	dryRun: boolean,
	actions: string[]
): Promise<void> {
	const referencingDocs = await client.fetch<Array<{ _id: string; _type: string }>>(
		`*[_type != "locationTaxonomy" && references(*[_type == "locationTaxonomy"]._id)]{ _id, _type }`
	);

	for (const doc of referencingDocs) {
		const knownFields = TOP_LEVEL_REF_FIELDS[doc._type] ?? [];
		const objectFields = doc._type === 'propertyListing' || doc._type === 'development'
			? LOCATION_OBJECT_REF_FIELDS
			: [];

		const unsetPaths = [...new Set([...knownFields, ...objectFields])];
		if (unsetPaths.length > 0) {
			actions.push(`unset ${doc._id} (${doc._type}) ${unsetPaths.join(', ')}`);
			if (!dryRun) {
				await client.patch(doc._id).unset([...unsetPaths]).commit();
			}
			continue;
		}

		const full = await client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, {
			id: doc._id
		});
		if (!full) continue;

		const dynamicPaths = collectTaxonomyReferencePaths(full, taxonomyIds);
		if (dynamicPaths.length === 0) continue;

		actions.push(`unset ${doc._id} (${doc._type}) ${dynamicPaths.join(', ')}`);
		if (!dryRun) {
			await client.patch(doc._id).unset(dynamicPaths).commit();
		}
	}

	const taxonomyDocs = await client.fetch<Array<{ _id: string; type?: string }>>(
		`*[_type == "locationTaxonomy"]{ _id, type }`
	);

	for (const doc of taxonomyDocs) {
		const full = await client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, {
			id: doc._id
		});
		if (!full) continue;

		const unsetPaths = collectTaxonomyReferencePaths(full, taxonomyIds);
		if (unsetPaths.length === 0) continue;

		actions.push(`unset ${doc._id} (locationTaxonomy) ${unsetPaths.join(', ')}`);
		if (!dryRun) {
			await client.patch(doc._id).unset(unsetPaths).commit();
		}
	}
}

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

function rankType(type?: string): number {
	if (type === 'community') return 2;
	if (type === 'location') return 1;
	if (type === 'country') return 0;
	return 1;
}

async function main() {
	console.log(
		`Wipe location taxonomy → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createClientOrThrow();
	const actions: string[] = [];

	const taxonomyDocs = await client.fetch<Array<{ _id: string; type?: string }>>(
		`*[_type == "locationTaxonomy"]{ _id, type }`
	);
	const taxonomyIds = new Set(taxonomyDocs.map((doc) => doc._id));

	await clearTaxonomyReferences(client, taxonomyIds, dryRun, actions);

	const remainingTaxonomy = await client.fetch<Array<{ _id: string; type?: string }>>(
		`*[_type == "locationTaxonomy"]{ _id, type }`
	);

	const toDelete = [...remainingTaxonomy].sort(
		(a, b) => rankType(b.type) - rankType(a.type) || a._id.localeCompare(b._id)
	);

	for (const doc of toDelete) {
		actions.push(`delete ${doc._id} (${doc.type ?? 'unknown'})`);
		if (!dryRun) await client.delete(doc._id);
	}

	console.log(`\nPlanned actions: ${actions.length}`);
	for (const action of actions) console.log(`  • ${action}`);

	const verify = await client.fetch<{
		total: number;
		referencing: number;
	}>(
		`{
      "total": count(*[_type == "locationTaxonomy"]),
      "referencing": count(*[_type != "locationTaxonomy" && references(*[_type == "locationTaxonomy"]._id)])
    }`
	);

	console.log('\nPost-wipe verification:');
	console.log(`  locationTaxonomy remaining: ${verify.total}`);
	console.log(`  listing docs still referencing taxonomy: ${verify.referencing}`);

	if (!dryRun && (verify.total > 0 || verify.referencing > 0)) {
		console.error('\nWipe verification failed.');
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
