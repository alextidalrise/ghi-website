#!/usr/bin/env node
/**
 * Place the approved James Pryor portrait into the GHI brand-introduction Insight as a
 * compact, article-specific `insightPortrait` block.
 *
 * The block is inserted directly BEFORE the paragraph that introduces him ("James Pryor is
 * Managing Director…", `block079` in the "Golf property specialists…" section). Placing it
 * before that paragraph — not after — is what lets the desktop float sit beside the copy it
 * belongs to: the portrait floats to the inline-end and the introduction wraps around it.
 * On tablet and mobile the float is off, so the portrait stacks compactly above the paragraph.
 *
 * Why a new block and not `insightFigure` / `author.avatar`:
 *   - `insightFigure` forces a full-width 16:9 crop — it would crop a square portrait hard and
 *     give a face the weight of a hero plate.
 *   - `author.avatar` is the global byline; using it would change the article's author record
 *     rather than add a personal-service element to this one section.
 * See `insightPortrait` (schema) and `InsightPortrait.svelte` (renderer).
 *
 * The asset is the approved, already-uploaded portrait; alt text is stored exactly as approved.
 * Nothing else in the document is touched — no other copy, imagery, byline or figure styling.
 * The article stays a draft with `seo.noindex: true`; this migration does not publish it.
 *
 * Idempotent: the first run inserts the block; later runs reconcile its content against
 * PORTRAIT_BLOCK and re-assert its position directly before the anchor paragraph, so this file
 * stays the source of truth and a re-run against an already-migrated document reports no change.
 *
 * Usage:
 *   pnpm --filter sanity migrate:james-portrait -- --dataset development
 *   pnpm --filter sanity migrate:james-portrait -- --dataset development --dry-run
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

const SLUG = 'meet-golf-homes-international';

/** The section that introduces GHI's principal, and the paragraph the portrait attaches to. */
const SECTION_KEY = 'section081';
/** "James Pryor is Managing Director…" — the anchor. Pinned by key so an edit elsewhere in the
 *  section never drifts the portrait away from the paragraph it belongs beside. */
const ANCHOR_BLOCK_KEY = 'block079';

/** The approved, already-uploaded portrait. 800×800, square. */
const PORTRAIT_ASSET_REF = 'image-a11d2170e29acdd4f9bbb09de7784cac646869db-800x800-jpg';
const PORTRAIT_ALT = 'Portrait of James Pryor, Golf Homes International.';

const PORTRAIT_BLOCK = {
	_key: 'jamesPryorPortrait',
	_type: 'insightPortrait',
	name: 'James Pryor',
	role: 'Managing Director',
	image: {
		_type: 'mediaAssetMetadata',
		altText: PORTRAIT_ALT,
		asset: {
			_type: 'image',
			asset: { _ref: PORTRAIT_ASSET_REF, _type: 'reference' }
		}
	}
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

type BodyBlock = { _key?: string; _type?: string; [key: string]: unknown };
type Section = { _key?: string; body?: BodyBlock[]; [key: string]: unknown };
type Insight = { _id: string; sections?: Section[] };

/**
 * Serialize with object keys sorted at every depth. Sanity returns a document's fields in its
 * own order, so a plain `JSON.stringify` comparison would report a difference on every run and
 * the reconcile step would never settle.
 */
function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
	if (value && typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([key, nested]) => `${JSON.stringify(key)}:${canonical(nested)}`);
		return `{${entries.join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}

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
		useCdn: false,
		perspective: 'raw'
	});
}

/**
 * Insert or reconcile the portrait block in the target section. Returns null when nothing needs
 * changing, so a re-run is a reported no-op rather than a redundant write.
 */
function migrate(doc: Insight): Partial<Insight> | null {
	const changes: string[] = [];
	const sections = (doc.sections ?? []).map((section) => {
		if (section._key !== SECTION_KEY || !section.body) return section;

		const body = [...section.body];
		const before = changes.length;

		const anchorIndex = body.findIndex((block) => block._key === ANCHOR_BLOCK_KEY);
		if (anchorIndex < 0) {
			throw new Error(
				`Anchor paragraph "${ANCHOR_BLOCK_KEY}" not found in section "${SECTION_KEY}" of ${doc._id}. ` +
					'The article structure changed — re-check the target before running.'
			);
		}

		// Content. Insert on the first run; on later runs reconcile the block against PORTRAIT_BLOCK
		// so this file stays the source of truth for the asset, label and alt text.
		const existingIndex = body.findIndex((block) => block._key === PORTRAIT_BLOCK._key);
		if (existingIndex < 0) {
			body.splice(anchorIndex, 0, PORTRAIT_BLOCK);
			changes.push(`${SECTION_KEY}: inserted insightPortrait before ${ANCHOR_BLOCK_KEY}`);
		} else if (canonical(body[existingIndex]) !== canonical(PORTRAIT_BLOCK)) {
			body[existingIndex] = PORTRAIT_BLOCK;
			changes.push(`${SECTION_KEY}: insightPortrait content reconciled`);
		}

		// Position. Re-assert that the portrait sits directly before the anchor, reading both
		// indexes from the array as it stands. A no-op once already in place, so this settles.
		const currentIndex = body.findIndex((block) => block._key === PORTRAIT_BLOCK._key);
		const targetIndex = body.findIndex((block) => block._key === ANCHOR_BLOCK_KEY);
		if (currentIndex >= 0 && targetIndex >= 0 && currentIndex !== targetIndex - 1) {
			const [block] = body.splice(currentIndex, 1);
			body.splice(body.findIndex((b) => b._key === ANCHOR_BLOCK_KEY), 0, block);
			changes.push(`${SECTION_KEY}: insightPortrait moved directly before ${ANCHOR_BLOCK_KEY}`);
		}

		if (changes.length === before) return section;
		return { ...section, body };
	});

	if (changes.length === 0) return null;
	for (const change of changes) console.log(`    ${change}`);
	return { sections };
}

async function main() {
	console.log(
		`James Pryor portrait → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createClientOrThrow();

	// Both the published document and its draft twin, whichever exist. The article is a draft
	// today; if it is later published the portrait must already be part of that copy too.
	const docs = await client.fetch<Insight[]>(
		`*[_type == "insight" && slug.current == $slug]{ _id, sections }`,
		{ slug: SLUG }
	);

	if (docs.length === 0) {
		throw new Error(`No insight with slug "${SLUG}" in ${dataset}.`);
	}

	let written = 0;
	for (const doc of docs) {
		console.log(`  ${doc._id}`);
		const patch = migrate(doc);
		if (!patch) {
			console.log('    already migrated — no change');
			continue;
		}
		if (!dryRun) {
			await client.patch(doc._id).set(patch).commit();
		}
		written += 1;
	}

	console.log(
		`Done. ${written} document${written === 1 ? '' : 's'} ${dryRun ? 'would be ' : ''}patched.`
	);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
