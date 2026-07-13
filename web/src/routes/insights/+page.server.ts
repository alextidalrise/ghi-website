import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { fetchPublic, insightsHubQuery } from '$lib/sanity/queries';
import {
	INSIGHTS_PATH,
	buildCategoryFilters,
	buildInsightsBreadcrumbs,
	isInsightCategory
} from '$lib/insights';
import type { InsightCard, InsightCategory } from '$lib/insights';

/** Grid cards shown per page; "Load more" grows the visible count by this step. */
const PAGE_SIZE = 9;

export const load: PageServerLoad = async ({ url }) => {
	const cards = (await fetchPublic<InsightCard[]>(insightsHubQuery)) ?? [];

	const categoryParam = url.searchParams.get('category');
	const activeCategory: InsightCategory | null = isInsightCategory(categoryParam)
		? categoryParam
		: null;

	const filters = buildCategoryFilters(cards);
	const filtered = activeCategory
		? cards.filter((card) => card.insightCategory === activeCategory)
		: cards;

	// The featured lead heads the unfiltered "All" view only; category views are a plain grid.
	const featured = activeCategory ? null : (filtered.find((card) => card.featured) ?? filtered[0] ?? null);
	const rest = featured ? filtered.filter((card) => card._id !== featured._id) : filtered;

	// `limit` governs how many grid cards render; it lives in the URL so "Load more" is a
	// real link that works without JS and upgrades to a client-side navigation with it.
	const limitParam = Number(url.searchParams.get('limit'));
	const requestedLimit = Number.isFinite(limitParam) ? Math.floor(limitParam) : PAGE_SIZE;
	const visibleCount = Math.min(rest.length, Math.max(PAGE_SIZE, requestedLimit));
	const visibleCards = rest.slice(0, visibleCount);
	const hasMore = visibleCount < rest.length;

	const canonicalUrl = `${url.origin}${INSIGHTS_PATH}`;
	const breadcrumbs = buildInsightsBreadcrumbs();
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		activeCategory,
		filters,
		featured,
		cards: visibleCards,
		hasMore,
		nextLimit: visibleCount + PAGE_SIZE,
		totalAll: cards.length,
		filteredTotal: filtered.length,
		canonicalUrl,
		breadcrumbs,
		breadcrumbJsonLd
	};
};
