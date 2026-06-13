import { defineQuery } from 'groq';
import {
	FEATURED_LOCATION_PROJECTION,
	FEATURED_LOCATION_REF_FILTER,
	LISTING_CARD_UNION
} from '../allowlists';
import {
	toSimilarListingCard,
	type RawSimilarListingItem,
	type SimilarListingCard
} from '../transforms/similarListingCard';
import {
	toLocationCards,
	type FeaturedLocationCard,
	type TaxonomyWithHero
} from '../transforms/taxonomyHero';
import { fetchPublic } from './fetch';
import {
	buildPaginatedListingCardsQuery,
	listingSearchQueryParams,
	type ListingSearchScope
} from './listingSearch';

export const FRONTLINE_LISTING_LIMIT = 8;
export const HOMEPAGE_FEATURED_LIMIT = 8;
export const COUNTRY_FEATURED_LIMIT = 6;
export const HOMEPAGE_FEATURED_LOCATIONS_LIMIT = 6;
export const COUNTRY_FEATURED_LOCATIONS_LIMIT = 6;

export type { ListingSearchScope };

/**
 * Gates for a hand-picked *reference array* (homepageFeaturedListings,
 * featuredListings), applied to the reference via `@->` BEFORE dereferencing.
 *
 * Mirrors PUBLIC_LISTING_FILTER (queries/filters.ts) plus the featured doc-type
 * rules, but it must filter in reference position. A filtered dereference
 * (`refs[]->[gate]`) resolves to null for any unpublished target, so editor-picked
 * draft listings never render in dev preview mode. Filtering the ref array first
 * (`refs[@->gate]->{...}`) resolves drafts correctly and keeps the gates in GROQ.
 *
 * Keep these clauses in sync with queries/filters.ts (here they are @-> prefixed).
 */
const FEATURED_LISTING_REF_FILTER = /* groq */ `
  (
    (@->_type == "propertyListing" && @->listingKind in ["property", "unit"])
    || @->_type == "development"
  )
  && (coalesce(@->status, "") == $publishedStatus || $previewAll)
`;

/** Ordered featured cards from site settings — editor order preserved. */
export const homepageFeaturedListingsQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    "cards": homepageFeaturedListings[
      ${FEATURED_LISTING_REF_FILTER}
    ]->${LISTING_CARD_UNION}
  }
`);

/** Ordered featured locations for a country taxonomy doc — editor order preserved. */
export const countryFeaturedLocationsQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && slug.current == $countrySlug
  ][0]{
    "locations": featuredLocations[
      ${FEATURED_LOCATION_REF_FILTER}
    ]->${FEATURED_LOCATION_PROJECTION}
  }
`);

/** Ordered featured cards for a country taxonomy doc — editor order preserved. */
export const countryFeaturedListingsQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && slug.current == $countrySlug
  ][0]{
    "cards": featuredListings[
      ${FEATURED_LISTING_REF_FILTER}
    ]->${LISTING_CARD_UNION}
  }
`);

function toFeaturedCards(
	raw: Array<RawSimilarListingItem | null | undefined> | null | undefined,
	limit: number
): SimilarListingCard[] {
	return (raw ?? [])
		.filter((card): card is RawSimilarListingItem => Boolean(card?._id))
		.slice(0, limit)
		.map(toSimilarListingCard)
		.filter((card): card is SimilarListingCard => card !== null);
}

/**
 * Frontline golf spotlight cards for a taxonomy scope.
 * Reuses listing-search GROQ with a fixed frontline_golf filter and newest sort.
 */
export async function fetchFrontlineListingCards({
	scope
}: {
	scope: ListingSearchScope;
}): Promise<SimilarListingCard[]> {
	const queryParams = listingSearchQueryParams(scope, {
		golfRelevance: ['frontline_golf'],
		start: 0,
		end: FRONTLINE_LISTING_LIMIT
	});
	const query = buildPaginatedListingCardsQuery(scope, 'newest');
	const raw = await fetchPublic<RawSimilarListingItem[]>(query, { params: queryParams });
	return (raw ?? [])
		.map(toSimilarListingCard)
		.filter((card): card is SimilarListingCard => card !== null);
}

/** Site-wide frontline golf spotlight for the homepage. */
export async function fetchHomepageFrontlineListingCards(): Promise<SimilarListingCard[]> {
	return fetchFrontlineListingCards({ scope: { type: 'global' } });
}

/** Hand-picked homepage featured cards from siteSettings.homepageFeaturedListings. */
export async function fetchHomepageFeaturedListingCards(): Promise<SimilarListingCard[]> {
	const result = await fetchPublic<{ cards?: Array<RawSimilarListingItem | null> | null }>(
		homepageFeaturedListingsQuery
	);
	return toFeaturedCards(result?.cards, HOMEPAGE_FEATURED_LIMIT);
}

/** Hand-picked country featured cards from locationTaxonomy.featuredListings. */
export async function fetchCountryFeaturedListingCards({
	countrySlug
}: {
	countrySlug: string;
}): Promise<SimilarListingCard[]> {
	const result = await fetchPublic<{ cards?: Array<RawSimilarListingItem | null> | null }>(
		countryFeaturedListingsQuery,
		{ params: { countrySlug } }
	);
	return toFeaturedCards(result?.cards, COUNTRY_FEATURED_LIMIT);
}

/** Hand-picked country featured locations from locationTaxonomy.featuredLocations. */
export async function fetchCountryFeaturedLocations({
	countrySlug
}: {
	countrySlug: string;
}): Promise<FeaturedLocationCard[]> {
	const result = await fetchPublic<{ locations?: Array<TaxonomyWithHero | null> | null }>(
		countryFeaturedLocationsQuery,
		{ params: { countrySlug } }
	);
	return toLocationCards(result?.locations).slice(0, COUNTRY_FEATURED_LOCATIONS_LIMIT);
}
