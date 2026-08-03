#!/usr/bin/env node
/**
 * Fold the two "Current destinations in Spain and Portugal" figures into a single
 * `insightFigurePair` block, so the article renders them as an equal, side-by-side pair on
 * desktop (stacked on mobile) instead of two full-width stacked figures.
 *
 * The section currently authors the comparison as four separate blocks, in this order:
 *   1. insightFigure  destinationSpainLasVillasSotogrande   (Las Villas Sotogrande)
 *   2. block          block072                              ("View Las Villas … on GHI." link)
 *   3. insightFigure  destinationPortugalNaturaVillage      (Natura Village)
 *   4. block          block076                              ("View Natura Village … on GHI." link)
 *
 * They collapse into ONE `insightFigurePair` at the position of the first figure; the other
 * three blocks are removed. Each column keeps its own image, alt text, caption and property
 * link — the "View … on Golf Homes International" text and href move verbatim into the column's
 * linkLabel / linkHref, so no copy or property fact changes; the two links are simply relocated
 * from trailing paragraphs into their own figures. See `insightFigurePair` (schema) and
 * `InsightFigurePair.svelte` (renderer).
 *
 * Why an explicit module, not adjacency: pairing arbitrary neighbouring `insightFigure` blocks
 * globally would surprise every other article. The pair is a deliberate, content-specific unit.
 *
 * Nothing else in the document is touched — no other copy, imagery, byline or figure. The
 * article stays a draft with `seo.noindex: true`; this migration does not publish it.
 *
 * Idempotent: the first run inserts the pair and removes the four source blocks; later runs
 * reconcile the pair's content against PAIR_BLOCK and re-assert it sits where the first figure
 * was, so this file stays the source of truth and a re-run reports no change.
 *
 * Usage:
 *   pnpm --filter sanity migrate:destinations-pair -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:destinations-pair -- --dataset development
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

/** The "Current destinations in Spain and Portugal" section. */
const SECTION_KEY = 'section066';

/** The four source blocks, in document order. The pair lands where SPAIN_FIGURE_KEY was; the
 *  other three are removed. Pinned by key so an unrelated edit in the section can't misidentify
 *  them. */
const SPAIN_FIGURE_KEY = 'destinationSpainLasVillasSotogrande';
const SPAIN_LINK_KEY = 'block072';
const PORTUGAL_FIGURE_KEY = 'destinationPortugalNaturaVillage';
const PORTUGAL_LINK_KEY = 'block076';
const SOURCE_KEYS = [SPAIN_FIGURE_KEY, SPAIN_LINK_KEY, PORTUGAL_FIGURE_KEY, PORTUGAL_LINK_KEY];

/**
 * The pair, built from the two approved figures. Images, alt text and captions are the existing
 * ones verbatim; each linkLabel/linkHref is the existing "View …" paragraph's link, relocated.
 */
const PAIR_BLOCK = {
	_key: 'destinationsFigurePair',
	_type: 'insightFigurePair',
	items: [
		{
			_key: 'pairSpainLasVillasSotogrande',
			caption:
				'Las Villas Sotogrande in Sotogrande. From €1,034,000 to €2,200,000. Estimated completion: May 2028.',
			linkLabel: 'View Las Villas Sotogrande on Golf Homes International',
			linkHref:
				'https://www.golfhomesinternational.com/spain/sotogrande/la-reserva/las-villas-sotogrande',
			image: {
				_type: 'mediaAssetMetadata',
				altText: 'Las Villas Sotogrande residence with a private pool and landscaped garden.',
				asset: {
					_type: 'image',
					asset: {
						_ref: 'image-a6f1abe0cba3f08dc3b814d29a961f4f2332b1f6-4000x4000-jpg',
						_type: 'reference'
					}
				}
			}
		},
		{
			_key: 'pairPortugalNaturaVillage',
			caption: 'Natura Village in Vilamoura. From €790,000 to €1,320,000.',
			linkLabel: 'View Natura Village on Golf Homes International',
			linkHref: 'https://www.golfhomesinternational.com/portugal/vilamoura/natura-village-vilamoura',
			image: {
				_type: 'mediaAssetMetadata',
				altText: 'Natura Village residence with a private pool in Vilamoura.',
				asset: {
					_type: 'image',
					asset: {
						_ref: 'image-7b0a06d615a55540b71594c47c0d1896f177419e-3000x1688-jpg',
						_type: 'reference'
					}
				}
			}
		}
	]
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
 * Serialize with object keys sorted at every depth, so a reconcile comparison isn't defeated by
 * Sanity returning fields in its own order.
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
 * Insert or reconcile the pair block and remove the source blocks in the target section. Returns
 * null when nothing needs changing, so a re-run is a reported no-op rather than a redundant write.
 */
function migrate(doc: Insight): Partial<Insight> | null {
	const changes: string[] = [];
	const sections = (doc.sections ?? []).map((section) => {
		if (section._key !== SECTION_KEY || !section.body) return section;

		let body = [...section.body];
		const before = changes.length;
		const hasPair = body.some((block) => block._key === PAIR_BLOCK._key);

		if (!hasPair) {
			// First run: the four source blocks must all be present, in the expected order, or the
			// article changed under us and we should stop rather than guess.
			const spainIndex = body.findIndex((block) => block._key === SPAIN_FIGURE_KEY);
			const missing = SOURCE_KEYS.filter((key) => !body.some((block) => block._key === key));
			if (spainIndex < 0 || missing.length > 0) {
				throw new Error(
					`Expected source blocks [${SOURCE_KEYS.join(', ')}] in section "${SECTION_KEY}" of ` +
						`${doc._id}; missing [${missing.join(', ') || 'none'}]. The article structure changed ` +
						'— re-check the target before running.'
				);
			}
			// Replace the first figure with the pair, then drop the other three source blocks.
			body[spainIndex] = PAIR_BLOCK;
			body = body.filter(
				(block) => block._key === PAIR_BLOCK._key || !SOURCE_KEYS.includes(block._key ?? '')
			);
			changes.push(
				`${SECTION_KEY}: folded [${SOURCE_KEYS.join(', ')}] into insightFigurePair "${PAIR_BLOCK._key}"`
			);
		} else {
			// Later runs: reconcile content, and sweep any source block that somehow survived.
			const pairIndex = body.findIndex((block) => block._key === PAIR_BLOCK._key);
			if (canonical(body[pairIndex]) !== canonical(PAIR_BLOCK)) {
				body[pairIndex] = PAIR_BLOCK;
				changes.push(`${SECTION_KEY}: insightFigurePair content reconciled`);
			}
			const strays = body.filter((block) => SOURCE_KEYS.includes(block._key ?? ''));
			if (strays.length > 0) {
				body = body.filter((block) => !SOURCE_KEYS.includes(block._key ?? ''));
				changes.push(
					`${SECTION_KEY}: removed stray source block(s) [${strays.map((b) => b._key).join(', ')}]`
				);
			}
		}

		if (changes.length === before) return section;
		return { ...section, body };
	});

	if (changes.length === 0) return null;
	for (const change of changes) console.log(`    ${change}`);
	return { sections };
}

async function main() {
	console.log(`Destinations figure pair → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	const client = createClientOrThrow();

	// Both the published document and its draft twin, whichever exist. The article is a draft
	// today; if it is later published the pair must already be part of that copy too.
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
