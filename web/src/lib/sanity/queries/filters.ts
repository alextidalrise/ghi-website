/**
 * Reusable GROQ filter fragments for the public query layer.
 * Defence in depth: every public listing query must include these gates.
 */

/** Document-level publish readiness gate. */
export const PUBLISH_READINESS_FILTER = /* groq */ `
  coalesce(workflow.publishReadiness, "") in $approvedReadiness
`;

/** Pricing visibility gate — reserved/hidden/internal items never surface publicly. */
export const PUBLIC_VISIBILITY_FILTER = /* groq */ `
  coalesce(pricing.publicVisibility, "visible") == "visible"
`;

/** Reserved availability gate at document level. */
export const NOT_RESERVED_FILTER = /* groq */ `
  coalesce(pricing.availabilityStatus, "") != "reserved"
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

/** Community slug for listing URLs. */
export const LISTING_COMMUNITY_SLUG = /* groq */ `location.community->slug.current`;

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
  coalesce(workflow.publishReadiness, "") in $approvedReadiness
  && coalesce(pricing.publicVisibility, "visible") == "visible"
  && coalesce(pricing.availabilityStatus, "") != "reserved"
`;
