import { shouldShowDevelopmentPricing } from '$lib/listing/developmentDisplay';
import type { AnalyticsItem, ListContext, ListingKind } from './types';

/**
 * Listing → GA4 item.
 *
 * Typed structurally rather than against the four concrete transform types
 * (`PublicPropertyCard`, `PublicDevelopmentCard`, `PublicPropertyListing`,
 * `PublicDevelopment`). They already share every field we read, and a structural type
 * keeps this module from breaking each time an unrelated field is added to one of them.
 */

export type ItemSource = {
	ghiListingId?: string | null;
	title?: string | null;
	listingKind?: string | null;
	propertyType?: string | null;
	/** Card shape: the taxonomy slugs are flattened onto the card itself. */
	countrySlug?: string | null;
	locationSlug?: string | null;
	/** Detail shape: the same slugs live under the nested location object. */
	location?: {
		country?: { slug?: string | null } | null;
		location?: { slug?: string | null } | null;
	} | null;
	developmentDisplayMode?: string | null;
	pricing?: {
		price?: number | null;
		priceFrom?: number | null;
		priceDisplay?: string | null;
		currency?: string | null;
	} | null;
};

/**
 * Cards and detail documents carry the same taxonomy in different shapes — flattened
 * slugs on a card, a nested location object on a detail page. Reading both keeps the
 * country and location dimensions present on `view_item` as well as `view_item_list`,
 * which they would otherwise silently lack.
 */
function countryOf(source: ItemSource): string | null | undefined {
	return source.countrySlug ?? source.location?.country?.slug;
}

function locationOf(source: ItemSource): string | null | undefined {
	return source.locationSlug ?? source.location?.location?.slug;
}

export type ItemContext = {
	list?: ListContext;
	index?: number;
	/** Overrides the source's own kind — units are properties in the CMS. */
	kind?: ListingKind;
};

export const ITEM_BRAND = 'Golf Homes International';

function isDevelopment(source: ItemSource): boolean {
	return source.developmentDisplayMode != null || source.listingKind === 'development';
}

/**
 * Resolve the numeric price, or nothing at all.
 *
 * The codebase expresses "no price" in four different ways across `pricingFilter.ts`,
 * `formatPrice.ts` and `developmentDisplay.ts`. This folds all of them into a single
 * decision, because GA4 needs a number or nothing — a zero would be read as a free
 * property and would silently corrupt revenue-shaped reporting.
 *
 * Deliberately does not reuse `formatListingPrice()`: that returns a display string and
 * conflates "POA" with "no pricing data at all".
 */
export function analyticsPrice(source: ItemSource): { price?: number; currency?: string } {
	const pricing = source.pricing;
	if (!pricing) return {};

	// `filterPublicPricing` collapses to this when `priceConfirmed === false`, having
	// already stripped the numbers. Price on application: send no price.
	if (pricing.priceDisplay === 'POA') return {};

	// Enquiry-led developments suppress pricing entirely in the UI; match that.
	if (isDevelopment(source) && !shouldShowDevelopmentPricing(source.developmentDisplayMode as never)) {
		return {};
	}

	// `priceFrom` is a real quoted figure ("From €450,000"), so it is worth reporting
	// when there is no single price.
	const amount = pricing.price ?? pricing.priceFrom ?? null;
	if (amount == null || !Number.isFinite(amount) || amount <= 0) return {};

	return { price: amount, currency: pricing.currency ?? 'EUR' };
}

/**
 * Build a GA4 item, or null when the listing cannot be identified.
 *
 * Returning null rather than falling back to Sanity's `_id` is deliberate: `_id` is an
 * internal document reference and is prohibited data. An unidentifiable listing is
 * simply not reported.
 */
export function toAnalyticsItem(
	source: ItemSource | null | undefined,
	ctx: ItemContext = {}
): AnalyticsItem | null {
	if (!source) return null;

	const itemId = source.ghiListingId?.trim();
	if (!itemId) return null;

	const kind: ListingKind = ctx.kind ?? (isDevelopment(source) ? 'development' : 'property');

	const item: AnalyticsItem = {
		item_id: itemId,
		item_brand: ITEM_BRAND,
		item_category: kind
	};

	if (source.title) item.item_name = source.title;
	// Slugs rather than display names: stable across CMS copy edits, already lowercase
	// and URL-safe, and they can never carry an address fragment.
	if (source.propertyType) item.item_category2 = source.propertyType;

	const country = countryOf(source);
	const location = locationOf(source);
	if (country) item.item_category3 = country;
	if (location) item.item_category4 = location;

	const { price, currency } = analyticsPrice(source);
	if (price !== undefined) {
		item.price = price;
		item.currency = currency;
	}

	if (ctx.list) {
		item.item_list_id = ctx.list.list_id;
		item.item_list_name = ctx.list.list_name;
	}
	if (ctx.index !== undefined) item.index = ctx.index;

	return item;
}

/**
 * Map a card collection to items, preserving each card's position in the original list.
 *
 * Index is taken from the source array, not from the filtered output, so an
 * unidentifiable listing leaves a gap rather than shifting every later card's position.
 * That keeps `index` consistent between an impression and the click that follows it.
 */
export function toAnalyticsItems(
	cards: ReadonlyArray<{ kind?: string; card: ItemSource } | ItemSource>,
	list: ListContext
): AnalyticsItem[] {
	return toAnalyticsItemsByPosition(cards, list).filter((item): item is AnalyticsItem => item !== null);
}

/**
 * The same mapping, but aligned one-to-one with the source array.
 *
 * List containers render cards by position, so they need a lookup that keeps its holes:
 * a listing with no GHI id yields `null` at its slot rather than shifting every later
 * card onto the wrong item. Callers pass this straight to a card by index, and use
 * `toAnalyticsItems` for the impression payload.
 */
export function toAnalyticsItemsByPosition(
	cards: ReadonlyArray<{ kind?: string; card: ItemSource } | ItemSource>,
	list: ListContext
): (AnalyticsItem | null)[] {
	return cards.map((entry, index) => {
		const source = entry && 'card' in entry ? entry.card : (entry as ItemSource);
		const kind = entry && 'kind' in entry && entry.kind === 'development' ? 'development' : undefined;
		return toAnalyticsItem(source, { list, index, kind });
	});
}
