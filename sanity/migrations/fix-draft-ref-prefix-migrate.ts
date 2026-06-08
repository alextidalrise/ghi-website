#!/usr/bin/env node
/**
 * Normalise draft-only development intake packages for Sanity's reference model.
 *
 * Intake sometimes stores reference `_ref` values with a `drafts.` prefix and creates
 * documents only at `drafts.{id}`. Sanity expects refs to use the canonical `{id}` and
 * for that document to exist — otherwise `units[]->` returns null under the `drafts`
 * API perspective and development pages crash in dev preview.
 *
 * Phase 1: createOrReplace at `{id}` for draft-only development / unit / unitType docs
 * Phase 2: strip `drafts.` from reference fields on developments, units, and unit types
 *
 * Usage:
 *   pnpm --filter sanity migrate:fix-draft-ref-prefix -- --dataset development
 *   pnpm --filter sanity migrate:fix-draft-ref-prefix:dry-run -- --dataset development
 */
import { createClient, type SanityClient, type SanityDocument } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOC_TYPES = ['development', 'unit', 'unitType'] as const;

type Reference = {
	_type: 'reference';
	_ref: string;
	_key?: string;
	_weak?: boolean;
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

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

function canonicalRef(ref: string | undefined): string | undefined {
	if (!ref?.startsWith('drafts.')) return ref;
	return ref.slice('drafts.'.length);
}

function fixRefArray(items: Reference[] | null | undefined): Reference[] | undefined {
	if (!Array.isArray(items)) return undefined;

	let changed = false;
	const next = items.map((item) => {
		const canonical = canonicalRef(item._ref);
		if (!canonical || canonical === item._ref) return item;
		changed = true;
		return { ...item, _ref: canonical };
	});

	return changed ? next : undefined;
}

function fixSingleRef(ref: Reference | null | undefined): Reference | undefined {
	if (!ref?._ref) return undefined;
	const canonical = canonicalRef(ref._ref);
	if (!canonical || canonical === ref._ref) return undefined;
	return { ...ref, _ref: canonical };
}

async function fetchDraftOnlyDocs(client: SanityClient): Promise<Array<{ _id: string; _type: string }>> {
	return client.fetch(
		`*[
			_id match "drafts.*"
			&& _type in $types
		]{
			_id,
			_type,
			"baseId": string::split(_id, "drafts.")[1],
			"baseExists": defined(*[_id == string::split(^._id, "drafts.")[1]][0]._id)
		}[baseExists != true]{ _id, _type }`,
		{ types: DOC_TYPES }
	);
}

async function materialiseBaseDocuments(
	client: SanityClient,
	docs: Array<{ _id: string; _type: string }>
): Promise<number> {
	let created = 0;

	for (const row of docs) {
		const baseId = row._id.slice('drafts.'.length);
		const draft = await client.getDocument<SanityDocument>(row._id);
		if (!draft) continue;

		const existing = await client.getDocument(baseId);
		if (existing) continue;

		const { _id, _rev, _createdAt, _updatedAt, ...content } = draft;
		console.log(`  [${dryRun ? 'dry-run' : 'create'}] ${row._type} ${baseId} (from ${row._id})`);

		if (!dryRun) {
			await client.createOrReplace({ ...content, _id: baseId });
		}
		created++;
	}

	return created;
}

type PatchTarget = {
	_id: string;
	_type: string;
	patch: Record<string, unknown>;
};

async function collectReferencePatches(client: SanityClient): Promise<PatchTarget[]> {
	const developments = await client.fetch<
		Array<{
			_id: string;
			units?: Reference[];
			unitTypes?: Reference[];
		}>
	>(`*[_type == "development"]{ _id, units, unitTypes }`);

	const units = await client.fetch<
		Array<{
			_id: string;
			parentDevelopment?: Reference;
			parentUnitType?: Reference;
		}>
	>(`*[_type == "unit"]{ _id, parentDevelopment, parentUnitType }`);

	const unitTypes = await client.fetch<
		Array<{
			_id: string;
			parentDevelopment?: Reference;
		}>
	>(`*[_type == "unitType"]{ _id, parentDevelopment }`);

	const patches: PatchTarget[] = [];

	for (const doc of developments) {
		const patch: Record<string, unknown> = {};
		const units = fixRefArray(doc.units);
		const unitTypes = fixRefArray(doc.unitTypes);
		if (units) patch.units = units;
		if (unitTypes) patch.unitTypes = unitTypes;
		if (Object.keys(patch).length > 0) {
			patches.push({ _id: doc._id, _type: 'development', patch });
		}
	}

	for (const doc of units) {
		const patch: Record<string, unknown> = {};
		const parentDevelopment = fixSingleRef(doc.parentDevelopment);
		const parentUnitType = fixSingleRef(doc.parentUnitType);
		if (parentDevelopment) patch.parentDevelopment = parentDevelopment;
		if (parentUnitType) patch.parentUnitType = parentUnitType;
		if (Object.keys(patch).length > 0) {
			patches.push({ _id: doc._id, _type: 'unit', patch });
		}
	}

	for (const doc of unitTypes) {
		const parentDevelopment = fixSingleRef(doc.parentDevelopment);
		if (parentDevelopment) {
			patches.push({
				_id: doc._id,
				_type: 'unitType',
				patch: { parentDevelopment }
			});
		}
	}

	return patches;
}

async function applyPatches(client: SanityClient, patches: PatchTarget[]): Promise<number> {
	let applied = 0;

	for (const { _id, _type, patch } of patches) {
		console.log(`  [${dryRun ? 'dry-run' : 'patch'}] ${_type} ${_id}`, patch);
		if (!dryRun) {
			await client.patch(_id).set(patch).commit();
		}
		applied++;
	}

	return applied;
}

async function verifyCapriUnits(client: SanityClient): Promise<void> {
	const draftsClient = client.withConfig({ perspective: 'drafts' });
	const resolved = await draftsClient.fetch<number>(
		`count(*[_type == "development" && ghiListingId == "GHI00126"][0].units[]->)`
	);
	console.log(`\nVerification: Capri units resolved under drafts perspective: ${resolved}/8`);
}

async function main() {
	console.log(
		`Fix draft ref prefix → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}\n`
	);

	const client = createMigrationClient();

	console.log('Phase 1 — materialise base IDs for draft-only documents…');
	const draftOnly = await fetchDraftOnlyDocs(client);
	console.log(`  Found ${draftOnly.length} draft-only ${DOC_TYPES.join('/')} documents`);
	const created = await materialiseBaseDocuments(client, draftOnly);
	console.log(`  ${dryRun ? 'Would create' : 'Created'} ${created} base documents\n`);

	console.log('Phase 2 — normalise reference _ref values…');
	const patches = await collectReferencePatches(client);
	console.log(`  Found ${patches.length} documents with drafts.* refs`);
	const applied = await applyPatches(client, patches);
	console.log(`  ${dryRun ? 'Would patch' : 'Patched'} ${applied} documents`);

	if (!dryRun) {
		await verifyCapriUnits(client);
	}

	console.log('\nDone.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
