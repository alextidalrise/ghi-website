#!/usr/bin/env tsx
/**
 * Epic 1.5 — ingest Kyero feed images into the gallery of each imported draft.
 *
 * For every `kyero-import-*` draft this reconciles `media.gallery` against the feed's
 * `<image>` URLs for that listing: it fetches + uploads only the images NOT already
 * present, appends them as `mediaAssetMetadata` members, and — once a draft's gallery
 * covers every feed image — clears the blocking "Import media" review item (leaving a
 * non-blocking "add alt text" note in its place).
 *
 * Idempotent: each gallery member records its source feed URL in `sourceFileName`, so a
 * re-sync skips already-ingested images without re-fetching them. Sanity also dedupes the
 * uploaded asset itself by content hash. Safe to re-run.
 *
 *   pnpm --filter sanity kyero:ingest-media                       # dry-run: report what WOULD be fetched
 *   pnpm --filter sanity kyero:ingest-media -- --limit 5          # only the first 5 drafts
 *   pnpm --filter sanity kyero:ingest-media -- --write            # fetch + upload → development
 *   pnpm --filter sanity kyero:ingest-media -- --write --concurrency 8
 *
 * Reads the dataset in BOTH modes (to compute the per-draft diff), so a token is required
 * either way; dry-run performs no uploads and no writes. Auth: SANITY_API_TOKEN (write),
 * or a logged-in Sanity CLI. Refuses the production dataset outright.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createClient, type SanityClient } from '@sanity/client';
import { parseFeed } from './parse';
import { draftId } from './build-draft';
import type { KyeroProperty } from './types';

const DEFAULT_URL = 'https://www.propertyportalmarketing.com/xml/murciaservices-kyero.xml';
const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const API_VERSION = '2025-05-01';
const IMAGE_FETCH_TIMEOUT_MS = 30_000;

const argv = process.argv.slice(2);
const write = argv.includes('--write');
function arg(flag: string): string | undefined {
	const i = argv.indexOf(flag);
	return i >= 0 ? argv[i + 1] : undefined;
}
const dataset = arg('--dataset') ?? process.env.SANITY_STUDIO_DATASET ?? 'development';
const limit = arg('--limit') ? Math.max(0, parseInt(arg('--limit') as string, 10)) : undefined;
const concurrency = arg('--concurrency') ? Math.max(1, parseInt(arg('--concurrency') as string, 10)) : 6;

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

/** Run `fn` over `items` with at most `n` in flight, preserving input order in the result. */
async function mapPool<T, R>(items: T[], n: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
	const results = new Array<R>(items.length);
	let next = 0;
	async function worker() {
		while (true) {
			const i = next++;
			if (i >= items.length) return;
			results[i] = await fn(items[i], i);
		}
	}
	await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
	return results;
}

/** Stable, collision-free gallery key derived from the source URL (idempotent on re-sync). */
function galleryKey(url: string): string {
	return `img-${createHash('sha1').update(url).digest('hex').slice(0, 16)}`;
}

/** Best-effort filename from a URL path, for the uploaded asset's originalFilename. */
function fileNameFromUrl(url: string): string {
	try {
		const p = new URL(url).pathname;
		const last = p.split('/').filter(Boolean).pop();
		return last && last.length > 0 ? decodeURIComponent(last) : 'image';
	} catch {
		return 'image';
	}
}

interface GalleryMember {
	_type: 'mediaAssetMetadata';
	_key: string;
	asset: { _type: 'image'; asset: { _type: 'reference'; _ref: string } };
	sourceFileName?: string;
	altText?: string;
}
interface ReviewItem {
	_type: 'reviewItem';
	_key: string;
	label: string;
	detail?: string;
	blocksPublish: boolean;
	category: string;
}
interface DraftRow {
	_id: string;
	gallery: GalleryMember[] | null;
	reviewItems: ReviewItem[] | null;
}

/** Fetch an image and upload it to Sanity, returning a gallery member (or null on failure). */
async function ingestImage(client: SanityClient, url: string): Promise<GalleryMember | null> {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) });
		if (!res.ok) {
			console.log(`    \x1b[31m✗\x1b[0m ${res.status} ${res.statusText} — ${url}`);
			return null;
		}
		const buf = Buffer.from(await res.arrayBuffer());
		const asset = await client.assets.upload('image', buf, {
			filename: fileNameFromUrl(url),
			source: { name: 'kyero', id: url, url }
		});
		return {
			_type: 'mediaAssetMetadata',
			_key: galleryKey(url),
			asset: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
			sourceFileName: url
		};
	} catch (err) {
		console.log(`    \x1b[31m✗\x1b[0m ${err instanceof Error ? err.message : err} — ${url}`);
		return null;
	}
}

/**
 * Reconcile a draft's review items after ingest: drop the blocking "Import media" item once
 * the gallery is complete, and add a single non-blocking "add alt text" note. Pure.
 */
function reconcileReviewItems(items: ReviewItem[], complete: boolean, imageCount: number): ReviewItem[] {
	if (!complete) return items;
	let next = items.filter(
		(it) => !(it.category === 'media' && it.blocksPublish && it.label.startsWith('Import media'))
	);
	const hasAltNote = next.some((it) => it.category === 'media' && it.label.startsWith('Add alt text'));
	if (imageCount > 0 && !hasAltNote) {
		next = [
			...next,
			{
				_type: 'reviewItem',
				_key: `ri-alt-${galleryKey('alt').slice(4, 12)}`,
				label: `Add alt text to ${imageCount} gallery image${imageCount === 1 ? '' : 's'}`,
				detail:
					'Images were imported from the partner feed without alt text. Add descriptive alt text before publishing (accessibility + SEO).',
				blocksPublish: false,
				category: 'media'
			}
		];
	}
	return next;
}

async function main() {
	if (dataset === 'production') {
		console.error('Refusing to run against the production dataset.');
		process.exit(1);
	}

	const token =
		process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();
	if (!token) {
		console.error(
			'\x1b[31mMissing credentials.\x1b[0m This script reads the dataset in both modes. Export SANITY_API_TOKEN=… or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}
	const client = createClient({ projectId: PROJECT_ID, dataset, apiVersion: API_VERSION, token, useCdn: false });

	const { source, xml } = await loadXml();
	const { properties } = parseFeed(xml);

	// Map draft id → feed image URLs (deduped, order preserved).
	const feedByDraftId = new Map<string, { ref: string; imageUrls: string[] }>();
	for (const p of properties as KyeroProperty[]) {
		const ref = p.ref || p.id;
		const urls = Array.from(new Set(p.imageUrls.filter(Boolean)));
		feedByDraftId.set(draftId(ref), { ref, imageUrls: urls });
	}

	// Load the drafts we actually wrote, with their current galleries + review items.
	const rows = await client.fetch<DraftRow[]>(
		`*[_type=="propertyListing" && _id match "kyero-import-*"]{
			_id,
			"gallery": media.gallery[]{_type,_key,asset,sourceFileName,altText},
			reviewItems
		} | order(_id)`
	);
	const slice = limit != null ? rows.slice(0, limit) : rows;

	const H = (s: string) => `\n\x1b[1m${s}\x1b[0m`;
	const mode = write ? '\x1b[31mWRITE\x1b[0m' : '\x1b[32mdry-run\x1b[0m';
	console.log(`\x1b[1m\x1b[36mKYERO MEDIA INGEST\x1b[0m  (${mode})`);
	console.log(`source        : ${source}`);
	console.log(`target        : ${PROJECT_ID}/${dataset}`);
	console.log(`drafts        : ${slice.length}${limit != null ? ` (of ${rows.length}, --limit ${limit})` : ''}`);
	console.log(`concurrency   : ${concurrency}`);

	// Per-draft plan: which feed URLs are missing from the gallery.
	type Plan = { row: DraftRow; ref: string; missing: string[]; feedCount: number; already: number };
	const plans: Plan[] = [];
	let noFeedMatch = 0;
	for (const row of slice) {
		const feed = feedByDraftId.get(row._id);
		if (!feed) {
			noFeedMatch++;
			continue;
		}
		const have = new Set((row.gallery ?? []).map((m) => m.sourceFileName).filter(Boolean) as string[]);
		const missing = feed.imageUrls.filter((u) => !have.has(u));
		plans.push({ row, ref: feed.ref, missing, feedCount: feed.imageUrls.length, already: have.size });
	}

	const totalMissing = plans.reduce((n, p) => n + p.missing.length, 0);
	const draftsNeeding = plans.filter((p) => p.missing.length > 0).length;
	const draftsComplete = plans.filter((p) => p.missing.length === 0 && p.feedCount > 0).length;
	const draftsNoImages = plans.filter((p) => p.feedCount === 0).length;

	console.log(H('PLAN'));
	console.log(`  drafts already complete       : ${draftsComplete}`);
	console.log(`  drafts with images to fetch   : ${draftsNeeding}`);
	console.log(`  drafts with 0 feed images     : ${draftsNoImages}  (media blocker left standing)`);
	if (noFeedMatch) console.log(`  drafts with no feed match     : ${noFeedMatch}  (skipped)`);
	console.log(`  images to fetch + upload      : \x1b[1m${totalMissing}\x1b[0m`);

	if (!write) {
		console.log(H('DRY RUN — nothing fetched or written'));
		for (const p of plans.filter((p) => p.missing.length > 0).slice(0, 5)) {
			console.log(`  ${p.row._id}: ${p.already} present + ${p.missing.length} to fetch (${p.feedCount} in feed)`);
		}
		if (draftsNeeding > 5) console.log(`  … and ${draftsNeeding - 5} more draft(s)`);
		console.log('\n  re-run with --write to fetch, upload and attach these images.\n');
		return;
	}

	// ---- write ----
	console.log(H(`INGESTING → ${PROJECT_ID}/${dataset}`));
	let uploaded = 0;
	let failed = 0;
	let blockersCleared = 0;
	let done = 0;
	for (const p of plans) {
		done++;
		if (p.missing.length === 0) continue;
		const members = (await mapPool(p.missing, concurrency, (url) => ingestImage(client, url))).filter(
			Boolean
		) as GalleryMember[];
		uploaded += members.length;
		const draftFailed = p.missing.length - members.length;
		failed += draftFailed;

		// A draft is complete when its gallery now covers every feed image (no failures this run).
		const complete = draftFailed === 0;
		const patch = client.patch(p.row._id).setIfMissing({ 'media.gallery': [] }).append('media.gallery', members);
		if (complete) {
			const nextReview = reconcileReviewItems(p.row.reviewItems ?? [], true, p.feedCount);
			patch.set({ reviewItems: nextReview });
			if ((p.row.reviewItems ?? []).some((it) => it.category === 'media' && it.blocksPublish))
				blockersCleared++;
		}
		await patch.commit({ autoGenerateArrayKeys: false });
		console.log(
			`  ${complete ? '\x1b[32m✓\x1b[0m' : '\x1b[33m~\x1b[0m'} ${p.row._id}  +${members.length} img${draftFailed ? ` (\x1b[31m${draftFailed} failed\x1b[0m)` : ''}  [${done}/${plans.length}]`
		);
	}

	console.log(H('DONE'));
	console.log(`  images uploaded      : ${uploaded}`);
	console.log(`  images failed        : ${failed}`);
	console.log(`  media blockers cleared : ${blockersCleared}`);
	if (failed > 0)
		console.log('  \x1b[33mDrafts with any failed image keep their media blocker; re-run to retry just the misses.\x1b[0m');
	console.log('');
}

main().catch((err) => {
	console.error('\x1b[31mMedia ingest failed:\x1b[0m', err instanceof Error ? err.message : err);
	process.exit(1);
});
