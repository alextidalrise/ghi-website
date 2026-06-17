import { LISTING_CARD_UNION } from '../allowlists';
import type { ListingSort } from '../../listing/filterOptions';
import { PUBLIC_CHILD_UNIT_FILTER, PUBLIC_LISTING_FILTER } from './filters';

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

/** Numeric value used for price filters and sorts. */
const PRICE_NUMERIC = /* groq */ `coalesce(pricing.price, pricing.priceFrom)`;

/**
 * Which rows participate in numeric price filters. Developments still gate on
 * `priceConfirmed`; properties (which no longer carry that field) are filterable
 * whenever they expose a numeric price.
 */
const PRICE_FILTERABLE = /* groq */ `(
    (_type == "development" && pricing.priceConfirmed == true)
    || (_type == "propertyListing" && defined(pricing.price))
  )`;

/** Allowlisted sort fragments — only composed from validated ListingSort values. */
export const SORT_ORDER_FRAGMENTS = {
	price_asc: `${PRICE_NUMERIC} asc, _id asc`,
	price_desc: `${PRICE_NUMERIC} desc, _id asc`,
	title: 'title asc, _id asc',
	newest: '_createdAt desc, _id asc'
} as const satisfies Record<ListingSort, string>;

export type ListingSearchScope =
	| { type: 'global' }
	| { type: 'community'; countrySlug: string; locationSlug: string; communitySlug: string }
	| {
			type: 'location';
			countrySlug: string;
			locationSlug: string;
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
		minPrice?: number | null;
		maxPrice?: number | null;
		minBeds?: number | null;
		golfRelevance?: string[];
		golfCourse?: string[];
		start?: number;
		end?: number;
	}
) {
	// Sanity requires every $param referenced in GROQ to be supplied — use null for inactive facets.
	return {
		...(scope.type === 'country' ||
		scope.type === 'location' ||
		scope.type === 'community'
			? { countrySlug: scope.countrySlug }
			: {}),
		...(scope.type === 'location' || scope.type === 'community'
			? { locationSlug: scope.locationSlug }
			: {}),
		...(scope.type === 'location' ? { locationIds: scope.locationIds } : {}),
		...(scope.type === 'location' && scope.communityId ? { communityId: scope.communityId } : {}),
		...(scope.type === 'community' ? { communitySlug: scope.communitySlug } : {}),
		...(scope.type === 'golfCourse' ? { golfCourseId: scope.golfCourseId } : {}),
		propertyType: params.propertyType ?? null,
		community: params.community ?? null,
		minPrice: params.minPrice ?? null,
		maxPrice: params.maxPrice ?? null,
		minBeds: params.minBeds ?? null,
		golfRelevance:
			params.golfRelevance && params.golfRelevance.length > 0
				? params.golfRelevance
				: null,
		golfCourse:
			params.golfCourse && params.golfCourse.length > 0 ? params.golfCourse : null,
		start: params.start,
		end: params.end
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
