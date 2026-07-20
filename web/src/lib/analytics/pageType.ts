/**
 * `route.id` → `page_type`.
 *
 * An exact-match lookup rather than pattern matching: SvelteKit route ids are literal
 * strings, so a map is exhaustive, trivially testable, and — importantly — fails loudly
 * with `not_found` when someone adds a route and forgets to classify it. Pattern
 * matching would silently mis-bucket new routes into an existing category.
 */

export type PageType =
	| 'home'
	| 'country'
	| 'location'
	| 'community'
	| 'listing'
	| 'unit'
	| 'golf_course'
	| 'collection'
	| 'guide_index'
	| 'guide'
	| 'insight_index'
	| 'insight'
	| 'about'
	| 'contact'
	| 'partners'
	| 'legal'
	| 'holding'
	| 'internal'
	| 'not_found';

/**
 * Every renderable route in the app.
 *
 * `/p/[ghiId]`, `/d/[ghiId]` and `/u/[ghiId]` are absent on purpose — they are
 * server-only redirects that never render, so they can never produce a page view.
 *
 * Note `listing` covers property, development and catch-all detail pages alike. The
 * distinction between them is carried separately as `listing_kind`, sourced from page
 * data, because the route id genuinely cannot tell them apart.
 */
const PAGE_TYPES: Record<string, PageType> = {
	'/': 'home',
	'/about': 'about',
	'/contact': 'contact',
	'/partners': 'partners',
	'/front-line-collection': 'collection',
	'/guides': 'guide_index',
	'/guides/[slug]': 'guide',
	'/insights': 'insight_index',
	'/insights/[slug]': 'insight',
	'/soon': 'holding',
	// Grouped: the three legal pages are one behaviour in reporting, not three.
	'/privacy': 'legal',
	'/terms': 'legal',
	'/cookies': 'legal',
	'/[country]': 'country',
	'/[country]/[location]': 'location',
	'/[country]/[location]/[community]': 'community',
	'/[country]/[location]/[community]/[slug]': 'listing',
	'/[country]/[location]/[community]/[slug]/[unit]': 'unit',
	'/[country]/[location]/[community]/golf/[slug]': 'golf_course',
	// Gated off before any event is emitted; mapped only so it is never 'not_found'.
	'/internal/design-system': 'internal'
};

export function pageTypeFor(routeId: string | null | undefined): PageType {
	if (!routeId) return 'not_found';
	return PAGE_TYPES[routeId] ?? 'not_found';
}

/** Exported for the test that asserts the map stays in step with the route tree. */
export const KNOWN_ROUTE_IDS = Object.keys(PAGE_TYPES);
