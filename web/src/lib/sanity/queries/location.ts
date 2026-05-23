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

/** Area stub page within a country. */
export const areaBySlugQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "area"
    && slug.current == $areaSlug
    && parent->slug.current == $countrySlug
  ][0]${LOCATION_TAXONOMY_PUBLIC}
`);

/** Breadcrumb chain from an area reference upward through parents. */
export const locationBreadcrumbQuery = defineQuery(`
  *[_id == $areaId][0]{
    "chain": [
      ...*[_id == ^._id][0].parent->parent->parent->parent->parent->${LOCATION_TAXONOMY_PUBLIC},
      ...*[_id == ^._id][0].parent->parent->parent->parent->${LOCATION_TAXONOMY_PUBLIC},
      ...*[_id == ^._id][0].parent->parent->parent->${LOCATION_TAXONOMY_PUBLIC},
      ...*[_id == ^._id][0].parent->parent->${LOCATION_TAXONOMY_PUBLIC},
      ...*[_id == ^._id][0].parent->${LOCATION_TAXONOMY_PUBLIC},
      ${LOCATION_TAXONOMY_PUBLIC}
    ][defined(name)]
  }
`);
