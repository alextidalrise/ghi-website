import { defineQuery } from 'groq';
import { CANONICAL_PATH, DEVELOPMENT_PUBLIC, DEVELOPMENT_WITH_CANONICAL } from '../allowlists';
import {
	LISTING_CATCH_ALL_PATH_FILTER,
	LISTING_COUNTRY_SLUG,
	LISTING_PATH_FILTER,
	PUBLIC_LISTING_FILTER
} from './filters';

/** Resolve a development by hierarchical URL segments (preview — no publish gates). */
export const developmentByPathPreviewQuery = defineQuery(`
  *[
    _type == "development"
    && ${LISTING_PATH_FILTER}
  ][0]${DEVELOPMENT_PUBLIC}
`);

/** Resolve a development by hierarchical URL segments. */
export const developmentByPathQuery = defineQuery(`
  *[
    _type == "development"
    && ${LISTING_PATH_FILTER}
    && ${PUBLIC_LISTING_FILTER}
  ][0]${DEVELOPMENT_PUBLIC}
`);

/** Resolve a development at /{country}/{location}/{slug} when community is catch-all. */
export const developmentByCatchAllPathQuery = defineQuery(`
  *[
    _type == "development"
    && ${LISTING_CATCH_ALL_PATH_FILTER}
    && ${PUBLIC_LISTING_FILTER}
  ][0]${DEVELOPMENT_PUBLIC}
`);

/** Resolve a catch-all development (preview — no publish gates). */
export const developmentByCatchAllPathPreviewQuery = defineQuery(`
  *[
    _type == "development"
    && ${LISTING_CATCH_ALL_PATH_FILTER}
  ][0]${DEVELOPMENT_PUBLIC}
`);

/** Canonical path lookup for stale development URLs. */
export const developmentCanonicalPathQuery = defineQuery(`
  *[
    _type == "development"
    && ${LISTING_PATH_FILTER}
    && ${PUBLIC_LISTING_FILTER}
  ][0]${CANONICAL_PATH}
`);

/** Find publishable development by GHI ID for /d/[ghiId] permalink resolution. */
export const developmentByGhiIdQuery = defineQuery(`
  *[
    _type == "development"
    && ghiListingId == $ghiId
    && ${PUBLIC_LISTING_FILTER}
  ][0]${DEVELOPMENT_WITH_CANONICAL}
`);

/**
 * Find publishable developments by country + slug when location/community segments may be stale.
 * Returns canonical path fields for 301 redirect when exactly one match exists.
 */
export const developmentStalePathQuery = defineQuery(`
  *[
    _type == "development"
    && slug.current == $slug
    && ${LISTING_COUNTRY_SLUG} == $countrySlug
    && ${PUBLIC_LISTING_FILTER}
  ]${CANONICAL_PATH}
`);
