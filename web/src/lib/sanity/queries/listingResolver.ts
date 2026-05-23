import { defineQuery } from 'groq';
import { CANONICAL_PATH_FIELDS } from '../allowlists';
import { PUBLIC_LISTING_FILTER } from './filters';

/**
 * Single resolver query for /[country]/[area]/[slug].
 * Returns either a property listing or development that matches path + public gates.
 */
export const listingByPathQuery = defineQuery(`
  *[
    _type in ["propertyListing", "development"]
    && location.country->slug.current == $countrySlug
    && location.area->slug.current == $areaSlug
    && slug.current == $slug
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
