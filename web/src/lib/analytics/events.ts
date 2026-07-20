import { onSessionReset, push } from './dataLayer';
import type {
	AnalyticsItem,
	ContactMethod,
	LeadType,
	ListContext,
	ListingKind
} from './types';

/**
 * The typed emitter API — the only analytics surface components touch.
 *
 * Every function is vendor-neutral: it emits a `ghi_*` event describing what happened,
 * and the GTM container decides which GA4 event that becomes. Renaming a GA4 event, or
 * moving to a different analytics vendor entirely, should never require a change here or
 * in any component.
 */

/** Free-text is never sent, so a features list is capped to keep payloads bounded. */
const MAX_FEATURES = 10;

export type SearchPlacement = 'results_filters' | 'discovery_bar';

/**
 * A stable label for a price range.
 *
 * Reported as a band rather than two numbers so GA4 groups comparable searches instead
 * of fragmenting across every possible min/max pair. Values are derived from our own
 * filter state, never from visitor input.
 */
export function priceBandLabel(
	min: number | null | undefined,
	max: number | null | undefined
): string | undefined {
	if (min == null && max == null) return undefined;
	if (min == null) return `up-to-${max}`;
	if (max == null) return `${min}-plus`;
	return `${min}-${max}`;
}

export type SearchParams = {
	placement: SearchPlacement;
	country?: string | null;
	location?: string | null;
	community?: string | null;
	propertyType?: string | null;
	priceBand?: string | null;
	minBeds?: number | null;
	sort?: string | null;
	selectedFeatures?: readonly string[];
	golfRelevance?: readonly string[];
};

/**
 * A property search was applied.
 *
 * Two parameters from the original brief are deliberately absent:
 *
 * `search_term`, because the site has no free-text search box — every filter draws on a
 * closed vocabulary, so there is nothing to send.
 *
 * `result_count`, because a search here *is* a navigation: the count is not known until
 * the results page has loaded, by which time this event has already fired. The only
 * number available at submit time describes the previous result set, and a plausible
 * wrong number is worse than an absent one. Result volume is analysable from the listing
 * page views and their `view_item_list` payloads instead.
 */
export function trackSearchSubmitted(params: SearchParams): void {
	push({
		event: 'ghi_search_submitted',
		search_placement: params.placement,
		country: params.country ?? undefined,
		location: params.location ?? undefined,
		community: params.community ?? undefined,
		property_type: params.propertyType ?? undefined,
		price_band: params.priceBand ?? undefined,
		min_beds: params.minBeds ?? undefined,
		sort: params.sort ?? undefined,
		selected_features: params.selectedFeatures?.slice(0, MAX_FEATURES),
		golf_relevance: params.golfRelevance?.slice(0, MAX_FEATURES)
	});
}

/** A listing collection scrolled into view. */
export function trackListViewed(list: ListContext, items: AnalyticsItem[]): void {
	if (items.length === 0) return;
	push({
		event: 'ghi_listing_list_viewed',
		item_list_id: list.list_id,
		item_list_name: list.list_name,
		items
	});
}

/** A listing card was clicked. */
export function trackListingSelected(item: AnalyticsItem | null): void {
	if (!item) return;
	push({
		event: 'ghi_listing_selected',
		item_list_id: item.item_list_id,
		item_list_name: item.item_list_name,
		items: [item]
	});
}

/** A property, development or unit detail page was viewed. */
export function trackListingViewed(item: AnalyticsItem | null, kind?: ListingKind): void {
	if (!item) return;
	push({
		event: 'ghi_listing_viewed',
		listing_id: item.item_id,
		listing_kind: kind ?? item.item_category,
		items: [item]
	});
}

export type GallerySurface = 'property' | 'development';
export type GalleryNavigation = 'arrow' | 'thumbnail' | 'swipe' | 'keyboard';

/** The full-screen gallery was opened. */
export function trackGalleryOpened(params: {
	listingId?: string | null;
	position: number;
	total: number;
	surface: GallerySurface;
}): void {
	push({
		event: 'ghi_gallery_opened',
		listing_id: params.listingId ?? undefined,
		image_position: params.position,
		image_count: params.total,
		gallery_surface: params.surface
	});
}

/** The visitor deliberately moved to another image. */
export function trackGalleryImageViewed(params: {
	listingId?: string | null;
	position: number;
	total: number;
	surface: GallerySurface;
	method: GalleryNavigation;
}): void {
	push({
		event: 'ghi_gallery_image_viewed',
		listing_id: params.listingId ?? undefined,
		image_position: params.position,
		image_count: params.total,
		gallery_surface: params.surface,
		navigation_method: params.method
	});
}

/** The floorplan CTA opened the request form. */
export function trackFloorplanRequestStarted(listingId?: string | null): void {
	push({
		event: 'ghi_floorplan_request_started',
		listing_id: listingId ?? undefined
	});
}

/** A WhatsApp, telephone or email CTA was chosen. */
export function trackContactClicked(params: {
	method: ContactMethod;
	placement: string;
	listingId?: string | null;
}): void {
	push({
		event: 'ghi_contact_clicked',
		contact_method: params.method,
		placement: params.placement,
		listing_id: params.listingId ?? undefined
	});
}

/**
 * Leads submitted in this page session, to guard against a double fire.
 *
 * The primary defence is the call site: `trackLeadSubmitted` is only ever called from a
 * `use:enhance` success branch, which runs once per network submit. This set is a second
 * net, because the cost of over-reporting a conversion is high and the cost of the guard
 * is nil. Cleared on navigation, so a genuine second enquiry still counts.
 */
const submittedLeads = new Set<string>();
onSessionReset(() => submittedLeads.clear());

/**
 * A form submission that the server confirmed HubSpot accepted.
 *
 * Must never be called on click, on client-side validation, on a failed submission, or
 * from a derived success state — see the note in EnquiryRail.svelte.
 */
export function trackLeadSubmitted(params: {
	leadType: LeadType;
	formLocation: string;
	listingId?: string | null;
	item?: AnalyticsItem | null;
}): void {
	const fingerprint = `${params.leadType}|${params.formLocation}|${params.listingId ?? ''}`;
	if (submittedLeads.has(fingerprint)) return;
	submittedLeads.add(fingerprint);

	push({
		event: 'ghi_lead_submitted',
		lead_type: params.leadType,
		form_location: params.formLocation,
		listing_id: params.listingId ?? undefined,
		items: params.item ? [params.item] : undefined
	});
}
