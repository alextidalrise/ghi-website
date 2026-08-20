/**
 * Kyero V3 → GHI Sanity field & vocabulary map.
 *
 * This is the STATIC half of the pipeline (see docs/kyero-feed-ingestion-plan.md):
 * field mapping + closed-set vocabulary lookups, set once in code. The RECURRING,
 * human half — resolving a `<town>` to a community — is deliberately NOT here; it
 * lives in Sanity via community aliases + the reconciliation queue.
 *
 * Anything a lookup can't resolve returns `null` so the caller can route it to the
 * reconciliation queue / a blocking review item, rather than guessing a wrong value.
 */

import type { PropertyType, TransactionType, PoolType, AreaUnit, PropertyBuildStatus } from './types';

/** Kyero `<type>` (free-ish string) → our `propertyType` enum. Lower-cased, trimmed key. */
const TYPE_MAP: Record<string, PropertyType> = {
	villa: 'villa',
	'detached villa': 'villa',
	'semi-detached villa': 'villa',
	apartment: 'apartment',
	'ground floor apartment': 'apartment',
	'middle floor apartment': 'apartment',
	'top floor apartment': 'apartment',
	penthouse: 'penthouse',
	townhouse: 'townhouse',
	'town house': 'townhouse',
	'terraced house': 'townhouse',
	quad: 'townhouse',
	bungalow: 'townhouse',
	plot: 'plot',
	land: 'plot',
	'building plot': 'plot',
	'land - building plot': 'plot',
	'house/villa': 'villa',
	finca: 'finca',
	'country house': 'finca',
	cortijo: 'finca',
	farmhouse: 'finca'
};

/** Kyero `<price_freq>` → our `transactionType`. */
const TRANSACTION_MAP: Record<string, TransactionType> = {
	sale: 'sale',
	rent: 'rent',
	long_term: 'rent',
	monthly: 'rent',
	month: 'rent', // this feed uses price_freq=month for its rentals
	short_term: 'short_term',
	weekly: 'short_term',
	week: 'short_term'
};

/**
 * Resolve a Kyero property type. Returns null for empty or unrecognised values so
 * the importer can flag "map this type" rather than mislabel the listing.
 */
export function mapPropertyType(raw: string | undefined | null): PropertyType | null {
	const key = (raw ?? '').trim().toLowerCase();
	if (!key) return null;
	return TYPE_MAP[key] ?? null;
}

export function mapTransactionType(raw: string | undefined | null): TransactionType {
	const key = (raw ?? '').trim().toLowerCase();
	return TRANSACTION_MAP[key] ?? 'sale';
}

/**
 * Kyero `<pool>` in this feed is empty across the board; when present it is a 0/1 flag
 * or a word. We can only positively assert a private pool from a truthy value — we
 * cannot distinguish communal from private, and absence is genuinely unknown (not "none").
 */
export function mapPool(raw: string | undefined | null): PoolType {
	const key = (raw ?? '').trim().toLowerCase();
	if (!key) return 'unknown';
	if (key === '1' || key === 'yes' || key === 'true' || key === 'private') return 'private';
	if (key === 'communal' || key === 'shared') return 'communal';
	if (key === '0' || key === 'no' || key === 'false' || key === 'none') return 'none';
	return 'unknown';
}

/** Kyero `<new_build>` (0/1) → our `specs.buildStatus`. */
export function mapBuildStatus(newBuild: string | undefined | null): PropertyBuildStatus {
	return (newBuild ?? '').trim() === '1' ? 'off_plan' : 'built';
}

/** The two location-tier slugs this feed's provinces map to (D-3). */
export type ProvinceSlug = 'murcia' | 'alicante';

/**
 * Feed rows whose `<province>` is ambiguous or blank, pinned by the team (2026-08-14).
 * Keyed by lower-cased `<town>`. Both resolve to Alicante. See D-3 in the plan.
 */
const PROVINCE_TOWN_OVERRIDES: Record<string, ProvinceSlug> = {
	'pilar de la horadada': 'alicante',
	'pilar de horadada': 'alicante',
	'la finca golf': 'alicante'
};

/**
 * `<province>` → our location-tier slug. Deterministic (the importer's whole job on
 * location); the town → community step is left to the external agents. Returns null
 * when neither an override nor the province string resolves — the caller blocks and a
 * human assigns the parent location.
 */
export function mapProvince(
	town: string | undefined | null,
	province: string | undefined | null
): ProvinceSlug | null {
	const t = (town ?? '').trim().toLowerCase();
	if (t in PROVINCE_TOWN_OVERRIDES) return PROVINCE_TOWN_OVERRIDES[t];

	const p = (province ?? '').trim().toLowerCase();
	if (p.includes('alicante')) return 'alicante';
	// Cartagena is a municipality within Murcia province; the feed uses it as a province value.
	if (p.includes('murcia') || p.includes('cartagena')) return 'murcia';
	return null;
}

/** Kyero areas are square metres. */
export const DEFAULT_AREA_UNIT: AreaUnit = 'sqm';

/** A non-negative integer, or null if absent/zero (a feed 0 is "not stated", not "zero rooms"). */
export function positiveIntOrNull(raw: string | number | undefined | null): number | null {
	const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? '').trim(), 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

/** A positive number (areas, price), or null. */
export function positiveNumberOrNull(raw: string | number | undefined | null): number | null {
	const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').trim());
	return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Strip the HTML/entity noise Kyero descriptions carry (`&#13;`, stray tags) into clean
 * plain text. Portable-Text conversion happens later in the real importer; for the dry run
 * we only need a faithful character count and preview.
 */
export function cleanDescription(raw: string | undefined | null): string {
	return (raw ?? '')
		// This feed leaves numeric character references encoded in the copy (&#13; &#10;).
		.replace(/&#1[03];/g, '\n')
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\r/g, '\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/ /g, ' ')
		.replace(/[ \t]{2,}/g, ' ')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}
