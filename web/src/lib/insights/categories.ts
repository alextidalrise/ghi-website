import type { InsightCard, InsightCategory } from './types';

/** Display order of categories in the filter bar. New categories slot in here. */
export const INSIGHT_CATEGORY_ORDER: InsightCategory[] = [
	'market',
	'lifestyle',
	'golf',
	'relocation'
];

export type InsightCategoryMeta = {
	/** Full label — Studio dropdown and the filter chip. */
	label: string;
	/** Short label — the article kicker. */
	short: string;
};

export const INSIGHT_CATEGORY_META: Record<InsightCategory, InsightCategoryMeta> = {
	market: { label: 'Market & Investment', short: 'Market' },
	lifestyle: { label: 'Lifestyle', short: 'Lifestyle' },
	golf: { label: 'Golf', short: 'Golf' },
	relocation: { label: 'Relocation', short: 'Relocation' }
};

export function isInsightCategory(value: string | null | undefined): value is InsightCategory {
	return value != null && Object.prototype.hasOwnProperty.call(INSIGHT_CATEGORY_META, value);
}

/** The kicker label for a category value (short form), falling back to the raw value. */
export function insightKickerLabel(value: string | null | undefined): string {
	if (isInsightCategory(value)) return INSIGHT_CATEGORY_META[value].short;
	return value?.trim() || 'Insight';
}

/** The chip / full label for a category value, falling back to the raw value. */
export function insightCategoryLabel(value: string | null | undefined): string {
	if (isInsightCategory(value)) return INSIGHT_CATEGORY_META[value].label;
	return value?.trim() || 'Insight';
}

/** A single entry in the filter bar. `value` is null for the "All" chip. */
export type InsightCategoryFilter = {
	value: InsightCategory | null;
	label: string;
	count: number;
};

/**
 * Build the filter bar from the full card set: an "All" chip plus every category that
 * has at least one article, in display order, each with its count. Empty categories are
 * dropped so the bar never shows a chip that filters to nothing.
 */
export function buildCategoryFilters(cards: InsightCard[]): InsightCategoryFilter[] {
	const counts = new Map<InsightCategory, number>();
	for (const card of cards) {
		if (isInsightCategory(card.insightCategory)) {
			counts.set(card.insightCategory, (counts.get(card.insightCategory) ?? 0) + 1);
		}
	}

	const categoryFilters: InsightCategoryFilter[] = INSIGHT_CATEGORY_ORDER.filter(
		(category) => (counts.get(category) ?? 0) > 0
	).map((category) => ({
		value: category,
		label: INSIGHT_CATEGORY_META[category].label,
		count: counts.get(category) ?? 0
	}));

	return [{ value: null, label: 'All', count: cards.length }, ...categoryFilters];
}
