import { defineQuery } from 'groq';
import { LOCATION_TAXONOMY_PUBLIC, MEDIA_ASSET_PUBLIC } from '../allowlists';

/** Country stub page — minimal public taxonomy fields for v1. */
export const countryBySlugQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && slug.current == $countrySlug
  ][0]${LOCATION_TAXONOMY_PUBLIC}
`);

/** Location stub page within a country. */
export const locationBySlugQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "location"
    && slug.current == $locationSlug
    && parent->slug.current == $countrySlug
  ][0]${LOCATION_TAXONOMY_PUBLIC}
`);

/** Location page context — linked locations for grid merge and related-area links. */
export const locationPageContextQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "location"
    && slug.current == $locationSlug
    && parent->slug.current == $countrySlug
  ][0]{
    _id,
    name,
    "slug": slug.current,
    type,
    breadcrumbLabel,
    seoTitle,
    metaDescription,
    publicDescription,
    heroImage${MEDIA_ASSET_PUBLIC},
    tagline,
    linkedLocations[]{
      includeInGrid,
      showLink,
      location->{
        _id,
        name,
        "slug": slug.current,
        breadcrumbLabel
      }
    }
  }
`);

/** Community within a location context — direct parent or associated location. */
export const communityInLocationContextQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "community"
    && slug.current == $communitySlug
    && (
      parent._ref == $locationId
      || $locationId in associatedLocations[]._ref
    )
  ][0]${LOCATION_TAXONOMY_PUBLIC}
`);

/** All countries for navigation and discovery — ordered by name. */
export const countriesForNavQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && defined(slug.current)
  ] | order(name asc) {
    _id,
    name,
    "slug": slug.current
  }
`);

/** All locations under a country — for country page listings. */
export const locationsByCountryQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "location"
    && parent->slug.current == $countrySlug
  ] | order(name asc)${LOCATION_TAXONOMY_PUBLIC}
`);

/** Communities under a location — direct children and associated communities. */
export const communitiesByLocationQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "community"
    && (
      parent._ref == $locationId
      || $locationId in associatedLocations[]._ref
    )
  ] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    type,
    breadcrumbLabel,
    seoTitle,
    metaDescription,
    publicDescription,
    "canonicalLocationSlug": parent->slug.current,
    "isAssociated": $locationId in associatedLocations[]._ref && parent._ref != $locationId
  }
`);

/** All communities with their canonical location + country slugs — for the homepage discovery cascade. */
export const communitiesForNavQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "community"
    && defined(slug.current)
    && defined(parent->slug.current)
    && defined(parent->parent->slug.current)
  ] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    "locationSlug": parent->slug.current,
    "countrySlug": parent->parent->slug.current
  }
`);

/** Breadcrumb chain from a taxonomy reference upward through parents (country → location → community). */
export const locationBreadcrumbQuery = defineQuery(`
  *[_id == $taxonomyId][0]{
    "chain": [
      ...*[_id == ^._id][0].parent->parent->${LOCATION_TAXONOMY_PUBLIC},
      ...*[_id == ^._id][0].parent->${LOCATION_TAXONOMY_PUBLIC},
      ${LOCATION_TAXONOMY_PUBLIC}
    ][defined(name)]
  }
`);
