import type { InsightCategory } from './types';

/** Section root for Insights. The nav points here. */
export const INSIGHTS_PATH = '/insights';

/** Canonical path for a single article. Category lives in data, not the URL. */
export function insightPath(slug: string): string {
	return `${INSIGHTS_PATH}/${slug}`;
}

/**
 * Index URL for a category filter and/or a grid page size. Both live in the query
 * string so the filter chips and "Load more" are real links: they work with no JS
 * (a full navigation re-runs the server load) and SvelteKit upgrades them to a
 * client-side navigation when JS is on.
 */
export function insightsIndexHref(
	params: { category?: InsightCategory | null; limit?: number | null } = {}
): string {
	const search = new URLSearchParams();
	if (params.category) search.set('category', params.category);
	if (params.limit && params.limit > 0) search.set('limit', String(params.limit));
	const qs = search.toString();
	return qs ? `${INSIGHTS_PATH}?${qs}` : INSIGHTS_PATH;
}
