import { LISTING_CARD_UNION } from '../allowlists';
import type { ListingSort } from '../../listing/filterOptions';
import { rateQueryParams, type RateTable } from '../../currency/rates';
import { PUBLIC_CHILD_UNIT_FILTER, PUBLIC_LISTING_FILTER } from './filters';
import { PRICE_NUMERIC_EUR } from './priceNumeric';

/**
 * Base document filter shared by cards and count queries. Surfaces individual
 * properties/units AND whole developments — the latter render as rich cards
 * interleaved with properties.
 */
const LISTING_BASE_FILTER = /* groq */ `
  (
    (_type == "propertyListing" && listingKind in ["property", "unit"])
    || _type == "development"
  )
  && ${PUBLIC_LISTING_FILTER}
`;

/** EUR-normalised numeric value used for price filters and sorts. Native amounts are
    converted so a mixed-currency catalogue sorts and filters coherently. Shared with the
    homepage facet projection via ./priceNumeric. Requires $rateGBP/$rateUSD/$rateAED. */
const PRICE_NUMERIC = PRICE_NUMERIC_EUR;

/**
 * Which rows participate in numeric price filters. Developments still gate on
 * `priceConfirmed`; properties (which no longer carry that field) are filterable
 * whenever they expose a numeric price.
 */
const PRICE_FILTERABLE = /* groq */ `(
    (_type == "development" && pricing.priceConfirmed == true)
    || (_type == "propertyListing" && defined(pricing.price))
  )`;

/** Order behind the unsorted grid (after any pins) — the pre-pinning default. */
export const NATURAL_SORT: ListingSort = 'newest';

/** Allowlisted sort fragments — only composed from validated ListingSort values. */
export const SORT_ORDER_FRAGMENTS = {
	price_asc: `${PRICE_NUMERIC} asc, _id asc`,
	price_desc: `${PRICE_NUMERIC} desc, _id asc`,
	title: 'title asc, _id asc',
	newest: '_createdAt desc, _id asc'
} as const satisfies Record<ListingSort, string>;

export type ListingSearchScope =
	/** `pins: 'frontline'` leads with siteSettings.frontlinePinnedListings (Front Line Collection). */
	| { type: 'global'; pins?: 'frontline' }
	| { type: 'community'; countrySlug: string; locationSlug: string; communitySlug: string }
	| {
			type: 'location';
			countrySlug: string;
			locationSlug: string;
			/** The page's own location doc — the one holding its pinned listings. */
			locationId: string;
			locationIds: string[];
			communityId?: string | null;
	  }
	| { type: 'country'; countrySlug: string }
	| { type: 'golfCourse'; golfCourseId: string };

function scopeFilter(scope: ListingSearchScope): string {
	switch (scope.type) {
		case 'global':
			return 'true';
		case 'community':
			return /* groq */ `
        location.country->slug.current == $countrySlug
        && location.location->slug.current == $locationSlug
        && location.community->slug.current == $communitySlug
      `;
		case 'location':
			if (scope.communityId) {
				return /* groq */ `
          location.country->slug.current == $countrySlug
          && location.community._ref == $communityId
        `;
			}
			return /* groq */ `
        location.country->slug.current == $countrySlug
        && location.location._ref in $locationIds
      `;
		case 'country':
			return /* groq */ `location.country->slug.current == $countrySlug`;
		case 'golfCourse':
			return /* groq */ `
        $golfCourseId in golf.linkedGolfCourses[]._ref
      `;
	}
}

/**
 * Optional facet filters — omitted params disable each constraint.
 *
 * The property-type and bedroom facets are unit-aware for developments: a
 * development matches if ANY of its visible+available unit types (for property
 * type — units inherit type from their parent so unit types are authoritative) or
 * units/unit types (for bedrooms) qualifies. Price, golf, community and location
 * facets need no branching — developments carry the same fields as properties.
 */
const FACET_FILTERS = /* groq */ `
  (
    !defined($propertyType)
    || (_type == "propertyListing" && propertyType == $propertyType)
    || (
      _type == "development"
      && count((unitTypes[]->)[ ${PUBLIC_CHILD_UNIT_FILTER} && propertyType == $propertyType ]) > 0
    )
  )
  && (!defined($community) || location.community->slug.current == $community)
  && (!defined($location) || location.location->slug.current == $location)
  && (
    !defined($minBeds)
    || (_type == "propertyListing" && coalesce(specs.bedrooms, 0) >= $minBeds)
    || (
      _type == "development"
      && (
        count((unitTypes[]->)[ ${PUBLIC_CHILD_UNIT_FILTER} && coalesce(specs.bedrooms, 0) >= $minBeds ]) > 0
        || count((units[]->)[ ${PUBLIC_CHILD_UNIT_FILTER} && coalesce(specs.bedrooms, 0) >= $minBeds ]) > 0
      )
    )
  )
  && (
    !defined($minPrice)
    || (
      ${PRICE_FILTERABLE}
      && ${PRICE_NUMERIC} >= $minPrice
    )
  )
  && (
    !defined($maxPrice)
    || (
      ${PRICE_FILTERABLE}
      && ${PRICE_NUMERIC} <= $maxPrice
    )
  )
  && (
    !defined($golfRelevance)
    || count($golfRelevance) == 0
    || coalesce(golf.golfRelevance, "unknown") in $golfRelevance
  )
  && (
    !defined($golfCourse)
    || count($golfCourse) == 0
    || count(golf.linkedGolfCourses[@->slug.current in $golfCourse]) > 0
  )
  && (
    !defined($features)
    || count($features) == 0
    || count(content.featureHighlights[
      lower(label) in $features
      || lower(string::split(label, ",")[0]) in $features
    ]) > 0
  )
`;

function listingFilter(scope: ListingSearchScope): string {
	return /* groq */ `
    ${LISTING_BASE_FILTER}
    && ${scopeFilter(scope)}
    && ${FACET_FILTERS}
  `;
}

/** Build allowlisted paginated card query for a validated sort option. */
export function buildPaginatedListingCardsQuery(
	scope: ListingSearchScope,
	sort: ListingSort
): string {
	return /* groq */ `
    *[
      ${listingFilter(scope)}
    ] | order(${SORT_ORDER_FRAGMENTS[sort]})[$start...$end]${LISTING_CARD_UNION}
  `;
}

/** Most listings a grid can pin; mirrors the Studio field's max. */
export const PINNED_LISTINGS_LIMIT = 6;

/**
 * The document holding a scope's ordered pin list, or null when the scope has none.
 * Every expression here is fixed text — only params vary.
 */
function pinSourceExpression(scope: ListingSearchScope): string | null {
	switch (scope.type) {
		case 'country':
			return /* groq */ `*[_type == "locationTaxonomy" && type == "country" && slug.current == $countrySlug][0].pinnedListings`;
		case 'location':
			return /* groq */ `*[_id == $pinSourceId][0].pinnedListings`;
		case 'golfCourse':
			return /* groq */ `*[_id == $golfCourseId][0].pinnedListings`;
		case 'global':
			return scope.pins === 'frontline'
				? /* groq */ `*[_type == "siteSettings" && _id == "siteSettings"][0].frontlinePinnedListings`
				: null;
		case 'community':
			return null;
	}
}

/**
 * Unsorted grid query: the scope's pinned listings (editor order, same filters as the grid)
 * followed by the rest in natural (newest) order.
 *
 * Returns `{ pinned, rest }`. Dereferencing the pin array preserves its order, and filtering
 * that array with the full grid filter drops pins that are unpublished, out of scope, or
 * excluded by the visitor's facets. `rest` excludes every pinned id so nothing repeats; the
 * caller windows `pinned ++ rest` into the page (see mergePinnedPage), so `rest` is fetched
 * from `$restStart` — up to PINNED_LISTINGS_LIMIT rows early — to cover any pin count.
 * Returns null for scopes that cannot carry pins (caller uses the plain paginated query).
 */
export function buildPinnedListingCardsQuery(scope: ListingSearchScope): string | null {
	const source = pinSourceExpression(scope);
	if (!source) return null;
	const pins = `coalesce(${source}[0...${PINNED_LISTINGS_LIMIT}], [])`;
	return /* groq */ `{
    "pinned": (${pins}[]->)[
      ${listingFilter(scope)}
    ]${LISTING_CARD_UNION},
    "rest": *[
      ${listingFilter(scope)}
      && !(_id in ${pins}[]._ref)
    ] | order(${SORT_ORDER_FRAGMENTS[NATURAL_SORT]})[$restStart...$end]${LISTING_CARD_UNION}
  }`;
}

/**
 * Window a page out of `pinned ++ rest`, given `rest` was fetched from `restStart`.
 * Pins only ever occupy the leading slots, so page 2+ simply continues the natural order
 * shifted by the pin count — total and page count are unchanged.
 */
export function mergePinnedPage<T>(
	pinned: T[],
	rest: T[],
	{ start, end, restStart }: { start: number; end: number; restStart: number }
): T[] {
	const leading = pinned.slice(start, end);
	const restFrom = Math.max(start - pinned.length, 0) - restStart;
	const restTo = end - pinned.length - restStart;
	return [...leading, ...rest.slice(Math.max(restFrom, 0), Math.max(restTo, 0))];
}

/** `rest` offset for a page window — early enough to cover the largest possible pin count. */
export function pinnedRestStart(start: number): number {
	return Math.max(start - PINNED_LISTINGS_LIMIT, 0);
}

/** Build allowlisted count query with identical filters to the card query. */
export function buildListingCardsCountQuery(scope: ListingSearchScope): string {
	return /* groq */ `
    count(*[
      ${listingFilter(scope)}
    ])
  `;
}

/** GROQ params for optional facet filters derived from ListingSearchParams. */
export function listingSearchQueryParams(
	scope: ListingSearchScope,
	params: {
		propertyType?: string | null;
		community?: string | null;
		location?: string | null;
		minPrice?: number | null;
		maxPrice?: number | null;
		minBeds?: number | null;
		golfRelevance?: string[];
		golfCourse?: string[];
		features?: string[];
		start?: number;
		end?: number;
		/** Pinned query only: where the natural rows start (see pinnedRestStart). */
		restStart?: number;
	},
	rates?: RateTable
) {
	// Sanity requires every $param referenced in GROQ to be supplied — use null for inactive facets.
	return {
		// $rateGBP/$rateUSD/$rateAED for the EUR-normalised price expression (PRICE_NUMERIC).
		// `rates` comes from the request's live exchange-rates doc; omitted → static fallback.
		...rateQueryParams(rates),
		...(scope.type === 'country' ||
		scope.type === 'location' ||
		scope.type === 'community'
			? { countrySlug: scope.countrySlug }
			: {}),
		...(scope.type === 'location' || scope.type === 'community'
			? { locationSlug: scope.locationSlug }
			: {}),
		...(scope.type === 'location'
			? { locationIds: scope.locationIds, pinSourceId: scope.locationId }
			: {}),
		...(scope.type === 'location' && scope.communityId ? { communityId: scope.communityId } : {}),
		...(scope.type === 'community' ? { communitySlug: scope.communitySlug } : {}),
		...(scope.type === 'golfCourse' ? { golfCourseId: scope.golfCourseId } : {}),
		propertyType: params.propertyType ?? null,
		community: params.community ?? null,
		location: params.location ?? null,
		minPrice: params.minPrice ?? null,
		maxPrice: params.maxPrice ?? null,
		minBeds: params.minBeds ?? null,
		golfRelevance:
			params.golfRelevance && params.golfRelevance.length > 0
				? params.golfRelevance
				: null,
		golfCourse:
			params.golfCourse && params.golfCourse.length > 0 ? params.golfCourse : null,
		features: params.features && params.features.length > 0 ? params.features : null,
		start: params.start,
		end: params.end,
		...(params.restStart != null ? { restStart: params.restStart } : {})
	};
}

/** Build locationIds for grid scope: primary location plus linked locations with includeInGrid. */
export function buildLocationGridIds(
	locationId: string,
	linkedLocations: Array<{ includeInGrid?: boolean | null; location?: { _id?: string } | null }>
): string[] {
	const ids = new Set<string>([locationId]);
	for (const entry of linkedLocations) {
		if (entry.includeInGrid && entry.location?._id) {
			ids.add(entry.location._id);
		}
	}
	return [...ids];
}
