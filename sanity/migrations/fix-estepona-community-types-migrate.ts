#!/usr/bin/env node
/**
 * Fix two Estepona taxonomy nodes that were mis-typed as `location` when they are really
 * communities. Because the sitemap derives a node's URL depth from its `type` field (not its
 * real position in the tree), each mistype leaked a phantom two-segment URL — `countrySlug`
 * resolved to the parent location's slug — that then 404s:
 *
 *   places-community-catch-all-estepona   slug "estepona"       → /estepona/estepona
 *   aa559b84-…  (El Campanario)           slug "el-campanario"  → /estepona/el-campanario
 *
 * Both hang off the Estepona *location* (places-location-estepona), so a real location they
 * are not. Every other community in the dataset is typed correctly; these two are the only
 * `type == "location"` nodes at community depth.
 *
 * What this migration does:
 *   1. Estepona catch-all: set type → "community". `isCatchAll` is already true, so its
 *      listings keep their 3-segment catch-all canonical paths — nothing to re-point.
 *   2. El Campanario: set type → "community" (it is a real, non-catch-all community), and
 *      normalise its id from the lone Sanity auto-UUID to the deterministic
 *      `places-community-el-campanario` that all 89 other communities use. This copies the
 *      full document, re-points the one listing that references it, then deletes the UUID doc.
 *
 * It also completes one unrelated but same-class node: the Nueva Andalucía community
 * `places-community-las-brisas-golf-course-ghi00025`, a launch-day import artifact left with
 * no `type` at all. It is set to "community" (the type its slug/parent already imply). No URL
 * changes — a listing's path derives from the community *slug*, not its `type` — and it is
 * left as its own community rather than merged into the existing `las-brisas`, which would be
 * an editorial decision and would move a published listing's live URL.
 *
 * The runtime code guard (buildTaxonomyPath requires a location's parent to be a country)
 * stays in place as defence-in-depth; this migration removes the bad data that guard masks.
 *
 * Usage:
 *   pnpm --filter sanity migrate:fix-estepona-community-types -- --dataset development
 *   pnpm --filter sanity migrate:fix-estepona-community-types:dry-run -- --dataset development
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

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

const LISTING_TYPES = ['propertyListing', 'development'] as const;

const CATCH_ALL_ID = 'places-community-catch-all-estepona';
const CAMPANARIO_UUID = 'aa559b84-9417-4bfc-9e5d-821f2f53f817';
const CAMPANARIO_CANONICAL_ID = 'places-community-el-campanario';
const ESTEPONA_LOCATION_ID = 'places-location-estepona';
const LAS_BRISAS_GOLF_ID = 'places-community-las-brisas-golf-course-ghi00025';

type Reference = { _type: 'reference'; _ref: string; _key?: string };

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

/** Strip the `drafts.` prefix so we always store/reference the published id. */
function publishedId(id: string): string {
	return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;
}

/** Which of a doc's revisions actually exist — published id plus its `drafts.` twin. */
async function existingTargets(client: SanityClient, baseId: string): Promise<string[]> {
	const pub = publishedId(baseId);
	const ids = [pub, `drafts.${pub}`];
	return client.fetch<string[]>(`*[_id in $ids]._id`, { ids });
}

/** Apply the same patch to every existing revision of a document. */
async function patchAllTargets(
	client: SanityClient,
	baseId: string,
	patch: Record<string, unknown>
): Promise<number> {
	const targets = await existingTargets(client, baseId);
	if (targets.length === 0) {
		console.warn(`  no existing revision to patch for ${publishedId(baseId)}`);
		return 0;
	}
	for (const id of targets) {
		console.log(`  patch ${id} → ${JSON.stringify(patch)}`);
		if (!dryRun) await client.patch(id).set(patch).commit();
	}
	return targets.length;
}

function reference(refId: string): Reference {
	return { _type: 'reference', _ref: refId };
}

async function main() {
	console.log(`Fix Estepona community types → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}\n`);

	const client = createClientOrThrow();
	const flags: string[] = [];

	// --- 1. Estepona catch-all: type location → community (isCatchAll already true). --------
	const catchAll = await client.fetch<{ type?: string; isCatchAll?: boolean } | null>(
		`*[_id == $id][0]{ type, isCatchAll }`,
		{ id: CATCH_ALL_ID }
	);
	if (!catchAll) {
		flags.push(`${CATCH_ALL_ID} not found — nothing to fix (already renamed/removed?).`);
	} else {
		if (catchAll.type === 'community') {
			console.log(`✓ ${CATCH_ALL_ID} already type "community" — skipping.`);
		} else {
			console.log(`→ ${CATCH_ALL_ID}: type "${catchAll.type}" → "community"`);
			// isCatchAll is already true in the dataset; set it defensively so a re-typed
			// catch-all can never lose its 3-segment collapse behaviour.
			await patchAllTargets(client, CATCH_ALL_ID, { type: 'community', isCatchAll: true });
		}
	}

	// --- 2. El Campanario: type → community, and normalise the auto-UUID id. ---------------
	const canonicalExists = await client.fetch<string | null>(`*[_id == $id][0]._id`, {
		id: CAMPANARIO_CANONICAL_ID
	});
	const uuidDoc = await client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, {
		id: CAMPANARIO_UUID
	});

	if (canonicalExists && !uuidDoc) {
		console.log(`✓ El Campanario already normalised to ${CAMPANARIO_CANONICAL_ID} — skipping.`);
	} else if (!uuidDoc) {
		flags.push(
			`Neither ${CAMPANARIO_UUID} nor ${CAMPANARIO_CANONICAL_ID} found — El Campanario missing.`
		);
	} else {
		if (canonicalExists) {
			// A partial previous run: canonical doc exists alongside the UUID. Don't clobber it —
			// just re-point refs off the UUID and delete it below.
			flags.push(
				`${CAMPANARIO_CANONICAL_ID} already exists; re-pointing refs off ${CAMPANARIO_UUID} ` +
					`and deleting the UUID doc without overwriting the canonical one.`
			);
		} else {
			// Copy the full document under the canonical id, forcing type → community. Preserve
			// every authored field (name, slug, parent, coordinates, isCatchAll, …); drop only
			// system fields so Sanity assigns fresh ones.
			const {
				_id: _dropId,
				_rev: _dropRev,
				_createdAt: _dropCreated,
				_updatedAt: _dropUpdated,
				_system: _dropSystem,
				...fields
			} = uuidDoc;
			const newDoc = { ...fields, _id: CAMPANARIO_CANONICAL_ID, type: 'community' };
			console.log(
				`→ El Campanario: create ${CAMPANARIO_CANONICAL_ID} (type "community") from ${CAMPANARIO_UUID}`
			);
			if (!dryRun) await client.createIfNotExists(newDoc as { _id: string; _type: string });
		}

		// Re-point every listing that references the UUID community at the canonical id.
		const refs = await client.fetch<string[]>(
			`*[_type in $types && location.community._ref == $uuid]._id`,
			{ types: LISTING_TYPES, uuid: CAMPANARIO_UUID }
		);
		for (const listingId of refs) {
			console.log(`  re-point listing ${listingId}.location.community → ${CAMPANARIO_CANONICAL_ID}`);
			if (!dryRun) {
				await client
					.patch(listingId)
					.set({ 'location.community': reference(CAMPANARIO_CANONICAL_ID) })
					.commit();
			}
		}

		// Guard: never delete the old doc while anything still points at it.
		const remainingRefs = await client.fetch<string[]>(
			`*[references($uuid) && _id != $uuid && _id != "drafts." + $uuid]._id`,
			{ uuid: CAMPANARIO_UUID }
		);
		const stillReferencing = remainingRefs.filter(
			(id) => publishedId(id) !== CAMPANARIO_CANONICAL_ID
		);
		if (dryRun) {
			console.log(`  delete ${CAMPANARIO_UUID} (after re-pointing) [dry run]`);
		} else if (stillReferencing.length > 0) {
			flags.push(
				`${CAMPANARIO_UUID} still referenced by ${stillReferencing.length} doc(s) after ` +
					`re-point — retained, not deleted: ${stillReferencing.join(', ')}`
			);
		} else {
			for (const id of await existingTargets(client, CAMPANARIO_UUID)) {
				console.log(`  delete ${id}`);
				await client.delete(id);
			}
		}
	}

	// --- 3. Nueva Andalucía: complete the untyped Las Brisas Golf Course community. --------
	const golfNode = await client.fetch<{ type?: string | null } | null>(
		`*[_id == $id][0]{ type }`,
		{ id: LAS_BRISAS_GOLF_ID }
	);
	if (!golfNode) {
		flags.push(`${LAS_BRISAS_GOLF_ID} not found — nothing to fix (already removed?).`);
	} else if (golfNode.type === 'community') {
		console.log(`✓ ${LAS_BRISAS_GOLF_ID} already type "community" — skipping.`);
	} else {
		console.log(`→ ${LAS_BRISAS_GOLF_ID}: type "${golfNode.type ?? 'null'}" → "community"`);
		await patchAllTargets(client, LAS_BRISAS_GOLF_ID, { type: 'community' });
	}

	// --- 4. Verification -------------------------------------------------------------------
	const verify = await client.fetch<{
		catchAllType: string | null;
		campanarioType: string | null;
		uuidStillExists: boolean;
		uuidStillReferenced: number;
		badNodesUnderEstepona: number;
		golfNodeType: string | null;
		untypedTaxonomy: number;
	}>(
		`{
			"catchAllType": *[_id == $catchAll][0].type,
			"campanarioType": *[_id == $canonical][0].type,
			"uuidStillExists": count(*[_id == $uuid || _id == "drafts." + $uuid]) > 0,
			"uuidStillReferenced": count(*[references($uuid)]),
			"badNodesUnderEstepona": count(*[
				_type == "locationTaxonomy"
				&& type == "location"
				&& parent->_id == $esteponaLoc
			]),
			"golfNodeType": *[_id == $golf][0].type,
			"untypedTaxonomy": count(*[_type == "locationTaxonomy" && !defined(type)])
		}`,
		{
			catchAll: CATCH_ALL_ID,
			canonical: CAMPANARIO_CANONICAL_ID,
			uuid: CAMPANARIO_UUID,
			esteponaLoc: ESTEPONA_LOCATION_ID,
			golf: LAS_BRISAS_GOLF_ID
		}
	);

	console.log('\nPost-migration verification:');
	console.log(`  catch-all type:                     ${verify.catchAllType}`);
	console.log(`  el-campanario (canonical id) type:  ${verify.campanarioType}`);
	console.log(`  UUID doc still exists:              ${verify.uuidStillExists}`);
	console.log(`  UUID doc still referenced by:       ${verify.uuidStillReferenced} doc(s)`);
	console.log(`  mistyped "location" nodes under Estepona: ${verify.badNodesUnderEstepona}`);
	console.log(`  las-brisas-golf-course type:        ${verify.golfNodeType}`);
	console.log(`  untyped locationTaxonomy nodes:     ${verify.untypedTaxonomy}`);

	if (flags.length) {
		console.log('\n⚑ Flagged for manual review:');
		for (const f of flags) console.log(`  • ${f}`);
	}

	if (!dryRun) {
		const ok =
			verify.catchAllType === 'community' &&
			verify.campanarioType === 'community' &&
			!verify.uuidStillExists &&
			verify.uuidStillReferenced === 0 &&
			verify.badNodesUnderEstepona === 0 &&
			verify.golfNodeType === 'community' &&
			verify.untypedTaxonomy === 0;
		if (!ok) {
			console.error('\nVerification failed.');
			process.exitCode = 1;
		}
	}

	console.log('\nDone.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
