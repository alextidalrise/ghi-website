import { defineQuery } from 'groq';
import {
	FEATURED_LOCATION_PROJECTION,
	FEATURED_LOCATION_REF_FILTER,
	PROPERTY_CARD_PUBLIC
} from '../allowlists';
import { toPublicPropertyCard, type PublicPropertyCard, type RawPropertyCard } from '../transforms/propertyCard';
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
 * (`refs[@->gate]->{...}`) resolves drafts correctly and keeps the gates in GROQ —
 * with $previewAll false the readiness/visibility/reserved gates still drop
 * hidden/held listings, so production behaviour is unchanged.
 *
 * Keep these clauses in sync with queries/filters.ts (here they are @-> prefixed).
 */
const FEATURED_LISTING_REF_FILTER = /* groq */ `
  @->_type == "propertyListing"
  && @->listingKind in ["property", "unit"]
  && (coalesce(@->workflow.publishReadiness, "") in $approvedReadiness || $previewAll)
  && (coalesce(@->pricing.publicVisibility, "visible") == "visible" || $previewAll)
  && (coalesce(@->pricing.availabilityStatus, "") != "reserved" || $previewAll)
`;

/** Ordered featured cards from site settings — editor order preserved. */
export const homepageFeaturedListingsQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    "cards": homepageFeaturedListings[
      ${FEATURED_LISTING_REF_FILTER}
    ]->${PROPERTY_CARD_PUBLIC}
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
    ]->${PROPERTY_CARD_PUBLIC}
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
