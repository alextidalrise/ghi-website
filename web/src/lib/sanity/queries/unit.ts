import { defineQuery } from 'groq';
import { UNIT_CANONICAL_PATH, UNIT_LISTING_PUBLIC } from '../allowlists';
import {
	UNIT_DEV_CATCH_ALL_PATH_FILTER,
	UNIT_DEV_PATH_FILTER,
	UNIT_PUBLISHABLE_FILTER
} from './filters';

/**
 * Resolve a unit nested under its development at
 * /{country}/{location}/{community}/{developmentSlug}/{unitSlug}.
 * Availability is intentionally not gated — a reserved/sold unit page still resolves
 * (it renders with its status); only hidden/internal units and unpublishable parents
 * are excluded by UNIT_PUBLISHABLE_FILTER.
 */
export const unitByDevPathQuery = defineQuery(`
  *[
    _type == "unit"
    && ${UNIT_DEV_PATH_FILTER}
    && ${UNIT_PUBLISHABLE_FILTER}
  ][0]${UNIT_LISTING_PUBLIC}
`);

/** Preview variant — no publish gates. */
export const unitByDevPathPreviewQuery = defineQuery(`
  *[
    _type == "unit"
    && ${UNIT_DEV_PATH_FILTER}
  ][0]${UNIT_LISTING_PUBLIC}
`);

/** Resolve a unit under a catch-all development at /{country}/{location}/{developmentSlug}/{unitSlug}. */
export const unitByCatchAllDevPathQuery = defineQuery(`
  *[
    _type == "unit"
    && ${UNIT_DEV_CATCH_ALL_PATH_FILTER}
    && ${UNIT_PUBLISHABLE_FILTER}
  ][0]${UNIT_LISTING_PUBLIC}
`);

/** Catch-all preview variant — no publish gates. */
export const unitByCatchAllDevPathPreviewQuery = defineQuery(`
  *[
    _type == "unit"
    && ${UNIT_DEV_CATCH_ALL_PATH_FILTER}
  ][0]${UNIT_LISTING_PUBLIC}
`);

/** Find a publishable unit by GHI ID for /u/[ghiId] permalink resolution. */
export const unitByGhiIdQuery = defineQuery(`
  *[
    _type == "unit"
    && ghiListingId == $ghiId
    && ${UNIT_PUBLISHABLE_FILTER}
  ][0]${UNIT_CANONICAL_PATH}
`);

/**
 * Find publishable units by unit slug + parent development slug when the
 * location/community segments may be stale. Returns canonical path segments for a
 * 301 redirect when exactly one match exists.
 */
export const unitStalePathQuery = defineQuery(`
  *[
    _type == "unit"
    && slug.current == $unitSlug
    && parentDevelopment->slug.current == $developmentSlug
    && ${UNIT_PUBLISHABLE_FILTER}
  ]${UNIT_CANONICAL_PATH}
`);
