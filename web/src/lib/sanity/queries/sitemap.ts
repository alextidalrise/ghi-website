import { defineQuery } from 'groq';
import { CANONICAL_PATH_FIELDS } from '../allowlists';
import { PUBLIC_LISTING_FILTER } from './filters';

/** All taxonomy nodes with slugs for sitemap path assembly. */
export const sitemapTaxonomyQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && defined(slug.current)
  ]{
    type,
    "slug": slug.current,
    "countrySlug": select(
      type == "country" => slug.current,
      type == "location" => parent->slug.current,
      type == "community" => parent->parent->slug.current
    ),
    "locationSlug": select(
      type == "location" => slug.current,
      type == "community" => parent->slug.current,
      null
    ),
    "communitySlug": select(type == "community" => slug.current, null),
    _updatedAt
  }
`);

/**
 * Publishable listing canonical path segments for sitemap.
 *
 * Uses the same CANONICAL_PATH_FIELDS fragment the 301-redirect resolvers use, so the
 * emitted path (via buildCanonicalPath) is byte-identical to the URL a request lands on.
 * The `isCatchAll` field is the reason: catch-all-community listings (where the community
 * slug duplicates the location, e.g. vilamoura/vilamoura) canonicalise to the 3-segment
 * form. Projecting only communitySlug — as this query used to — left isCatchAll undefined,
 * so the sitemap emitted the 4-segment path that then 301s to the 3-segment canonical.
 */
export const sitemapListingsQuery = defineQuery(`
  *[
    _type in ["propertyListing", "development"]
    && (_type != "propertyListing" || listingKind in ["property", "unit"])
    && defined(slug.current)
    && ${PUBLIC_LISTING_FILTER}
    && coalesce(seo.noindex, false) != true
  ]{
    ${CANONICAL_PATH_FIELDS},
    _updatedAt
  }
`);
