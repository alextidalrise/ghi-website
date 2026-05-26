import { defineQuery } from 'groq';
import {
	CANONICAL_PATH,
	PROPERTY_CARD_PUBLIC,
	PROPERTY_LISTING_PUBLIC,
	PROPERTY_LISTING_WITH_CANONICAL
} from '../allowlists';
import { PUBLIC_LISTING_FILTER } from './filters';

/** Resolve a property listing by hierarchical URL segments. */
export const propertyByPathQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && location.country->slug.current == $countrySlug
    && location.location->slug.current == $locationSlug
    && location.community->slug.current == $communitySlug
    && slug.current == $slug
    && ${PUBLIC_LISTING_FILTER}
  ][0]${PROPERTY_LISTING_PUBLIC}
`);

/** Canonical path lookup for 301 redirects when URL segments are stale. */
export const propertyCanonicalPathQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && location.country->slug.current == $countrySlug
    && location.location->slug.current == $locationSlug
    && location.community->slug.current == $communitySlug
    && slug.current == $slug
    && ${PUBLIC_LISTING_FILTER}
  ][0]${CANONICAL_PATH}
`);

/** Find publishable property by GHI ID for /p/[ghiId] permalink resolution. */
export const propertyByGhiIdQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && ghiListingId == $ghiId
    && listingKind in ["property", "unit"]
    && ${PUBLIC_LISTING_FILTER}
  ][0]${PROPERTY_LISTING_WITH_CANONICAL}
`);

/**
 * Find publishable properties by country + slug when location/community segments may be stale.
 * Returns canonical path fields for 301 redirect when exactly one match exists.
 */
export const propertyStalePathQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && slug.current == $slug
    && location.country->slug.current == $countrySlug
    && ${PUBLIC_LISTING_FILTER}
  ]${CANONICAL_PATH}
`);

/** Minimal card projection for listings grids within a community. */
export const propertyCardsByCommunityQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && location.country->slug.current == $countrySlug
    && location.location->slug.current == $locationSlug
    && location.community->slug.current == $communitySlug
    && ${PUBLIC_LISTING_FILTER}
  ] | order(publicTitle asc)[$start...$end]${PROPERTY_CARD_PUBLIC}
`);

/** Minimal card projection for listings grids within a location (all communities). */
export const propertyCardsByLocationQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && location.country->slug.current == $countrySlug
    && location.location->slug.current == $locationSlug
    && ${PUBLIC_LISTING_FILTER}
  ] | order(publicTitle asc)[$start...$end]${PROPERTY_CARD_PUBLIC}
`);
