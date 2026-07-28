#!/usr/bin/env node
/**
 * Re-key editorial content documents from dotted IDs (insight.*, guide.*, author.*,
 * partner.*, partnerCategory.*) to dotless IDs.
 *
 * Sanity hides dotted IDs from anonymous (token-less) API clients, so the public
 * website — which reads the CDN anonymously with `perspective: 'published'` — sees
 * ZERO of these documents even when they are published. This mirrors the earlier
 * taxonomy-dotted-ids migration; see that file and CLAUDE.md for the incident context.
 *
 * The transform replaces every `.` in the base ID with `-`, preserving the `drafts.`
 * prefix and the document's draft/published status. Slugs are untouched, so public
 * URLs (which resolve by `slug.current`, not `_id`) do not change.
 *
 * Usage:
 *   pnpm --filter sanity migrate:content-dotted-ids -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:content-dotted-ids -- --dataset development
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

/** Types whose documents are publicly rendered and currently use dotted IDs. */
const TYPES = ['insight', 'guide', 'author', 'partner', 'partnerCategory'];

type AnyDoc = { _id: string; _type: string; _rev?: string; [key: string]: unknown };

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
		return (JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string }).authToken;
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
		if (key && process.env[key] === undefined) process.env[key] = value;
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

/** Strip a leading `drafts.` prefix, returning [prefix, baseId]. */
function splitDraft(id: string): [string, string] {
	return id.startsWith('drafts.') ? ['drafts.', id.slice('drafts.'.length)] : ['', id];
}

/** Dotless target ID, preserving draft status. Returns null when already dotless. */
function dotlessId(id: string): string | null {
	const [prefix, base] = splitDraft(id);
	if (!base.includes('.')) return null;
	return prefix + base.replaceAll('.', '-');
}

function mapRef(ref: string | undefined, idMap: Record<string, string>): string | undefined {
	if (!ref) return ref;
	return idMap[ref] ?? ref;
}

function remapReferences(value: unknown, idMap: Record<string, string>): unknown {
	if (Array.isArray(value)) return value.map((item) => remapReferences(item, idMap));
	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		if (record._type === 'reference' && typeof record._ref === 'string') {
			const nextRef = mapRef(record._ref, idMap);
			return nextRef === record._ref ? record : { ...record, _ref: nextRef };
		}
		const next: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(record)) {
			next[key] = key.startsWith('_') ? child : remapReferences(child, idMap);
		}
		return next;
	}
	return value;
}

function buildReplacementDoc(doc: AnyDoc, newId: string, idMap: Record<string, string>): AnyDoc {
	const { _id: _o, _rev: _r, _createdAt: _c, _updatedAt: _u, ...rest } = doc;
	const remapped = remapReferences(rest, idMap) as Record<string, unknown>;
	return { _id: newId, ...remapped } as AnyDoc;
}

async function main() {
	console.log(
		`Content dotted-ID migration → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);
	console.log(`Types: ${TYPES.join(', ')}\n`);

	const client = createMigrationClient();
	const actions: string[] = [];

	// All docs (published + draft) of the target types whose base ID is dotted.
	const allDocs = await client.fetch<AnyDoc[]>(`*[_type in $types]`, { types: TYPES });
	const docsToMigrate = allDocs.filter((doc) => dotlessId(doc._id) !== null);

	// Build old→new map covering BOTH published and draft forms.
	const idMap: Record<string, string> = {};
	for (const doc of docsToMigrate) {
		const newId = dotlessId(doc._id);
		if (newId) idMap[doc._id] = newId;
	}

	// Guard: two different source IDs must not collapse onto one target ID.
	const targetToSource: Record<string, string> = {};
	for (const [oldId, newId] of Object.entries(idMap)) {
		if (targetToSource[newId]) {
			console.error(
				`ABORT — duplicate target ${newId} from ${targetToSource[newId]} and ${oldId}`
			);
			process.exitCode = 1;
			return;
		}
		targetToSource[newId] = oldId;
	}

	const oldIds = Object.keys(idMap);

	// Creates + reference patches go in ONE transaction so intra-batch strong
	// references (e.g. a relatedInsights ref to another migrated doc) resolve at
	// commit instead of failing on create order.
	const writeTx = client.transaction();

	console.log(`Documents to re-key: ${docsToMigrate.length}`);
	for (const doc of docsToMigrate) {
		actions.push(`create ${idMap[doc._id]} ← copy of ${doc._id} (${doc._type})`);
		writeTx.createOrReplace(buildReplacementDoc(doc, idMap[doc._id], idMap));
	}

	// Patch every OTHER document that references a migrated ID.
	const referencingDocs = await client.fetch<Array<{ _id: string }>>(
		`*[references($oldIds)]{ _id }`,
		{ oldIds }
	);
	for (const { _id: docId } of referencingDocs) {
		if (oldIds.includes(docId)) continue; // itself being replaced/deleted
		const doc = await client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, {
			id: docId
		});
		if (!doc) continue;
		const remapped = remapReferences(doc, idMap) as Record<string, unknown>;
		if (JSON.stringify(doc) === JSON.stringify(remapped)) continue;
		const { _id, _type, _rev, _createdAt, _updatedAt, ...setFields } = remapped;
		actions.push(`patch ${docId} (remap references)`);
		writeTx.patch(docId, (p) => p.set(setFields));
	}

	if (!dryRun) await writeTx.commit({ visibility: 'sync' });

	// Delete the old dotted docs in ONE transaction so cross-references among the
	// deleted set (old A → old B) don't trip strong-ref validation.
	const deleteTx = client.transaction();
	for (const oldId of oldIds) {
		actions.push(`delete ${oldId}`);
		deleteTx.delete(oldId);
	}
	if (!dryRun) await deleteTx.commit({ visibility: 'sync' });

	console.log(`\nPlanned actions: ${actions.length}`);
	for (const action of actions) console.log(`  • ${action}`);

	// Verify: no dotted base IDs remain for these types (authenticated).
	const remaining = await client.fetch<number>(
		`count(*[_type in $types && (
			(!(_id in path("drafts.**")) && _id match "*.*")
			|| (_id in path("drafts.**") && string::split(_id, "drafts.")[1] match "*.*")
		)])`,
		{ types: TYPES },
		{ perspective: 'raw', cacheMode: 'noStale' }
	);
	console.log(`\nDotted base IDs remaining (authenticated): ${remaining}`);

	if (!dryRun) {
		const anon = createClient({
			projectId: PROJECT_ID,
			dataset,
			apiVersion: '2025-05-01',
			useCdn: false,
			perspective: 'published'
		});
		const check = await anon.fetch<{ insights: number; guides: number; partners: number }>(
			`{
				"insights": count(*[_type == "insight" && defined(publishedAt)]),
				"guides": count(*[_type == "guide"]),
				"partners": count(*[_type == "partner"])
			}`
		);
		console.log('\nAnonymous API check (published perspective, no token):');
		console.log(`  insights: ${check.insights}  guides: ${check.guides}  partners: ${check.partners}`);
		if (check.insights === 0) {
			console.error('FAILED — insights still not visible without auth');
			process.exitCode = 1;
		}
	}

	if (!dryRun && remaining > 0) {
		console.error('\nMigration verification failed — dotted IDs remain.');
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
