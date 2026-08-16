/**
 * Kyero property → draft `propertyListing` document.
 *
 * PURE and deterministic: no Sanity client, no network, no clock (the caller passes
 * `importedAt`). Given one parsed feed record it returns the exact document object the
 * writer will `createOrReplace`. That makes the mapping unit-testable and lets the
 * dry-run print precisely what would be written.
 *
 * The document is written with `status: 'draft'` and blocking review items — the repo
 * gates on the `status` field + `validatePublishGate`, not Sanity's native drafts, so a
 * plain id with a stable prefix gives idempotent re-syncs (see review-seed/seed.ts).
 *
 * Two things this importer deliberately does NOT do (kept for humans / external agents):
 *   - resolve `<town>` → community  (external AI agents; we store the raw town + province)
 *   - assign `ghiListingId`         (external GHI-ID pipeline)
 * Both are left unset and flagged with a blocking review item so nothing can publish
 * until they are done.
 */

import { createHash } from 'node:crypto';
import type { KyeroProperty } from './types';
import {
	mapPropertyType,
	mapTransactionType,
	mapPool,
	mapBuildStatus,
	mapProvince,
	positiveIntOrNull,
	positiveNumberOrNull,
	cleanDescription,
	type ProvinceSlug
} from './kyero-map';

/**
 * The feed-owned values a re-sync tracks for change detection. These are the fields the
 * FEED is authoritative for; a snapshot of them is stored on the doc so the next sync can
 * tell what the feed changed (vs what a human edited). See sync.ts and Epic 1.8.
 *
 * Values here MUST match exactly what buildDraft writes to the document, so a field can be
 * compared apples-to-apples against the live doc value (both use the same map functions).
 */
export interface FeedSnapshot {
	price: number | null;
	transactionType: string;
	propertyType: string | null;
	buildStatus: string;
	bedrooms: number | null;
	bathrooms: number | null;
	builtArea: number | null;
	plotSize: number | null;
	pool: string;
	videoUrl: string | null;
	shortDescription: string | null;
	imageUrls: string[];
}

/** Feed-owned values for a listing, transformed exactly as buildDraft stores them. */
export function buildSnapshot(p: KyeroProperty): FeedSnapshot {
	const shortDesc = cleanDescription(p.descEn);
	return {
		price: positiveNumberOrNull(p.price),
		transactionType: mapTransactionType(p.priceFreq),
		propertyType: mapPropertyType(p.type),
		buildStatus: mapBuildStatus(p.newBuild),
		bedrooms: positiveIntOrNull(p.beds),
		bathrooms: positiveIntOrNull(p.baths),
		builtArea: positiveNumberOrNull(p.built),
		plotSize: positiveNumberOrNull(p.plot),
		pool: mapPool(p.pool),
		videoUrl: p.videoUrl || null,
		shortDescription: shortDesc ? shortDesc.slice(0, 240) : null,
		imageUrls: Array.from(new Set(p.imageUrls.filter(Boolean))).sort()
	};
}

/** Stable content hash of a snapshot for the cheap "did the feed change at all?" check. */
export function snapshotFingerprint(s: FeedSnapshot): string {
	const stable = JSON.stringify([
		s.price, s.transactionType, s.propertyType, s.buildStatus, s.bedrooms, s.bathrooms,
		s.builtArea, s.plotSize, s.pool, s.videoUrl, s.shortDescription, s.imageUrls
	]);
	return createHash('sha1').update(stable).digest('hex');
}

/**
 * Build a town → province consensus from the whole feed. Many rows leave `<province>`
 * blank (or "Spain") on a town that is tagged Murcia/Alicante on its *other* rows; this
 * lets a blank row inherit the province its own town resolves to elsewhere, so province
 * stays deterministic without hardcoding. Overrides (mapProvince) still win per row.
 */
export function buildProvinceConsensus(properties: KyeroProperty[]): Map<string, ProvinceSlug> {
	const tally = new Map<string, { murcia: number; alicante: number }>();
	for (const p of properties) {
		const resolved = mapProvince(p.town, p.province);
		const key = (p.town ?? '').trim().toLowerCase();
		if (!resolved || !key) continue;
		const t = tally.get(key) ?? { murcia: 0, alicante: 0 };
		t[resolved] += 1;
		tally.set(key, t);
	}
	const consensus = new Map<string, ProvinceSlug>();
	for (const [key, t] of tally) consensus.set(key, t.alicante > t.murcia ? 'alicante' : 'murcia');
	return consensus;
}

/** Stable id prefix so a re-sync updates in place and a whole import can be queried/removed. */
export const DRAFT_ID_PREFIX = 'kyero-import-';

/** Deterministic document id from the feed reference. */
export function draftId(ref: string): string {
	const safe =
		ref
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'unknown';
	return `${DRAFT_ID_PREFIX}${safe}`;
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

const TYPE_LABELS: Record<string, string> = {
	villa: 'villa',
	apartment: 'apartment',
	penthouse: 'penthouse',
	townhouse: 'townhouse',
	plot: 'plot',
	finca: 'finca',
	development: 'development'
};

interface Span {
	_type: 'span';
	_key: string;
	text: string;
	marks: string[];
}
interface Block {
	_type: 'block';
	_key: string;
	style: 'normal';
	markDefs: never[];
	children: Span[];
}

/** Split cleaned plain text into Portable Text blocks (one per paragraph). */
function toPortableText(text: string): Block[] {
	return text
		.split(/\n{2,}/)
		.map((p) => p.replace(/\n/g, ' ').trim())
		.filter(Boolean)
		.map((paragraph, i) => ({
			_type: 'block' as const,
			_key: `blk-${i}`,
			style: 'normal' as const,
			markDefs: [],
			children: [{ _type: 'span' as const, _key: `spn-${i}`, text: paragraph, marks: [] }]
		}));
}

interface ReviewItem {
	_type: 'reviewItem';
	_key: string;
	label: string;
	detail?: string;
	blocksPublish: boolean;
	category: string;
}

export interface DraftListing {
	_id: string;
	_type: 'propertyListing';
	[key: string]: unknown;
}

export interface BuildDraftOptions {
	/** ISO timestamp stamped onto internal.feedImport.importedAt (caller supplies the clock). */
	importedAt: string;
	/** Fallback province for rows with a blank `<province>`, from the feed-wide consensus. */
	provinceHint?: ProvinceSlug;
}

export function buildDraft(p: KyeroProperty, opts: BuildDraftOptions): DraftListing {
	const ref = p.ref || p.id;
	const propertyType = mapPropertyType(p.type);
	const transactionType = mapTransactionType(p.priceFreq);
	const province = mapProvince(p.town, p.province) ?? opts.provinceHint ?? null;
	const beds = positiveIntOrNull(p.beds);
	const baths = positiveIntOrNull(p.baths);
	const built = positiveNumberOrNull(p.built);
	const plot = positiveNumberOrNull(p.plot);
	const price = positiveNumberOrNull(p.price);
	const shortDesc = cleanDescription(p.descEn);
	const imageCount = p.imageUrls.length;

	const typeLabel = propertyType ? TYPE_LABELS[propertyType] : 'property';
	const provisionalTitle =
		[beds ? `${beds} bed` : null, typeLabel, p.town ? `in ${p.town}` : null]
			.filter(Boolean)
			.join(' ') || `Imported listing ${ref}`;

	// ---- review items (blocking = holds publish via validatePublishGate) ----
	const reviewItems: ReviewItem[] = [];
	const flag = (label: string, category: string, blocksPublish: boolean, detail?: string) =>
		reviewItems.push({
			_type: 'reviewItem',
			_key: `ri-${reviewItems.length}`,
			label,
			detail,
			blocksPublish,
			category
		});

	// Location — the importer never resolves the community; external agents do.
	flag(`Assign community for “${p.town || '(no town)'}”`, 'location', true,
		`Feed town: ${p.town || '—'} · province → ${province ?? 'UNKNOWN — assign the parent location manually'}. ` +
			'Raw town is stored in internal.feedImport; set location.community to resolve.');

	// GHI id — assigned by the external pipeline, not in-repo.
	flag('Assign GHI listing ID', 'internal', true,
		'Left blank on import; the GHI-ID pipeline assigns it before publish.');

	// Third-party feed copy must be reviewed before going live (D-2).
	flag('Review imported copy (title & description)', 'copy', true,
		'Title and description are auto-derived from the partner feed. Rewrite/verify for the website before publishing.');

	if (!propertyType)
		flag(`Map property type (feed value: “${p.type || '∅'}”)`, 'facts', true,
			'The feed type did not match a known property type; set propertyType before publishing.');

	// Media is not ingested in this pass (Epic 1.5).
	flag(`Import media (${imageCount} feed image${imageCount === 1 ? '' : 's'} not yet ingested)`, 'media', true,
		'Gallery images are not uploaded by this pass. Ingest media before publishing.');

	if (!shortDesc)
		flag('No public description in feed', 'copy', true,
			'The feed carried no English description; write one before publishing.');

	// Non-blocking note: this feed omits surface areas across the board.
	if (!built && !plot)
		flag('Verify areas — feed omits built & plot size', 'facts', false,
			'This partner feed carries no surface areas; add them if known.');

	// ---- document ----
	const doc: DraftListing = {
		_id: draftId(ref),
		_type: 'propertyListing',
		status: 'draft',
		listingKind: 'property',
		title: provisionalTitle,
		slug: { _type: 'slug', current: `${slugify(provisionalTitle)}-${slugify(ref)}` },
		transactionType,
		sourceReference: ref || undefined,
		// location.community is left unset — required by schema, so publish is blocked natively
		// until an external agent assigns it. addressDisplay is a provisional human label only.
		location: {
			_type: 'locationFields',
			addressDisplay: p.town || undefined
		},
		pricing: {
			_type: 'propertyPricingFields',
			price: price ?? undefined,
			currency: (p.currency || 'EUR').slice(0, 3)
		},
		specs: {
			_type: 'specsFields',
			buildStatus: mapBuildStatus(p.newBuild),
			bedrooms: beds ?? undefined,
			bathrooms: baths ?? undefined,
			builtArea: built ?? undefined,
			plotSize: plot ?? undefined,
			pool: mapPool(p.pool)
		},
		content: {
			_type: 'propertyContentFields',
			shortDescription: shortDesc ? shortDesc.slice(0, 240) : undefined,
			aboutDescription: shortDesc ? toPortableText(shortDesc) : undefined,
			humanReviewed: false
		},
		media: {
			_type: 'propertyMediaFields',
			videoUrl: p.videoUrl || undefined
		},
		internal: {
			_type: 'internalFields',
			notes: p.notes || undefined,
			feedImport: {
				sourceTown: p.town || undefined,
				sourceProvince: province ?? undefined,
				importedAt: opts.importedAt,
				lastSeenAt: opts.importedAt,
				// Baseline for change detection on the next sync (see sync.ts).
				snapshotJson: JSON.stringify(buildSnapshot(p))
			}
		},
		reviewItems
	};

	// propertyType is required; only set it when resolved (else the blocking item above stands).
	if (propertyType) doc.propertyType = propertyType;

	return doc;
}

/** Count of blocking review items on a built draft (for reporting). */
export function countBlocking(doc: DraftListing): number {
	const items = (doc.reviewItems as ReviewItem[]) ?? [];
	return items.filter((i) => i.blocksPublish).length;
}
