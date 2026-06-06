#!/usr/bin/env tsx
/**
 * Seed hero images onto every golfCourse document in the Sanity `development`
 * dataset so the location-page golf carousel (and golf course pages) render with
 * real imagery in local dev. Golf courses were seeded without `media`, and the
 * public card transform drops any course that has no image, so the carousel was
 * coming up empty even though the query returned all the courses.
 *
 * What it does:
 *   1. Uploads a small pool of real golf-course photos (Unsplash) as image
 *      assets, each labelled `golf-course-seed` so re-runs reuse them.
 *   2. Sets `media` (one hero image) on every golfCourse draft that lacks one,
 *      cycling the pool so neighbouring courses differ.
 *   3. Backfills plausible `holes` / `par` / `designStyle` (only where missing)
 *      so the card spec line ("18 holes · Par 72 · Parkland") has content in dev.
 *
 * Idempotent: existing labelled assets are reused, and courses that already have
 * media are left untouched. Reversible with --delete.
 *
 * Usage (from sanity/):
 *   pnpm golfimages:seed              # upload pool + attach images
 *   pnpm golfimages:seed -- --dry-run # print plan, write nothing
 *   pnpm golfimages:delete            # strip seeded media + delete the pool
 *
 * Auth: SANITY_API_TOKEN (write), or a logged-in Sanity CLI (`sanity login`).
 */
import { createClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const DATASET = process.env.SANITY_STUDIO_DATASET ?? 'development';
const API_VERSION = '2025-05-01';

const dryRun = process.argv.includes('--dry-run');
const deleteMode = process.argv.includes('--delete');

/** Marker on uploaded assets so this script can find + reuse + remove them. */
const ASSET_LABEL = 'golf-course-seed';

/**
 * Real golf-course photography (Unsplash). IDs were extracted from Unsplash
 * search results and verified to resolve before being committed here. Downloaded
 * at a 4:5-friendly size to match the card crop.
 */
const UNSPLASH_IDS = [
	'photo-1535131749006-b7f58c99034b',
	'photo-1587174486073-ae5e5cff23aa',
	'photo-1591491640784-3232eb748d4b',
	'photo-1592919505780-303950717480',
	'photo-1593111774240-d529f12cf4bb',
	'photo-1601095240111-5a3bf4d2bd3c',
	'photo-1605144884374-ecbb643615f6',
	'photo-1611374243147-44a702c2d44c',
	'photo-1623113807896-3b3a7fc2aec0',
	'photo-1626512296443-2dbcaa240c49',
	'photo-1538648759472-7251f7cb2c2f',
	'photo-1544772324-f4d09246d48b',
	'photo-1562204320-31975a5e09ce',
	'photo-1500932334442-8761ee4810a7',
	'photo-1532508583690-538a1436f423',
	'photo-1591491680738-eae9159fced6',
	'photo-1592937238247-cd0090e02f65',
	'photo-1603637539051-02da4b1e4656'
];

const imageUrl = (id: string) =>
	`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=1500&q=80`;

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

const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

if (!TOKEN) {
	console.error('No write token. Set SANITY_API_TOKEN or run `sanity login`.');
	process.exit(1);
}

const client = createClient({
	projectId: PROJECT_ID,
	dataset: DATASET,
	apiVersion: API_VERSION,
	token: TOKEN,
	useCdn: false,
	// Patch the draft documents — dev preview reads the `drafts` perspective.
	perspective: 'raw'
});

type GolfCourse = { _id: string; name: string; mediaCount: number };

/** Prefer the draft id for each course; that's what local dev preview renders. */
function pickWriteId(rawIds: string[]): string[] {
	const byBase = new Map<string, { draft?: string; published?: string }>();
	for (const id of rawIds) {
		const isDraft = id.startsWith('drafts.');
		const base = isDraft ? id.slice('drafts.'.length) : id;
		const entry = byBase.get(base) ?? {};
		if (isDraft) entry.draft = id;
		else entry.published = id;
		byBase.set(base, entry);
	}
	return [...byBase.values()].map((e) => e.draft ?? e.published!).filter(Boolean);
}

async function resolveExistingPool(): Promise<string[]> {
	const ids: string[] = await client.fetch(
		`*[_type=="sanity.imageAsset" && label==$label]._id | order(_createdAt asc)`,
		{ label: ASSET_LABEL }
	);
	return ids;
}

async function uploadOne(unsplashId: string): Promise<string | null> {
	const url = imageUrl(unsplashId);
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const res = await fetch(url);
			if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) {
				console.warn(`  · skip ${unsplashId} (HTTP ${res.status})`);
				return null;
			}
			const buf = Buffer.from(await res.arrayBuffer());
			const asset = await client.assets.upload('image', buf, {
				label: ASSET_LABEL,
				filename: `${unsplashId}.jpg`,
				source: { name: 'unsplash', id: unsplashId, url }
			});
			console.log(`  ✓ uploaded ${asset._id}`);
			return asset._id;
		} catch (err) {
			console.warn(`  · ${unsplashId} attempt ${attempt}/3 failed: ${(err as Error).message}`);
			await new Promise((r) => setTimeout(r, 1500 * attempt));
		}
	}
	return null;
}

async function uploadPool(existing: string[]): Promise<string[]> {
	const pool = [...existing];
	for (let i = existing.length; i < UNSPLASH_IDS.length; i++) {
		const id = await uploadOne(UNSPLASH_IDS[i]);
		if (id) pool.push(id);
	}
	return pool;
}

/** Plausible, varied specs so the card spec line reads like real content in dev. */
const DESIGN_STYLES = [
	'Parkland',
	'Links',
	'Mediterranean parkland',
	'Championship parkland',
	'Heathland',
	'Cliff-top links'
];
const PARS = [70, 71, 72, 72, 73];
function buildSpecs(index: number) {
	// Mostly 18-hole championship courses, with the occasional 27- or 9-hole layout.
	const holes = index % 11 === 4 ? 27 : index % 13 === 7 ? 9 : 18;
	return {
		holes,
		par: holes === 9 ? 34 : PARS[index % PARS.length],
		designStyle: DESIGN_STYLES[index % DESIGN_STYLES.length]
	};
}

function buildMedia(assetId: string, name: string) {
	return [
		{
			_type: 'mediaAssetMetadata',
			_key: 'seedHero',
			asset: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
			assetCategory: 'hero',
			order: 0,
			altText: `${name} golf course`
		}
	];
}

async function seed() {
	const raw: string[] = await client.fetch(`*[_type=="golfCourse"]._id`);
	const writeIds = pickWriteId(raw);
	const courses: GolfCourse[] = await client.fetch(
		`*[_id in $ids]{ _id, name, "mediaCount": count(media) }`,
		{ ids: writeIds }
	);

	const needing = courses.filter((c) => !c.mediaCount);
	console.log(
		`Golf courses: ${courses.length} total, ${needing.length} need images, ${
			courses.length - needing.length
		} already have media. Specs backfilled where missing.`
	);

	const existing = await resolveExistingPool();
	console.log(`Image pool: ${existing.length} existing labelled assets.`);
	const pool = dryRun ? existing : await uploadPool(existing);
	if (!dryRun && pool.length === 0) {
		console.error('No image assets available to attach. Aborting.');
		process.exit(1);
	}

	let tx = client.transaction();
	courses.forEach((course, i) => {
		const specs = buildSpecs(i);
		// setIfMissing keeps real content intact and makes re-runs a no-op.
		const fields: Record<string, unknown> = { ...specs };
		if (!course.mediaCount && pool.length) {
			fields.media = buildMedia(pool[i % pool.length], course.name);
		}
		tx = tx.patch(course._id, (p) => p.setIfMissing(fields));
	});

	if (dryRun) {
		console.log(`\nDry run: would set images (${needing.length}) + specs. No writes made.`);
		return;
	}
	await tx.commit();
	console.log(`\nDone. Images on ${needing.length} courses; specs backfilled across ${courses.length}.`);
}

async function remove() {
	const poolIds = await resolveExistingPool();
	console.log(`Found ${poolIds.length} labelled seed assets.`);

	// Strip media from any golf course pointing at a seeded asset.
	const raw: string[] = await client.fetch(
		`*[_type=="golfCourse" && media[0].asset.asset._ref in $ids]._id`,
		{ ids: poolIds }
	);
	if (dryRun) {
		console.log(`Dry run: would unset media on ${raw.length} courses and delete ${poolIds.length} assets.`);
		return;
	}
	let tx = client.transaction();
	for (const id of raw) tx = tx.patch(id, (p) => p.unset(['media', 'holes', 'par', 'designStyle']));
	if (raw.length) await tx.commit();
	console.log(`Unset seeded media + specs on ${raw.length} courses.`);

	for (const id of poolIds) {
		try {
			await client.delete(id);
			console.log(`  ✓ deleted asset ${id}`);
		} catch {
			console.log(`  · asset ${id} still referenced, left in place`);
		}
	}
}

(deleteMode ? remove() : seed()).catch((err) => {
	console.error(err.message);
	process.exit(1);
});
