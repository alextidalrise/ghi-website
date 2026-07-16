/**
 * Feature-highlight label handling, shared by the property Highlights grid and the
 * "Features" search facet — so the labels shown, the auto-derived filter options, and
 * the values matched in GROQ all normalize identically.
 */

/** Default max options surfaced in the (auto-derived) Features filter — keeps it usable. */
export const FEATURE_OPTIONS_LIMIT = 40;

/** Default minimum listings a feature must appear on to become a filter option. */
export const FEATURE_MIN_COUNT = 2;

export type FeatureOption = { label: string; value: string };

/**
 * Editor-managed controls for the auto-derived Features filter (Sanity `siteSettings`
 * → Features filter). The code carries a baseline of structural rules (generic stopwords,
 * measurement / inventory patterns) that always apply; these settings tune the frequency
 * threshold and cap and let editors block or force-keep specific labels without a deploy.
 */
export type FeatureFilterSettings = {
	/** Extra exact labels (case-insensitive) to always drop, on top of the code baseline. */
	blocklist: string[];
	/** Exact labels (case-insensitive) to always keep, even below `minCount`. */
	allowlist: string[];
	/** Minimum listings a feature must appear on to surface. */
	minCount: number;
	/** Maximum number of options. */
	optionsLimit: number;
};

/** Applied when the CMS singleton carries no Features-filter settings. */
export const DEFAULT_FEATURE_FILTER: FeatureFilterSettings = {
	blocklist: [],
	allowlist: [],
	minCount: FEATURE_MIN_COUNT,
	optionsLimit: FEATURE_OPTIONS_LIMIT
};

/**
 * Clean an editor-authored highlight label: trim, then strip the stray "…, per source
 * text" provenance suffix the enrichment pipeline sometimes leaves behind.
 */
export function cleanFeatureLabel(raw: string | null | undefined): string {
	return (
		raw
			?.trim()
			.replace(/[,\s]+per\s+source(?:\s+text)?\.?$/i, '')
			.trim() ?? ''
	);
}

/** Match/dedupe key for a cleaned label — also the URL param value for the facet. */
export function featureLabelKey(cleaned: string): string {
	return cleaned.toLowerCase();
}

/**
 * Generic, non-feature strings the enrichment pipeline sometimes files under a listing's
 * feature highlights ("Homes", "Amenities", "Price range"…). They're meaningless as a
 * search facet and read as junk in the luxury bar, so they're dropped from the auto-derived
 * Features options. Matched case-insensitively against the whole cleaned label.
 */
const FEATURE_LABEL_STOPWORDS = new Set([
	'home',
	'homes',
	'house',
	'houses',
	'property',
	'properties',
	'location',
	'locations',
	'amenities',
	'amenity',
	'feature',
	'features',
	'highlight',
	'highlights',
	'overview',
	'description',
	'price',
	'price range',
	'prices'
]);

/**
 * A measurement/spec blurb rather than a feature — "154 m² Built Area", "12-hectare private
 * enclave", "Plot of 800 m²". These are per-listing figures, never a shared filterable trait,
 * so they're excluded from the Features options. Real features that merely contain a number
 * ("24 Hour Security", "24/7 Concierge") carry no measurement unit and survive.
 */
const MEASUREMENT_LABEL = /(\bm²|\bm2\b|\bsq\.?\s?m\b|\bhectares?\b|\bbuilt area\b)/i;

/**
 * An inventory / spec count rather than a feature — "62 apartments", "3–5 Bedroom",
 * "120 units". A leading number (or numeric range) immediately followed by an inventory
 * noun. Anchored so genuine features that merely open with a number survive: "24 Hour
 * Security", "24/7 Concierge" (the word after the number isn't an inventory noun).
 */
const INVENTORY_COUNT_LABEL =
	/^\s*\d[\d\s./–—-]*\s*(beds?|bedrooms?|baths?|bathrooms?|apartments?|units?|villas?|homes?|houses?|plots?)\b/i;

/**
 * True when a cleaned label is a real, filterable feature — not generic filler, a
 * measurement, an inventory count, or an editor-blocked label. `blocked` is the CMS
 * blocklist as a set of match keys (see `featureLabelKey`); it stacks on the baseline.
 */
export function isFilterableFeatureLabel(cleaned: string, blocked?: ReadonlySet<string>): boolean {
	if (!cleaned) return false;
	const key = featureLabelKey(cleaned);
	if (FEATURE_LABEL_STOPWORDS.has(key)) return false;
	if (blocked?.has(key)) return false;
	if (MEASUREMENT_LABEL.test(cleaned)) return false;
	if (INVENTORY_COUNT_LABEL.test(cleaned)) return false;
	return true;
}

/** Normalize a list of editor-entered labels into a set of match keys. */
function toKeySet(labels: Iterable<string> | undefined): ReadonlySet<string> {
	const set = new Set<string>();
	for (const raw of labels ?? []) {
		const key = featureLabelKey(cleanFeatureLabel(raw));
		if (key) set.add(key);
	}
	return set;
}

/** Cleaned, deduped highlight labels in editor order — used by the Highlights grid. */
export function cleanFeatureLabels(labels: Array<string | null | undefined>): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of labels) {
		const label = cleanFeatureLabel(raw);
		if (!label) continue;
		const key = featureLabelKey(label);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(label);
	}
	return out;
}

/**
 * Build the Features filter options from raw highlight labels drawn from live listings.
 * Cleans + dedupes by key, orders by frequency (most common first) then alphabetically,
 * and caps to keep the menu manageable. `value` is the match key; `label` is the display.
 *
 * The `minCount` threshold drops labels seen on fewer than N listings. The enrichment
 * pipeline files a long tail of one-off free-text under feature highlights ("92 Fully
 * Furnished Apartments", "Architecture by Nuno Leónidas") that reads as junk in a filter;
 * a real, filterable trait recurs across listings. `blocklist` / `allowlist` are the
 * editor overrides (Sanity): a blocked label never appears, an allowed label always does
 * (bypassing both the baseline rules and `minCount`). Defaults keep every non-junk label
 * (`minCount: 1`); the search facets pass the CMS settings (default `minCount: 2`).
 */
export function toFeatureOptions(
	labels: Array<string | null | undefined>,
	config: Partial<FeatureFilterSettings> = {}
): FeatureOption[] {
	const {
		optionsLimit = FEATURE_OPTIONS_LIMIT,
		minCount = 1,
		blocklist,
		allowlist
	} = config;
	const blocked = toKeySet(blocklist);
	const allowed = toKeySet(allowlist);

	const byKey = new Map<string, { label: string; count: number; pinned: boolean }>();
	for (const raw of labels) {
		const label = cleanFeatureLabel(raw);
		if (!label) continue;
		const key = featureLabelKey(label);
		const pinned = allowed.has(key);
		// An allowlisted label bypasses the baseline rules and the blocklist; everything
		// else must clear them.
		if (!pinned && !isFilterableFeatureLabel(label, blocked)) continue;
		const existing = byKey.get(key);
		if (existing) existing.count += 1;
		else byKey.set(key, { label, count: 1, pinned });
	}

	return [...byKey.entries()]
		.filter(([, entry]) => entry.pinned || entry.count >= minCount)
		.sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
		.slice(0, optionsLimit)
		.map(([key, entry]) => ({ label: entry.label, value: key }));
}
