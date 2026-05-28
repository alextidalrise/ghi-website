import { defineQuery } from 'groq';
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

/** Publishable listing canonical path segments for sitemap. */
export const sitemapListingsQuery = defineQuery(`
  *[
    _type in ["propertyListing", "development"]
    && (_type != "propertyListing" || listingKind in ["property", "unit"])
    && defined(slug.current)
    && ${PUBLIC_LISTING_FILTER}
    && coalesce(seo.noindex, false) != true
  ]{
    "countrySlug": location.country->slug.current,
    "locationSlug": location.location->slug.current,
    "communitySlug": location.community->slug.current,
    "slug": slug.current,
    _updatedAt
  }
`);
