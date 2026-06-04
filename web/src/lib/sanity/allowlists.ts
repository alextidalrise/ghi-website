/**
 * Explicit public field allowlists per template.
 * Wildcard projections are forbidden — compose queries only from these fragments.
 */

/** Public fields on locationTaxonomy references used in breadcrumbs and stubs. */
export const LOCATION_TAXONOMY_PUBLIC = /* groq */ `{
  _id,
  name,
  "slug": slug.current,
  type,
  breadcrumbLabel,
  seoTitle,
  metaDescription,
  publicDescription,
  coordinates
}`;

/** Public location projection — map pin comes from community->coordinates. */
export const LOCATION_PUBLIC = /* groq */ `{
  country->${LOCATION_TAXONOMY_PUBLIC},
  location->${LOCATION_TAXONOMY_PUBLIC},
  community->${LOCATION_TAXONOMY_PUBLIC},
  addressDisplay
}`;

/** Public pricing fields — governance fields excluded. */
export const PRICING_PUBLIC = /* groq */ `{
  price,
  priceFrom,
  priceTo,
  priceDisplay,
  currency,
  priceQualifier,
  priceSourceStatus,
  availabilityStatus,
  completionStatus,
  completionDate,
  buildStatus
}`;

/** Public media asset metadata — source provenance fields excluded at query time. */
export const MEDIA_ASSET_PUBLIC = /* groq */ `{
  asset,
  fileAsset,
  assetCategory,
  order,
  altText,
  caption
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
  brochureVisibility
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
    shortDescription
  },
  linkedGolfCourses[]->{
    _id,
    name,
    "slug": slug.current,
    shortDescription
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
  brochureCtaEnabled,
  whatsAppEnabled
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

/** Development card for grids (similar properties manual picks). */
export const DEVELOPMENT_CARD_PUBLIC = /* groq */ `{
  _id,
  _type,
  ghiListingId,
  title,
  "slug": slug.current,
  listingKind,
  developmentDisplayMode,
  developmentStatus,
  location{
    country->{ name, "slug": slug.current },
    location->{ name, "slug": slug.current },
    community->{ name, "slug": slug.current },
    addressDisplay
  },
  pricing${PRICING_PUBLIC},
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
  location{
    country->{ name, "slug": slug.current },
    location->{ name, "slug": slug.current },
    community->{ name, "slug": slug.current },
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

/** Public unit projection for development pages. */
export const UNIT_PUBLIC = /* groq */ `{
  _id,
  unitName,
  unitNumber,
  listingKind,
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
  brochureVisibility,
  content${CONTENT_PUBLIC},
  golf${GOLF_PUBLIC},
  ctas${CTA_PUBLIC},
  related${RELATED_PUBLIC},
  seo${SEO_PUBLIC},
  unitTypes[]->${UNIT_TYPE_PUBLIC},
  units[]->${UNIT_PUBLIC}
}`;

/** Canonical path fields for slug resolution and 301 redirects. */
export const CANONICAL_PATH_FIELDS = /* groq */ `
  "countrySlug": coalesce(location.country->slug.current, location.community->parent->parent->slug.current),
  "locationSlug": coalesce(location.location->slug.current, location.community->parent->slug.current),
  "communitySlug": location.community->slug.current,
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
  brochureVisibility,
  content${CONTENT_PUBLIC},
  golf${GOLF_PUBLIC},
  ctas${CTA_PUBLIC},
  related${RELATED_PUBLIC},
  seo${SEO_PUBLIC},
  unitTypes[]->${UNIT_TYPE_PUBLIC},
  units[]->${UNIT_PUBLIC},
  ${CANONICAL_PATH_FIELDS}
}`;
