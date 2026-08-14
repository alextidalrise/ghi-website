#!/usr/bin/env tsx
/**
 * Kyero feed → DRAFT propertyListing documents.
 *
 * Dry-run by DEFAULT: it parses the feed, builds the exact documents, and prints what
 * WOULD be written — no client, no token, no writes. Pass `--write` to actually
 * `createOrReplace` the drafts into a NON-production dataset.
 *
 *   pnpm --filter sanity kyero:import                          # dry-run, default feed URL
 *   pnpm --filter sanity kyero:import -- --file path/to.xml    # dry-run a local fixture
 *   pnpm --filter sanity kyero:import -- --limit 5             # only the first 5
 *   pnpm --filter sanity kyero:import -- --write               # WRITE drafts → development
 *   pnpm --filter sanity kyero:import -- --write --dataset development
 *
 * Not handled here (by design): community resolution (external AI agents), GHI-ID
 * assignment (external pipeline), and media upload (Epic 1.5). Each is left unset and
 * flagged with a blocking review item, so nothing can publish until it is done.
 *
 * Auth for --write: SANITY_API_TOKEN (write), or a logged-in Sanity CLI (`sanity login`).
 * Refuses the production dataset outright.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@sanity/client';
import { parseFeed } from './parse';
import {
	buildDraft,
	buildProvinceConsensus,
	countBlocking,
	DRAFT_ID_PREFIX,
	type DraftListing
} from './build-draft';

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
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
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

async function main() {
	if (dataset === 'production') {
		console.error('Refusing to run against the production dataset.');
		process.exit(1);
	}

	const { source, xml } = await loadXml();
	const { properties } = parseFeed(xml);
	const slice = limit != null ? properties.slice(0, limit) : properties;

	const importedAt = new Date().toISOString();
	// Consensus is built from the WHOLE feed so blank-province rows resolve even under --limit.
	const provinceConsensus = buildProvinceConsensus(properties);
	const docs: DraftListing[] = slice.map((p) =>
		buildDraft(p, {
			importedAt,
			provinceHint: provinceConsensus.get((p.town ?? '').trim().toLowerCase())
		})
	);

	// ---- report ----
	const H = (s: string) => `\n\x1b[1m${s}\x1b[0m`;
	const mode = write ? '\x1b[31mWRITE\x1b[0m' : '\x1b[32mdry-run\x1b[0m';
	console.log(`\x1b[1m\x1b[36mKYERO IMPORT\x1b[0m  (${mode})`);
	console.log(`source        : ${source}`);
	console.log(`target        : ${PROJECT_ID}/${dataset}`);
	console.log(`building       : ${docs.length}${limit != null ? ` (of ${properties.length}, --limit ${limit})` : ''} draft(s)`);

	let totalBlocking = 0;
	let unresolvedType = 0;
	let unresolvedProvince = 0;
	for (const d of docs) {
		totalBlocking += countBlocking(d);
		if (d.propertyType == null) unresolvedType++;
		const internal = d.internal as { feedImport?: { sourceProvince?: string } } | undefined;
		if (!internal?.feedImport?.sourceProvince) unresolvedProvince++;
	}

	console.log(H('WHAT EACH DRAFT CARRIES'));
	console.log(`  status='draft', listingKind='property'; community + ghiListingId left unset`);
	console.log(`  blocking review items (total) : ${totalBlocking}  → every draft is held from publish`);
	console.log(`  unresolved property type      : ${unresolvedType}`);
	console.log(`  unresolved province (no map)  : ${unresolvedProvince}  → needs manual parent location`);

	console.log(H('SAMPLE — first 3 draft documents'));
	for (const d of docs.slice(0, 3)) {
		const specs = d.specs as { bedrooms?: number; bathrooms?: number; buildStatus?: string; pool?: string };
		const pricing = d.pricing as { price?: number; currency?: string };
		const internal = d.internal as { feedImport?: { sourceTown?: string; sourceProvince?: string } };
		console.log(`  \x1b[36m${d._id}\x1b[0m`);
		console.log(`     title   ${d.title as string}`);
		console.log(`     type    ${(d.propertyType as string) ?? '\x1b[33mUNRESOLVED\x1b[0m'} · ${d.transactionType as string}`);
		console.log(`     price   ${pricing.price != null ? `€${pricing.price.toLocaleString('en-GB')}` : '—'} ${pricing.currency}`);
		console.log(`     specs   ${specs.bedrooms ?? '?'} bed · ${specs.bathrooms ?? '?'} bath · pool ${specs.pool} · ${specs.buildStatus}`);
		console.log(`     place   feedImport.sourceTown="${internal.feedImport?.sourceTown ?? ''}" → province ${internal.feedImport?.sourceProvince ?? '\x1b[33m?\x1b[0m'} (community: unset)`);
		console.log(`     review  ${countBlocking(d)} blocking item(s)`);
	}

	if (!write) {
		console.log(H('DRY RUN — nothing written'));
		console.log('  no client created, no token read, no documents written.');
		console.log('  re-run with --write to createOrReplace these drafts into the dataset above.\n');
		return;
	}

	// ---- write ----
	const token =
		process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();
	if (!token) {
		console.error(
			'\x1b[31mMissing write credentials.\x1b[0m Export SANITY_API_TOKEN=… or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}

	const client = createClient({ projectId: PROJECT_ID, dataset, apiVersion: API_VERSION, token, useCdn: false });

	console.log(H(`WRITING ${docs.length} draft(s) → ${PROJECT_ID}/${dataset}`));
	let ok = 0;
	for (const doc of docs) {
		await client.createOrReplace(doc);
		ok++;
		if (ok % 25 === 0 || ok === docs.length) console.log(`  ✓ ${ok}/${docs.length}`);
	}
	console.log(`\nDone. ${ok} draft(s) written with prefix "${DRAFT_ID_PREFIX}".`);
	console.log('Each is held from publish by blocking review items until a human/agent resolves them.\n');
}

main().catch((err) => {
	console.error('\x1b[31mImport failed:\x1b[0m', err instanceof Error ? err.message : err);
	process.exit(1);
});
