import { defineQuery } from 'groq';
import {
	CANONICAL_PATH,
	PROPERTY_CARD_PUBLIC,
	PROPERTY_LISTING_PUBLIC,
	PROPERTY_LISTING_WITH_CANONICAL
} from '../allowlists';
import {
	LISTING_COMMUNITY_SLUG,
	LISTING_COUNTRY_SLUG,
	LISTING_LOCATION_SLUG,
	LISTING_PATH_FILTER,
	PUBLIC_LISTING_FILTER
} from './filters';

/** Resolve a property listing by hierarchical URL segments (preview — no publish gates). */
export const propertyByPathPreviewQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && ${LISTING_PATH_FILTER}
  ][0]${PROPERTY_LISTING_PUBLIC}
`);

/** Resolve a property listing by hierarchical URL segments. */
export const propertyByPathQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && ${LISTING_PATH_FILTER}
    && ${PUBLIC_LISTING_FILTER}
  ][0]${PROPERTY_LISTING_PUBLIC}
`);

/** Canonical path lookup for 301 redirects when URL segments are stale. */
export const propertyCanonicalPathQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && ${LISTING_PATH_FILTER}
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
    && ${LISTING_COUNTRY_SLUG} == $countrySlug
    && ${PUBLIC_LISTING_FILTER}
  ]${CANONICAL_PATH}
`);

/** Minimal card projection for listings grids within a community. */
export const propertyCardsByCommunityQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && ${LISTING_COUNTRY_SLUG} == $countrySlug
    && ${LISTING_LOCATION_SLUG} == $locationSlug
    && ${LISTING_COMMUNITY_SLUG} == $communitySlug
    && ${PUBLIC_LISTING_FILTER}
  ] | order(title asc)[$start...$end]${PROPERTY_CARD_PUBLIC}
`);

/** Minimal card projection for listings grids within a location (all communities). */
export const propertyCardsByLocationQuery = defineQuery(`
  *[
    _type == "propertyListing"
    && listingKind in ["property", "unit"]
    && ${LISTING_COUNTRY_SLUG} == $countrySlug
    && ${LISTING_LOCATION_SLUG} == $locationSlug
    && ${PUBLIC_LISTING_FILTER}
  ] | order(title asc)[$start...$end]${PROPERTY_CARD_PUBLIC}
`);
