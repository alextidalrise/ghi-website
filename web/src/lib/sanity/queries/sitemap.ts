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
    "parentType": parent->type,
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
 *
 * DEVELOPMENTS ONLY, deliberately (2026-09-22). Two months after launch Google had indexed
 * only the homepage, every other URL sat in "Discovered – currently not indexed", and crawl
 * stats showed ~300 requests in 90 days. With that little crawl budget, advertising ~420
 * individual properties (197 of them Kyero-feed imports whose text is syndicated elsewhere)
 * spent it on the least distinctive pages. Property pages stay live, linked and indexable —
 * they're just not submitted. Once Google indexes the core pages and crawls regularly,
 * restore the previous type filter here:
 *   _type in ["propertyListing", "development"]
 *   && (_type != "propertyListing" || listingKind in ["property", "unit"])
 */
export const sitemapListingsQuery = defineQuery(`
  *[
    _type == "development"
    && defined(slug.current)
    && ${PUBLIC_LISTING_FILTER}
    && coalesce(seo.noindex, false) != true
  ]{
    ${CANONICAL_PATH_FIELDS},
    _updatedAt
  }
`);
