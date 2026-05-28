import { PROPERTY_CARD_PUBLIC } from '../allowlists';
import type { ListingSort } from '../../listing/filterOptions';
import { PUBLIC_LISTING_FILTER } from './filters';

/** Base document filter shared by cards and count queries. */
const LISTING_BASE_FILTER = /* groq */ `
  _type == "propertyListing"
  && listingKind in ["property", "unit"]
  && ${PUBLIC_LISTING_FILTER}
`;

/** Exclude folder-hint prices from numeric price filters and sorts. */
const PRICE_NUMERIC = /* groq */ `coalesce(pricing.price, pricing.priceFrom)`;

const PRICE_FILTERABLE = /* groq */ `coalesce(pricing.priceSourceStatus, "") != "folder_hint_only"`;

/** Allowlisted sort fragments — only composed from validated ListingSort values. */
export const SORT_ORDER_FRAGMENTS = {
	price_asc: `${PRICE_NUMERIC} asc, _id asc`,
	price_desc: `${PRICE_NUMERIC} desc, _id asc`,
	title: 'publicTitle asc, _id asc',
	newest: '_createdAt desc, _id asc'
} as const satisfies Record<ListingSort, string>;

export type ListingSearchScope =
	| { type: 'community'; countrySlug: string; locationSlug: string; communitySlug: string }
	| { type: 'location'; countrySlug: string; locationSlug: string }
	| { type: 'country'; countrySlug: string };

function scopeFilter(scope: ListingSearchScope): string {
	switch (scope.type) {
		case 'community':
			return /* groq */ `
        location.country->slug.current == $countrySlug
        && location.location->slug.current == $locationSlug
        && location.community->slug.current == $communitySlug
      `;
		case 'location':
			return /* groq */ `
        location.country->slug.current == $countrySlug
        && location.location->slug.current == $locationSlug
      `;
		case 'country':
			return /* groq */ `location.country->slug.current == $countrySlug`;
	}
}

/** Optional facet filters — omitted params disable each constraint. */
const FACET_FILTERS = /* groq */ `
  (!defined($propertyType) || propertyType == $propertyType)
  && (!defined($minBeds) || coalesce(specs.bedrooms, 0) >= $minBeds)
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
    ] | order(${SORT_ORDER_FRAGMENTS[sort]})[$start...$end]${PROPERTY_CARD_PUBLIC}
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
		minPrice?: number | null;
		maxPrice?: number | null;
		minBeds?: number | null;
		golfRelevance?: string[];
		start?: number;
		end?: number;
	}
) {
	return {
		countrySlug: scope.countrySlug,
		...(scope.type === 'location' || scope.type === 'community'
			? { locationSlug: scope.locationSlug }
			: {}),
		...(scope.type === 'community' ? { communitySlug: scope.communitySlug } : {}),
		propertyType: params.propertyType ?? undefined,
		minPrice: params.minPrice ?? undefined,
		maxPrice: params.maxPrice ?? undefined,
		minBeds: params.minBeds ?? undefined,
		golfRelevance:
			params.golfRelevance && params.golfRelevance.length > 0
				? params.golfRelevance
				: undefined,
		start: params.start,
		end: params.end
	};
}
