import { defineQuery } from 'groq';
import { LOCATION_TAXONOMY_PUBLIC } from '../allowlists';

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

/** Community stub page within a location. */
export const communityBySlugQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "community"
    && slug.current == $communitySlug
    && parent->slug.current == $locationSlug
    && parent->parent->slug.current == $countrySlug
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
