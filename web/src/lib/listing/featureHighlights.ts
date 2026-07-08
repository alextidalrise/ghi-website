/**
 * Feature-highlight label handling, shared by the property Highlights grid and the
 * "Features" search facet — so the labels shown, the auto-derived filter options, and
 * the values matched in GROQ all normalize identically.
 */

/** Max options surfaced in the (auto-derived) Features filter — keeps the menu usable. */
export const FEATURE_OPTIONS_LIMIT = 40;

export type FeatureOption = { label: string; value: string };

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
 */
export function toFeatureOptions(
	labels: Array<string | null | undefined>,
	limit = FEATURE_OPTIONS_LIMIT
): FeatureOption[] {
	const byKey = new Map<string, { label: string; count: number }>();
	for (const raw of labels) {
		const label = cleanFeatureLabel(raw);
		if (!label) continue;
		const key = featureLabelKey(label);
		const existing = byKey.get(key);
		if (existing) existing.count += 1;
		else byKey.set(key, { label, count: 1 });
	}

	return [...byKey.entries()]
		.sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
		.slice(0, limit)
		.map(([key, entry]) => ({ label: entry.label, value: key }));
}
