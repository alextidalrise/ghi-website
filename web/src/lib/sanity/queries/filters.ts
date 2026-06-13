/**
 * Reusable GROQ filter fragments for the public query layer.
 *
 * The single public-listing gate keys off the document's top-level `status`.
 * In production `$previewAll` is false (see PUBLIC_QUERY_PARAMS) so only
 * `status === 'published'` documents surface. The env-gated dev preview mode
 * in ./fetch.ts sets `$previewAll = true` to surface non-published listings
 * locally. Never true in production.
 */

/** Whether a document is publicly visible (or preview-mode is on). */
export const PUBLIC_LISTING_FILTER = /* groq */ `
  (coalesce(status, "") == $publishedStatus || $previewAll)
`;

/** Same gate applies to child units / unit types. */
export const PUBLIC_CHILD_UNIT_FILTER = PUBLIC_LISTING_FILTER;

/** Country slug for listing URLs — from stored ref or community taxonomy parent chain. */
export const LISTING_COUNTRY_SLUG = /* groq */ `coalesce(
  location.country->slug.current,
  location.community->parent->parent->slug.current
)`;

/** Location slug for listing URLs — from stored ref or community taxonomy parent chain. */
export const LISTING_LOCATION_SLUG = /* groq */ `coalesce(
  location.location->slug.current,
  location.community->parent->slug.current
)`;

/** Community slug for listing URLs — falls back to stable taxonomy _id prefixes when
    slug.current is not yet set in the CMS (e.g. places-community-la-quinta). */
export const LISTING_COMMUNITY_SLUG = /* groq */ `coalesce(
  location.community->slug.current,
  select(
    location.community->_id match "places-community-*" =>
      string::split(location.community->_id, "places-community-")[1],
    location.community->_id match "location.community.*" =>
      string::split(location.community->_id, "location.community.")[1]
  )
)`;

/** Whether the listing's community is a catch-all bucket (URL omits community segment). */
export const LISTING_IS_CATCH_ALL = /* groq */ `coalesce(location.community->isCatchAll, false)`;

/** Match a listing at /{country}/{location}/{slug} when community is catch-all. */
export const LISTING_CATCH_ALL_PATH_FILTER = /* groq */ `
  ${LISTING_COUNTRY_SLUG} == $countrySlug
  && ${LISTING_LOCATION_SLUG} == $locationSlug
  && slug.current == $slug
  && ${LISTING_IS_CATCH_ALL} == true
`;

/** Match a listing document to its hierarchical URL segments. */
export const LISTING_PATH_FILTER = /* groq */ `
  ${LISTING_COUNTRY_SLUG} == $countrySlug
  && ${LISTING_LOCATION_SLUG} == $locationSlug
  && ${LISTING_COMMUNITY_SLUG} == $communitySlug
  && slug.current == $slug
`;

/**
 * Unit-page gate. A unit is publishable only when its own status is published
 * AND its parent development is itself published.
 */
export const UNIT_PARENT_PUBLISHABLE = /* groq */ `
  (coalesce(parentDevelopment->status, "") == $publishedStatus || $previewAll)
`;

export const UNIT_PUBLISHABLE_FILTER = /* groq */ `
  ${PUBLIC_LISTING_FILTER}
  && ${UNIT_PARENT_PUBLISHABLE}
`;

/** Parent-development URL segment slugs, resolved through the unit's parentDevelopment ref. */
export const UNIT_DEV_COUNTRY_SLUG = /* groq */ `coalesce(
  parentDevelopment->location.country->slug.current,
  parentDevelopment->location.community->parent->parent->slug.current
)`;

export const UNIT_DEV_LOCATION_SLUG = /* groq */ `coalesce(
  parentDevelopment->location.location->slug.current,
  parentDevelopment->location.community->parent->slug.current
)`;

export const UNIT_DEV_COMMUNITY_SLUG = /* groq */ `coalesce(
  parentDevelopment->location.community->slug.current,
  select(
    parentDevelopment->location.community->_id match "places-community-*" =>
      string::split(parentDevelopment->location.community->_id, "places-community-")[1],
    parentDevelopment->location.community->_id match "location.community.*" =>
      string::split(parentDevelopment->location.community->_id, "location.community.")[1]
  )
)`;

export const UNIT_DEV_IS_CATCH_ALL = /* groq */ `coalesce(parentDevelopment->location.community->isCatchAll, false)`;

/** Match a unit at /{country}/{location}/{community}/{developmentSlug}/{unitSlug}. */
export const UNIT_DEV_PATH_FILTER = /* groq */ `
  ${UNIT_DEV_COUNTRY_SLUG} == $countrySlug
  && ${UNIT_DEV_LOCATION_SLUG} == $locationSlug
  && ${UNIT_DEV_COMMUNITY_SLUG} == $communitySlug
  && parentDevelopment->slug.current == $developmentSlug
  && slug.current == $unitSlug
`;

/** Match a unit under a catch-all development at /{country}/{location}/{developmentSlug}/{unitSlug}. */
export const UNIT_DEV_CATCH_ALL_PATH_FILTER = /* groq */ `
  ${UNIT_DEV_COUNTRY_SLUG} == $countrySlug
  && ${UNIT_DEV_LOCATION_SLUG} == $locationSlug
  && parentDevelopment->slug.current == $developmentSlug
  && ${UNIT_DEV_IS_CATCH_ALL} == true
  && slug.current == $unitSlug
`;
