/**
 * Reusable GROQ filter fragments for the public query layer.
 * Defence in depth: every public listing query must include these gates.
 *
 * Each gate carries a `|| $previewAll` escape hatch. In production `$previewAll` is
 * false (see PUBLIC_QUERY_PARAMS) so the gates apply normally. The env-gated dev
 * preview mode in ./fetch.ts sets it true to surface draft/hidden/held listings
 * locally. Never true in production.
 */

/** Document-level publish readiness gate. */
export const PUBLISH_READINESS_FILTER = /* groq */ `
  (coalesce(workflow.publishReadiness, "") in $approvedReadiness || $previewAll)
`;

/** Pricing visibility gate — reserved/hidden/internal items never surface publicly. */
export const PUBLIC_VISIBILITY_FILTER = /* groq */ `
  (coalesce(pricing.publicVisibility, "visible") == "visible" || $previewAll)
`;

/** Reserved availability gate at document level. */
export const NOT_RESERVED_FILTER = /* groq */ `
  (coalesce(pricing.availabilityStatus, "") != "reserved" || $previewAll)
`;

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

/** Combined gate for publishable property listings and developments. */
export const PUBLIC_LISTING_FILTER = /* groq */ `
  ${PUBLISH_READINESS_FILTER}
  && ${PUBLIC_VISIBILITY_FILTER}
  && ${NOT_RESERVED_FILTER}
`;

/** Child unit / unit-type gate (same pricing + readiness rules). */
export const PUBLIC_CHILD_UNIT_FILTER = /* groq */ `
  ${PUBLISH_READINESS_FILTER}
  && ${PUBLIC_VISIBILITY_FILTER}
  && ${NOT_RESERVED_FILTER}
`;

/**
 * Unit-page gate. A unit is publishable only when its own readiness + visibility
 * pass AND its parent development is itself publishable. Availability is NOT gated
 * here: a reserved/sold unit still has a reachable page (it renders with status),
 * unlike hidden/internal units which must never resolve.
 */
export const UNIT_PARENT_PUBLISHABLE = /* groq */ `
  (coalesce(parentDevelopment->workflow.publishReadiness, "") in $approvedReadiness || $previewAll)
  && (coalesce(parentDevelopment->pricing.publicVisibility, "visible") == "visible" || $previewAll)
`;

export const UNIT_PUBLISHABLE_FILTER = /* groq */ `
  ${PUBLISH_READINESS_FILTER}
  && ${PUBLIC_VISIBILITY_FILTER}
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
