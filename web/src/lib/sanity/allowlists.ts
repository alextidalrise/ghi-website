import {
	LISTING_COMMUNITY_SLUG,
	LISTING_COUNTRY_SLUG,
	LISTING_IS_CATCH_ALL,
	LISTING_LOCATION_SLUG,
	PUBLIC_CHILD_UNIT_FILTER,
	UNIT_DEV_COMMUNITY_SLUG,
	UNIT_DEV_COUNTRY_SLUG,
	UNIT_DEV_IS_CATCH_ALL,
	UNIT_DEV_LOCATION_SLUG
} from './queries/filters';

/**
 * Explicit public field allowlists per template.
 * Wildcard projections are forbidden — compose queries only from these fragments.
 */

/** Public media asset metadata — source provenance fields excluded at query time. */
export const MEDIA_ASSET_PUBLIC = /* groq */ `{
  asset,
  fileAsset,
  assetCategory,
  order,
  altText
}`;

/** Public fields on locationTaxonomy references used in breadcrumbs and stubs. */
export const LOCATION_TAXONOMY_PUBLIC = /* groq */ `{
  _id,
  name,
  "slug": slug.current,
  type,
  breadcrumbLabel,
  isCatchAll,
  seoTitle,
  metaDescription,
  publicDescription,
  overviewHeading,
  heroImage${MEDIA_ASSET_PUBLIC},
  tagline,
  coordinates
}`;

/**
 * Filter applied to a hand-picked `locationTaxonomy` reference (e.g.
 * siteSettings.homepageFeaturedLocations, locationTaxonomy.featuredLocations) so only
 * resolvable location docs with a country parent survive into the featured grid.
 */
export const FEATURED_LOCATION_REF_FILTER = /* groq */ `
  @->_type == "locationTaxonomy"
  && @->type == "location"
  && defined(@->slug.current)
  && defined(@->parent->slug.current)
`;

/** Projection for a featured-location card — hero image, tagline, and country context. */
export const FEATURED_LOCATION_PROJECTION = /* groq */ `{
  _id,
  name,
  "slug": slug.current,
  type,
  breadcrumbLabel,
  tagline,
  heroImage${MEDIA_ASSET_PUBLIC},
  "countrySlug": parent->slug.current,
  "countryName": parent->name
}`;

/** Public location projection — map pin comes from community->coordinates. */
export const LOCATION_PUBLIC = /* groq */ `{
  country->${LOCATION_TAXONOMY_PUBLIC},
  location->${LOCATION_TAXONOMY_PUBLIC},
  community->${LOCATION_TAXONOMY_PUBLIC},
  addressDisplay
}`;

/**
 * Public pricing fields. `priceConfirmed` rides through so the transform layer
 * can collapse to POA when false; numeric prices are still projected so the
 * transform — not GROQ — is the single point of POA enforcement.
 */
export const PRICING_PUBLIC = /* groq */ `{
  price,
  priceFrom,
  priceTo,
  priceDisplay,
  currency,
  priceQualifier,
  priceConfirmed,
  availabilityStatus,
  completionStatus,
  completionDate,
  buildStatus
}`;

/** Public media bundle for property/development pages. */
export const MEDIA_PUBLIC = /* groq */ `{
  gallery[]${MEDIA_ASSET_PUBLIC},
  galleryGroups[]{
    title,
    images[]${MEDIA_ASSET_PUBLIC}
  },
  thumbnailOverride${MEDIA_ASSET_PUBLIC},
  floorplans[]${MEDIA_ASSET_PUBLIC},
  videoUrl,
  virtualTourUrl,
  brochure${MEDIA_ASSET_PUBLIC},
  brochurePublic
}`;

/** Public website content fields — marketing source and editorial workflow excluded. */
export const CONTENT_PUBLIC = /* groq */ `{
  shortDescription,
  aboutDescription,
  locationDescription,
  golfDescription,
  featureHighlights[]{
    label,
    value,
    category,
    isFilterable,
    isHighlighted
  },
  amenities
}`;

/** Public specs object — full specsFields group is public when approved. */
export const SPECS_PUBLIC = 'specs';

/** Public golf fields — enrichment workflow fields excluded. */
export const GOLF_PUBLIC = /* groq */ `{
  golfRelevance,
  primaryGolfCourse->{
    _id,
    name,
    "slug": slug.current,
    shortDescription,
    "communitySlug": community->slug.current,
    "locationSlug": community->parent->slug.current,
    "countrySlug": community->parent->parent->slug.current
  },
  linkedGolfCourses[]->{
    _id,
    name,
    "slug": slug.current,
    shortDescription,
    "communitySlug": community->slug.current,
    "locationSlug": community->parent->slug.current,
    "countrySlug": community->parent->parent->slug.current
  },
  distanceToPrimaryGolfCourse,
  golfView,
  buggyAccess,
  golfMembershipInfo
}`;

/** Public CTA fields — routing and internal templates excluded. */
export const CTA_PUBLIC = /* groq */ `{
  primaryCtaLabel,
  secondaryCtaLabel,
  formIntroText,
  responseTimeText,
  brochureCtaText,
  brochureCtaEnabled
}`;

/** Public SEO fields — workflow keywords and internal clustering excluded. */
export const SEO_PUBLIC = /* groq */ `{
  seoTitle,
  metaDescription,
  openGraphTitle,
  openGraphDescription,
  openGraphImage${MEDIA_ASSET_PUBLIC},
  noindex,
  schemaType,
  backLinks[]{
    label,
    url
  },
  supportingArticles
}`;

/** Public related-listings fields — manual picks and tags fetched server-side only. */
export const RELATED_PUBLIC = /* groq */ `{
  similarPropertiesMode
}`;

/**
 * Guide section body. Image members are reshaped to the public media projection so
 * provenance fields never leak; every other member (text blocks, callouts, key
 * figures) keeps its full shape (none carry sensitive fields). `_type` and `_key`
 * are preserved on images so the portable-text renderer can dispatch and key them.
 */
export const GUIDE_SECTION_PUBLIC = /* groq */ `{
  heading,
  "anchor": anchor.current,
  body[]{
    _type == "mediaAssetMetadata" => {
      _type,
      _key,
      asset,
      altText,
      assetCategory,
      "dimensions": asset.asset->metadata.dimensions
    },
    _type != "mediaAssetMetadata" => { ... }
  }
}`;

/**
 * Public partner projection. `referralUrl` is deliberately excluded — it is the GHI
 * team's internal handoff and must never reach the browser.
 */
export const PARTNER_PUBLIC = /* groq */ `{
  _id,
  name,
  "slug": slug.current,
  coverage,
  description,
  logo${MEDIA_ASSET_PUBLIC}
}`;

/**
 * Partner category with its partners inlined, ordered, and self-filtered to those with
 * a usable slug. Categories with no partners are dropped at the query level so the page
 * never renders an empty section header.
 */
export const PARTNER_CATEGORY_PUBLIC = /* groq */ `{
  "id": slug.current,
  name,
  monogram,
  role,
  "partners": *[
    _type == "partner"
    && references(^._id)
    && defined(slug.current)
  ] | order(coalesce(order, 999) asc, name asc) ${PARTNER_PUBLIC}
}`;

/** Minimal partner projection for the homepage logo wall — only those with a logo. */
export const PARTNER_LOGO_PUBLIC = /* groq */ `{
  _id,
  name,
  "slug": slug.current,
  logo${MEDIA_ASSET_PUBLIC}
}`;

/** Guide card projection — hub grid and related-guides cross-links. */
export const GUIDE_CARD_PUBLIC = /* groq */ `{
  _id,
  title,
  "slug": slug.current,
  guideCategory,
  audienceLabel,
  tagline,
  heroImage${MEDIA_ASSET_PUBLIC}
}`;

/** Full guide page fields (no wrapping braces, so the by-slug query can add siblings). */
export const GUIDE_DETAIL_FIELDS = /* groq */ `
  _id,
  _type,
  title,
  "slug": slug.current,
  guideCategory,
  audienceLabel,
  tagline,
  intro,
  lastReviewed,
  heroImage${MEDIA_ASSET_PUBLIC},
  sections[]${GUIDE_SECTION_PUBLIC},
  advisorHeading,
  advisorBody,
  seo${SEO_PUBLIC}
`;

/**
 * Development card for grids and rails. Carries href-parity slugs (so catch-all /
 * id-prefix communities build correct URLs) plus aggregated inventory: count of
 * publicly available units and the bedroom range across visible+available units and
 * unit types. The aggregation reuses PUBLIC_CHILD_UNIT_FILTER so it never diverges
 * from the unit-page visibility/availability gates.
 */
export const DEVELOPMENT_CARD_PUBLIC = /* groq */ `{
  _id,
  _type,
  ghiListingId,
  title,
  "slug": slug.current,
  listingKind,
  developmentDisplayMode,
  developmentStatus,
  "countrySlug": ${LISTING_COUNTRY_SLUG},
  "locationSlug": ${LISTING_LOCATION_SLUG},
  "communitySlug": ${LISTING_COMMUNITY_SLUG},
  "isCatchAll": ${LISTING_IS_CATCH_ALL},
  location{
    country->{ name, "slug": slug.current },
    location->{ name, "slug": slug.current },
    community->{ _id, name, "slug": slug.current, isCatchAll },
    addressDisplay
  },
  pricing${PRICING_PUBLIC},
  "unitsAvailable": count((units[]->)[ ${PUBLIC_CHILD_UNIT_FILTER} ]),
  "bedroomsFrom": math::min(
    (unitTypes[]->)[ ${PUBLIC_CHILD_UNIT_FILTER} ].specs.bedrooms
    + (units[]->)[ ${PUBLIC_CHILD_UNIT_FILTER} ].specs.bedrooms
  ),
  "bedroomsTo": math::max(
    (unitTypes[]->)[ ${PUBLIC_CHILD_UNIT_FILTER} ].specs.bedrooms
    + (units[]->)[ ${PUBLIC_CHILD_UNIT_FILTER} ].specs.bedrooms
  ),
  media{
    gallery[0...1]${MEDIA_ASSET_PUBLIC},
    thumbnailOverride${MEDIA_ASSET_PUBLIC}
  }
}`;

/** Card / search result minimal projection. */
export const PROPERTY_CARD_PUBLIC = /* groq */ `{
  _id,
  ghiListingId,
  title,
  "slug": slug.current,
  listingKind,
  propertyType,
  transactionType,
  "countrySlug": ${LISTING_COUNTRY_SLUG},
  "locationSlug": ${LISTING_LOCATION_SLUG},
  "communitySlug": ${LISTING_COMMUNITY_SLUG},
  "isCatchAll": ${LISTING_IS_CATCH_ALL},
  location{
    country->{ name, "slug": slug.current },
    location->{ name, "slug": slug.current },
    community->{ _id, name, "slug": slug.current, isCatchAll },
    addressDisplay
  },
  pricing${PRICING_PUBLIC},
  specs{
    bedrooms,
    bathrooms,
    builtArea,
    builtAreaUnit
  },
  media{
    gallery[0...1]${MEDIA_ASSET_PUBLIC},
    thumbnailOverride${MEDIA_ASSET_PUBLIC}
  }
}`;

/**
 * Mixed card projection for surfaces that interleave properties/units and whole
 * developments (location grid, featured rails). Each row gets exactly one branch's
 * fields; downstream `toSimilarListingCard` discriminates on listingKind.
 */
export const LISTING_CARD_UNION = /* groq */ `{
  _type == "development" => ${DEVELOPMENT_CARD_PUBLIC},
  _type == "propertyListing" => ${PROPERTY_CARD_PUBLIC}
}`;

/** Full property listing page allowlist. */
export const PROPERTY_LISTING_PUBLIC = /* groq */ `{
  _id,
  _type,
  ghiListingId,
  title,
  "slug": slug.current,
  listingKind,
  propertyType,
  transactionType,
  location${LOCATION_PUBLIC},
  pricing${PRICING_PUBLIC},
  specs,
  golf${GOLF_PUBLIC},
  content${CONTENT_PUBLIC},
  media${MEDIA_PUBLIC},
  ctas${CTA_PUBLIC},
  related${RELATED_PUBLIC},
  seo${SEO_PUBLIC}
}`;

/** Public unit projection for the development inventory table. */
export const UNIT_PUBLIC = /* groq */ `{
  _id,
  ghiListingId,
  unitName,
  unitNumber,
  "slug": slug.current,
  listingKind,
  floor,
  phase,
  "unitTypeName": parentUnitType->unitTypeName,
  "propertyType": parentUnitType->propertyType,
  pricing${PRICING_PUBLIC},
  specs,
  floorplan${MEDIA_ASSET_PUBLIC},
  unitGallery[]${MEDIA_ASSET_PUBLIC}
}`;

/** Public unit type projection for development pages. */
export const UNIT_TYPE_PUBLIC = /* groq */ `{
  _id,
  unitTypeName,
  listingKind,
  pricing${PRICING_PUBLIC},
  specs,
  floorplans[]${MEDIA_ASSET_PUBLIC},
  gallery[]${MEDIA_ASSET_PUBLIC}
}`;

/** Full development page allowlist. */
export const DEVELOPMENT_PUBLIC = /* groq */ `{
  _id,
  _type,
  ghiListingId,
  developmentName,
  title,
  "slug": slug.current,
  listingKind,
  developmentDisplayMode,
  developmentStatus,
  buildStatus,
  completionDate,
  completionStatus,
  developerName,
  architectureStudio,
  developmentComposition,
  location${LOCATION_PUBLIC},
  pricing${PRICING_PUBLIC},
  availabilitySummary,
  sharedAmenities[]{
    label,
    value,
    category,
    isFilterable,
    isHighlighted
  },
  sharedGallery[]${MEDIA_ASSET_PUBLIC},
  media${MEDIA_PUBLIC},
  content${CONTENT_PUBLIC},
  golf${GOLF_PUBLIC},
  ctas${CTA_PUBLIC},
  related${RELATED_PUBLIC},
  seo${SEO_PUBLIC},
  unitTypes[]->${UNIT_TYPE_PUBLIC},
  units[]->${UNIT_PUBLIC}
}`;

/**
 * Inheritable development context projected onto a unit page. Mirrors the public
 * development page minus its own units/unitTypes (no recursion) — the unit borrows
 * the development's location, golf, editorial copy, amenities, CTAs and SEO base.
 */
export const DEVELOPMENT_CONTEXT_PUBLIC = /* groq */ `{
  _id,
  ghiListingId,
  developmentName,
  title,
  "slug": slug.current,
  developmentStatus,
  completionStatus,
  completionDate,
  developerName,
  location${LOCATION_PUBLIC},
  pricing${PRICING_PUBLIC},
  sharedAmenities[]{
    label,
    value,
    category,
    isFilterable,
    isHighlighted
  },
  sharedGallery[]${MEDIA_ASSET_PUBLIC},
  media${MEDIA_PUBLIC},
  content${CONTENT_PUBLIC},
  golf${GOLF_PUBLIC},
  ctas${CTA_PUBLIC},
  related${RELATED_PUBLIC},
  seo${SEO_PUBLIC},
  "countrySlug": ${LISTING_COUNTRY_SLUG},
  "locationSlug": ${LISTING_LOCATION_SLUG},
  "communitySlug": ${LISTING_COMMUNITY_SLUG},
  "isCatchAll": ${LISTING_IS_CATCH_ALL}
}`;

/** Canonical path segments for a unit (its development's path + the unit slug). */
export const UNIT_CANONICAL_PATH_FIELDS = /* groq */ `
  "countrySlug": ${UNIT_DEV_COUNTRY_SLUG},
  "locationSlug": ${UNIT_DEV_LOCATION_SLUG},
  "communitySlug": ${UNIT_DEV_COMMUNITY_SLUG},
  "isCatchAll": ${UNIT_DEV_IS_CATCH_ALL},
  "developmentSlug": parentDevelopment->slug.current,
  "unitSlug": slug.current
`;

/** Canonical path fragment for a unit — permalink + stale-URL 301 resolution. */
export const UNIT_CANONICAL_PATH = /* groq */ `{ ${UNIT_CANONICAL_PATH_FIELDS} }`;

/**
 * Full unit-page projection. The page is synthesized from three sources: the unit
 * (price, size, floor, number), its unit type (shared gallery + property type), and
 * its parent development (location, golf, copy, CTAs, SEO base).
 */
export const UNIT_LISTING_PUBLIC = /* groq */ `{
  _id,
  _type,
  ghiListingId,
  unitName,
  unitNumber,
  "slug": slug.current,
  listingKind,
  floor,
  phase,
  pricing${PRICING_PUBLIC},
  specs,
  floorplan${MEDIA_ASSET_PUBLIC},
  unitGallery[]${MEDIA_ASSET_PUBLIC},
  "unitType": parentUnitType->{
    _id,
    unitTypeName,
    propertyType,
    specs,
    gallery[]${MEDIA_ASSET_PUBLIC},
    floorplans[]${MEDIA_ASSET_PUBLIC}
  },
  "development": parentDevelopment->${DEVELOPMENT_CONTEXT_PUBLIC},
  ${UNIT_CANONICAL_PATH_FIELDS}
}`;

/** Canonical path fields for slug resolution and 301 redirects. */
export const CANONICAL_PATH_FIELDS = /* groq */ `
  "countrySlug": ${LISTING_COUNTRY_SLUG},
  "locationSlug": ${LISTING_LOCATION_SLUG},
  "communitySlug": ${LISTING_COMMUNITY_SLUG},
  "isCatchAll": ${LISTING_IS_CATCH_ALL},
  "slug": slug.current,
  listingKind
`;

/** Canonical path fragment returned for slug resolution and 301 redirects. */
export const CANONICAL_PATH = /* groq */ `{ ${CANONICAL_PATH_FIELDS} }`;

/** Property listing projection including canonical path segments for permalinks. */
export const PROPERTY_LISTING_WITH_CANONICAL = /* groq */ `{
  _id,
  _type,
  ghiListingId,
  title,
  "slug": slug.current,
  listingKind,
  propertyType,
  transactionType,
  location${LOCATION_PUBLIC},
  pricing${PRICING_PUBLIC},
  specs,
  golf${GOLF_PUBLIC},
  content${CONTENT_PUBLIC},
  media${MEDIA_PUBLIC},
  ctas${CTA_PUBLIC},
  related${RELATED_PUBLIC},
  seo${SEO_PUBLIC},
  ${CANONICAL_PATH_FIELDS}
}`;

/** Development projection including canonical path segments for permalinks. */
export const DEVELOPMENT_WITH_CANONICAL = /* groq */ `{
  _id,
  _type,
  ghiListingId,
  developmentName,
  title,
  "slug": slug.current,
  listingKind,
  developmentDisplayMode,
  developmentStatus,
  buildStatus,
  completionDate,
  completionStatus,
  developerName,
  architectureStudio,
  developmentComposition,
  location${LOCATION_PUBLIC},
  pricing${PRICING_PUBLIC},
  availabilitySummary,
  sharedAmenities[]{
    label,
    value,
    category,
    isFilterable,
    isHighlighted
  },
  sharedGallery[]${MEDIA_ASSET_PUBLIC},
  media${MEDIA_PUBLIC},
  content${CONTENT_PUBLIC},
  golf${GOLF_PUBLIC},
  ctas${CTA_PUBLIC},
  related${RELATED_PUBLIC},
  seo${SEO_PUBLIC},
  unitTypes[]->${UNIT_TYPE_PUBLIC},
  units[]->${UNIT_PUBLIC},
  ${CANONICAL_PATH_FIELDS}
}`;
