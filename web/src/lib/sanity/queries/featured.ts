import { defineQuery } from 'groq';
import { PROPERTY_CARD_PUBLIC } from '../allowlists';
import { toPublicPropertyCard, type PublicPropertyCard, type RawPropertyCard } from '../transforms/propertyCard';
import { fetchPublic } from './fetch';
import { PUBLIC_LISTING_FILTER } from './filters';
import {
	buildPaginatedListingCardsQuery,
	listingSearchQueryParams,
	type ListingSearchScope
} from './listingSearch';

export const FRONTLINE_LISTING_LIMIT = 8;
export const HOMEPAGE_FEATURED_LIMIT = 8;
export const COUNTRY_FEATURED_LIMIT = 6;

export type { ListingSearchScope };

const FEATURED_LISTING_DEREF = /* groq */ `
  _type == "propertyListing"
  && listingKind in ["property", "unit"]
  && ${PUBLIC_LISTING_FILTER}
`;

/** Ordered featured cards from site settings — editor order preserved. */
export const homepageFeaturedListingsQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    "cards": homepageFeaturedListings[]->[
      ${FEATURED_LISTING_DEREF}
    ]${PROPERTY_CARD_PUBLIC}
  }
`);

/** Ordered featured cards for a country taxonomy doc — editor order preserved. */
export const countryFeaturedListingsQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && slug.current == $countrySlug
  ][0]{
    "cards": featuredListings[]->[
      ${FEATURED_LISTING_DEREF}
    ]${PROPERTY_CARD_PUBLIC}
  }
`);

function toFeaturedCards(
	raw: Array<RawPropertyCard | null | undefined> | null | undefined,
	limit: number
): PublicPropertyCard[] {
	return (raw ?? [])
		.filter((card): card is RawPropertyCard => Boolean(card?._id))
		.slice(0, limit)
		.map(toPublicPropertyCard);
}

/**
 * Frontline golf spotlight cards for a taxonomy scope.
 * Reuses listing-search GROQ with a fixed frontline_golf filter and newest sort.
 */
export async function fetchFrontlineListingCards({
	scope
}: {
	scope: ListingSearchScope;
}): Promise<PublicPropertyCard[]> {
	const queryParams = listingSearchQueryParams(scope, {
		golfRelevance: ['frontline_golf'],
		start: 0,
		end: FRONTLINE_LISTING_LIMIT
	});
	const query = buildPaginatedListingCardsQuery(scope, 'newest');
	const raw = await fetchPublic<RawPropertyCard[]>(query, { params: queryParams });
	return (raw ?? []).map(toPublicPropertyCard);
}

/** Site-wide frontline golf spotlight for the homepage. */
export async function fetchHomepageFrontlineListingCards(): Promise<PublicPropertyCard[]> {
	return fetchFrontlineListingCards({ scope: { type: 'global' } });
}

/** Hand-picked homepage featured cards from siteSettings.homepageFeaturedListings. */
export async function fetchHomepageFeaturedListingCards(): Promise<PublicPropertyCard[]> {
	const result = await fetchPublic<{ cards?: Array<RawPropertyCard | null> | null }>(
		homepageFeaturedListingsQuery
	);
	return toFeaturedCards(result?.cards, HOMEPAGE_FEATURED_LIMIT);
}

/** Hand-picked country featured cards from locationTaxonomy.featuredListings. */
export async function fetchCountryFeaturedListingCards({
	countrySlug
}: {
	countrySlug: string;
}): Promise<PublicPropertyCard[]> {
	const result = await fetchPublic<{ cards?: Array<RawPropertyCard | null> | null }>(
		countryFeaturedListingsQuery,
		{ params: { countrySlug } }
	);
	return toFeaturedCards(result?.cards, COUNTRY_FEATURED_LIMIT);
}
