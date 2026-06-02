/** GROQ expressions for listing URL segments — derived from community taxonomy, not address display. */
export const LISTING_COUNTRY_SLUG = /* groq */ `coalesce(
  location.country->slug.current,
  location.community->parent->parent->slug.current
)`;

export const LISTING_LOCATION_SLUG = /* groq */ `coalesce(
  location.location->slug.current,
  location.community->parent->slug.current
)`;

export const LISTING_COMMUNITY_SLUG = /* groq */ `location.community->slug.current`;

export const LISTING_LOCATION_SLUGS_PROJECTION = /* groq */ `{
  "countrySlug": ${LISTING_COUNTRY_SLUG},
  "locationSlug": ${LISTING_LOCATION_SLUG},
  "communitySlug": ${LISTING_COMMUNITY_SLUG}
}`;
