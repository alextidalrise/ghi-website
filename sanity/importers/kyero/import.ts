#!/usr/bin/env tsx
/**
 * Kyero feed → DRAFT propertyListing documents (idempotent, change-aware sync).
 *
 * First sight of a listing → createOrReplace a fresh draft. On re-sync it NEVER replaces an
 * existing doc (that would wipe communities, GHI ids, ingested galleries and edited copy).
 * Instead it detects what the FEED changed since the last sync and surfaces every change as a
 * pending change + a blocking review item for HUMAN APPROVAL — nothing is auto-applied. See
 * sync.ts and docs/kyero-feed-ingestion-plan.md (Epic 1.8).
 *
 * Per existing listing the sync does one of:
 *   - baseline  : doc has no stored snapshot yet → adopt the current feed as the baseline (no flags)
 *   - unchanged : feed identical to the stored snapshot → skip (no write)
 *   - changed   : feed moved → record pendingChanges + blocking review items (patch, no overwrite)
 * Listings absent from the feed → flagged as removal candidates (never deleted).
 *
 *   pnpm --filter sanity kyero:import                          # dry-run, default feed URL
 *   pnpm --filter sanity kyero:import -- --file path/to.xml    # dry-run a local fixture
 *   pnpm --filter sanity kyero:import -- --limit 5             # only the first 5 (skips removal scan)
 *   pnpm --filter sanity kyero:import -- --write               # WRITE → development
 *   pnpm --filter sanity kyero:import -- --write --dataset development
 *
 * Reads the dataset in BOTH modes (to diff against existing docs), so a token is required
 * either way; dry-run writes nothing. Auth: SANITY_API_TOKEN (write), or a logged-in Sanity
 * CLI. Refuses the production dataset outright.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@sanity/client';
import { parseFeed } from './parse';
import { buildDraft, buildProvinceConsensus, draftId, type DraftListing } from './build-draft';
import { reconcileExisting, reconcileRemoval, type ExistingDraft } from './sync';

const DEFAULT_URL = 'https://www.propertyportalmarketing.com/xml/murciaservices-kyero.xml';
const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const API_VERSION = '2025-05-01';

const argv = process.argv.slice(2);
const write = argv.includes('--write');
function arg(flag: string): string | undefined {
	const i = argv.indexOf(flag);
	return i >= 0 ? argv[i + 1] : undefined;
}

const dataset = arg('--dataset') ?? process.env.SANITY_STUDIO_DATASET ?? 'development';
const limit = arg('--limit') ? Math.max(0, parseInt(arg('--limit') as string, 10)) : undefined;

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config/sanity/config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		return (JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string }).authToken;
	} catch {
		return undefined;
	}
}

async function loadXml(): Promise<{ source: string; xml: string }> {
	const file = arg('--file');
	if (file) return { source: file, xml: readFileSync(file, 'utf8') };
	const url = arg('--url') ?? DEFAULT_URL;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Feed fetch failed: ${res.status} ${res.statusText}`);
	return { source: url, xml: await res.text() };
}

const EXISTING_PROJECTION = `*[_type=="propertyListing" && _id match "kyero-import-*"]{
	_id,
	"snapshotJson": internal.feedImport.snapshotJson,
	"pendingChanges": internal.feedImport.pendingChanges,
	reviewItems,
	"current": {
		"price": pricing.price,
		"transactionType": transactionType,
		"propertyType": propertyType,
		"buildStatus": specs.buildStatus,
		"bedrooms": specs.bedrooms,
		"bathrooms": specs.bathrooms,
		"builtArea": specs.builtArea,
		"plotSize": specs.plotSize,
		"pool": specs.pool,
		"videoUrl": media.videoUrl,
		"shortDescription": content.shortDescription
	}
}`;

async function main() {
	if (dataset === 'production') {
		console.error('Refusing to run against the production dataset.');
		process.exit(1);
	}

	const token =
		process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();
	if (!token) {
		console.error(
			'\x1b[31mMissing credentials.\x1b[0m This sync reads the dataset in both modes. Export SANITY_API_TOKEN=… or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}
	const client = createClient({ projectId: PROJECT_ID, dataset, apiVersion: API_VERSION, token, useCdn: false });

	const { source, xml } = await loadXml();
	const { properties } = parseFeed(xml);
	const slice = limit != null ? properties.slice(0, limit) : properties;

	const now = new Date().toISOString();
	const provinceConsensus = buildProvinceConsensus(properties);
	const existingRows = await client.fetch<ExistingDraft[]>(EXISTING_PROJECTION);
	const existingById = new Map(existingRows.map((r) => [r._id, r]));
	const allFeedIds = new Set(properties.map((p) => draftId(p.ref || p.id)));

	// ---- classify ----
	const creates: DraftListing[] = [];
	const patches: { id: string; set: Record<string, unknown> }[] = [];
	const tally = { new: 0, baseline: 0, unchanged: 0, changed: 0, removed: 0, fieldUpdates: 0, fieldConflicts: 0, imageFlags: 0 };
	const changedSamples: string[] = [];
	const removedSamples: string[] = [];

	for (const p of slice) {
		const id = draftId(p.ref || p.id);
		const existing = existingById.get(id);
		if (!existing) {
			tally.new++;
			creates.push(
				buildDraft(p, { importedAt: now, provinceHint: provinceConsensus.get((p.town ?? '').trim().toLowerCase()) })
			);
			continue;
		}
		const r = reconcileExisting(existing, p, now);
		if (r.action === 'unchanged') {
			tally.unchanged++;
			continue;
		}
		if (r.action === 'baseline') {
			tally.baseline++;
			patches.push({ id, set: r.set });
			continue;
		}
		tally.changed++;
		tally.fieldUpdates += r.updates;
		tally.fieldConflicts += r.conflicts;
		if (r.imageFlag) tally.imageFlags++;
		patches.push({ id, set: r.set });
		if (changedSamples.length < 5) changedSamples.push(`  ${id}\n     ${r.notes.join('\n     ')}`);
	}

	// ---- removals (full-feed only; a --limit run is a partial view, so it never flags removals) ----
	const removalPatches: { id: string; set: Record<string, unknown> }[] = [];
	if (limit == null) {
		for (const row of existingRows) {
			if (allFeedIds.has(row._id)) continue;
			tally.removed++;
			removalPatches.push({ id: row._id, set: reconcileRemoval(row, now) });
			if (removedSamples.length < 5) removedSamples.push(`  ${row._id}`);
		}
	}

	// ---- report ----
	const H = (t: string) => `\n\x1b[1m${t}\x1b[0m`;
	const mode = write ? '\x1b[31mWRITE\x1b[0m' : '\x1b[32mdry-run\x1b[0m';
	console.log(`\x1b[1m\x1b[36mKYERO SYNC\x1b[0m  (${mode})`);
	console.log(`source        : ${source}`);
	console.log(`target        : ${PROJECT_ID}/${dataset}`);
	console.log(`feed listings : ${properties.length}${limit != null ? `  (processing first ${slice.length})` : ''}`);
	console.log(`existing drafts: ${existingRows.length}`);

	console.log(H('RUN SUMMARY'));
	console.log(`  new (created)          : ${tally.new}`);
	console.log(`  baselined (snapshot)   : ${tally.baseline}`);
	console.log(`  unchanged (skipped)    : ${tally.unchanged}`);
	console.log(`  changed (flagged)      : ${tally.changed}  → field updates ${tally.fieldUpdates}, conflicts ${tally.fieldConflicts}, image flags ${tally.imageFlags}`);
	console.log(`  removed (flagged)      : ${tally.removed}${limit != null ? '  \x1b[33m(removal scan skipped under --limit)\x1b[0m' : ''}`);
	console.log('  \x1b[2m(changes are surfaced for human approval — nothing is auto-applied)\x1b[0m');

	if (changedSamples.length) {
		console.log(H('SAMPLE — changed listings'));
		console.log(changedSamples.join('\n'));
	}
	if (removedSamples.length) {
		console.log(H('SAMPLE — removal candidates'));
		console.log(removedSamples.join('\n'));
	}

	if (!write) {
		console.log(H('DRY RUN — nothing written'));
		console.log(`  would create ${creates.length}, patch ${patches.length + removalPatches.length}. Re-run with --write.\n`);
		return;
	}

	// ---- write ----
	console.log(H(`WRITING → ${PROJECT_ID}/${dataset}`));
	let done = 0;
	const totalWrites = creates.length + patches.length + removalPatches.length;
	const tick = () => {
		done++;
		if (done % 25 === 0 || done === totalWrites) console.log(`  ✓ ${done}/${totalWrites}`);
	};
	for (const doc of creates) {
		await client.createOrReplace(doc);
		tick();
	}
	for (const { id, set } of [...patches, ...removalPatches]) {
		await client.patch(id).set(set).commit({ autoGenerateArrayKeys: false });
		tick();
	}
	console.log(
		`\nDone. ${tally.new} created, ${tally.baseline} baselined, ${tally.changed} changed, ${tally.removed} removal-flagged, ${tally.unchanged} unchanged (untouched).\n`
	);
}

main().catch((err) => {
	console.error('\x1b[31mSync failed:\x1b[0m', err instanceof Error ? err.message : err);
	process.exit(1);
});
