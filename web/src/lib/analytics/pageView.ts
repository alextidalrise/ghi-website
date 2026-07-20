import { push } from './dataLayer';
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

/**
 * Query parameters that may survive onto `page_location`, and what each value must look
 * like to be kept.
 *
 * Validating the *name* is not enough. Anyone can craft a link with
 * `?community=someone@example.com`, and a visitor who follows it would hand that address
 * to GA4 through the page URL. Every one of these parameters is written by our own filter
 * UI from a closed vocabulary, so the values are legitimately constrained: numbers where
 * we emit numbers, slugs where we emit slugs. Anything that does not fit was not put
 * there by us and is dropped.
 */
const NUMERIC = /^\d{1,12}$/;
/** Matches the slugs the taxonomy and filter options emit — no spaces, no punctuation. */
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
/** Repeatable filters arrive as comma-joined slugs. */
const SLUG_LIST = /^[a-z0-9][a-z0-9-]{0,63}(,[a-z0-9][a-z0-9-]{0,63}){0,19}$/;

const SAFE_PARAMS: Record<string, RegExp> = {
	page: NUMERIC,
	minPrice: NUMERIC,
	maxPrice: NUMERIC,
	minBeds: NUMERIC,
	sort: SLUG,
	propertyType: SLUG,
	community: SLUG,
	golfRelevance: SLUG_LIST,
	golfCourse: SLUG_LIST,
	features: SLUG_LIST
};

/**
 * Rebuild a URL with only known-safe query parameters, keeping each only if its value
 * matches the shape we would have written.
 *
 * Drops the fragment too: it never carries anything we measure, and it is another place
 * arbitrary text can ride along.
 */
export function safePageLocation(url: URL): string {
	const safe = new URL(url.href);
	safe.hash = '';

	for (const key of [...safe.searchParams.keys()]) {
		const pattern = SAFE_PARAMS[key];
		if (!pattern) {
			safe.searchParams.delete(key);
			continue;
		}
		// A repeated key returns its first value here; drop the whole key unless every
		// value passes, rather than silently reporting a partial filter set.
		const values = safe.searchParams.getAll(key);
		if (!values.every((value) => pattern.test(value))) {
			safe.searchParams.delete(key);
		}
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

	// Note the per-page dedupe state (impressions, leads) is NOT cleared here. It is
	// cleared in `beforeNavigate`, because a list container's `update()` runs as the new
	// DOM commits — before afterNavigate — so clearing here would wipe the impression it
	// had just recorded and let the same grid report a second time on the next scroll.

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
