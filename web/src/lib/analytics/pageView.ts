import { push, resetSession } from './dataLayer';
import { trackListingViewed } from './events';
import { pageTypeFor } from './pageType';
import type { AnalyticsItem, ListingKind } from './types';

/**
 * Virtual page views.
 *
 * The GTM Google Tag has `send_page_view: false` and enhanced measurement's
 * history-change tracking is disabled, so this is the *only* source of page views. That
 * is deliberate: overlapping mechanisms are the usual cause of inflated session counts
 * in a SPA.
 */

/** Query parameters that are safe to keep on `page_location`. */
const SAFE_PARAMS = new Set([
	'page',
	'sort',
	'propertyType',
	'minPrice',
	'maxPrice',
	'minBeds',
	'community',
	'golfRelevance',
	'golfCourse',
	'features'
]);

/**
 * Rebuild a URL with only known-safe query parameters.
 *
 * Anything we did not put in the URL ourselves is dropped — an email in a `?ref=` from a
 * campaign, a token, a preview secret. Prohibited data must not reach GA4 even by way of
 * the page address.
 */
export function safePageLocation(url: URL): string {
	const safe = new URL(url.href);
	safe.hash = '';
	for (const key of [...safe.searchParams.keys()]) {
		if (!SAFE_PARAMS.has(key)) safe.searchParams.delete(key);
	}
	return safe.href;
}

export type PageAnalytics = {
	listingKind?: ListingKind;
	item?: AnalyticsItem | null;
};

/** Last page reported, so a redundant navigation cannot double-count. */
let lastKey: string | null = null;

/** Test seam — also used when a full reload makes the previous key meaningless. */
export function resetPageViewState(): void {
	lastKey = null;
}

export function pageViewKey(url: URL): string {
	return `${url.pathname}${url.search}`;
}

/**
 * Emit exactly one page view for a completed navigation.
 *
 * Called from `afterNavigate`, which fires once on initial load and once per subsequent
 * navigation including back/forward — so no separate initial-load call is needed, and
 * adding one would double-count.
 *
 * When the page carries listing analytics, `view_item` rides along here rather than
 * living in a component effect. That keeps detail pages free of analytics code and makes
 * one-per-navigation structurally true rather than something each component must get
 * right independently.
 */
export function trackPageView(params: {
	url: URL;
	routeId: string | null;
	title: string;
	pageAnalytics?: PageAnalytics | null;
}): void {
	const key = pageViewKey(params.url);
	if (key === lastKey) return;
	lastKey = key;

	// New page: impression and lead dedupe state from the previous one no longer applies.
	resetSession();

	push({
		event: 'ghi_virtual_page_view',
		page_location: safePageLocation(params.url),
		page_path: params.url.pathname,
		page_title: params.title,
		page_type: pageTypeFor(params.routeId),
		listing_kind: params.pageAnalytics?.listingKind
	});

	if (params.pageAnalytics?.item) {
		trackListingViewed(params.pageAnalytics.item, params.pageAnalytics.listingKind);
	}
}
