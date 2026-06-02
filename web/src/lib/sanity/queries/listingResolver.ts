import { defineQuery } from 'groq';
import { CANONICAL_PATH, CANONICAL_PATH_FIELDS } from '../allowlists';
import {
	LISTING_COUNTRY_SLUG,
	LISTING_LOCATION_SLUG,
	LISTING_PATH_FILTER,
	PUBLIC_LISTING_FILTER
} from './filters';

/**
 * Single resolver query for /[country]/[location]/[community]/[slug].
 * Returns either a property listing or development that matches path + public gates.
 */
export const listingByPathQuery = defineQuery(`
  *[
    _type in ["propertyListing", "development"]
    && ${LISTING_PATH_FILTER}
    && (
      (_type == "propertyListing" && listingKind in ["property", "unit"])
      || _type == "development"
    )
    && ${PUBLIC_LISTING_FILTER}
  ][0]{
    _type,
    listingKind,
    ${CANONICAL_PATH_FIELDS}
  }
`);

/**
 * Resolve legacy /{country}/{location}/{slug} URLs (pre-community hierarchy).
 * The third segment was a listing slug under the location, not a community slug.
 */
export const listingLegacyThreeSegmentPathQuery = defineQuery(`
  *[
    _type in ["propertyListing", "development"]
    && slug.current == $slug
    && ${LISTING_COUNTRY_SLUG} == $countrySlug
    && ${LISTING_LOCATION_SLUG} == $locationSlug
    && (
      (_type == "propertyListing" && listingKind in ["property", "unit"])
      || _type == "development"
    )
    && ${PUBLIC_LISTING_FILTER}
  ]${CANONICAL_PATH}
`);
