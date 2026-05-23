---
title: Sanity CMS Field Mapping
created: 2026-05-21
updated: 2026-05-22
type: reference
status: phase-7-controlled-update
phase: 7
tags: [ghi, sanity, cms, property-listings, website, schema, phase-7]
confidence: medium-high
---

# Sanity CMS Field Mapping

Related plan: [[property-launch-infrastructure-plan]]
Related checklist: [[02-property-launch-system/Access and Testing Checklist]]
Related Phase 5 proposal: [[05-sanity-cms/Benahavis Phase 5 Suggested Schema Revision - 2026-05-22]]
Related Phase 6 review pack: [[05-sanity-cms/Benahavis Phase 6 Schema Review Pack - 2026-05-22]]
Related comment decisions: [[05-sanity-cms/Benahavis Phase 6 Google Docs Comment Review - 2026-05-22]]

## Phase 7 status

This document is now the **working/canonical Sanity CMS field map** after the Phase 5/6 review outcome and follow-up decisions.

Phase 7 converts the review outcome into:

1. A human-readable Sanity field map for GHI content, SEO, intake, and review workflows.
2. A developer-ready schema outline/pseudocode for Sanity implementation planning.
3. Implementation guardrails for public payloads, private/internal fields, and source/intake-only material.

This is still an implementation-planning document, not a live Sanity migration. Do not publish, push schema changes, create public pages, expose private fields, send campaigns, or update CRM records without explicit approval.

## Phase 7 decisions now applied

- **Canonical listing ID:** `GHIXXXXX`.
- **Sanity boundary:** Sanity should be the structured source of truth for public-ready property data and selected private/reporting fields. Google Drive remains the source-file/document repository.
- **Private Sanity fields:** approved, but only if safely excluded from every public payload/query/output.
- **Development template:** needed from day 1.
- **Development modelling:** support `development`, `unit`, and `unitType`; development display can be flat, unit-type led, unit-led, price-from summary, or enquiry-led.
- **Payment schedules:** deferred for v1.
- **Branded asset model:** approved with explicit branding classes: `ghi_branded`, `developer_branded`, `agency_branded`, `third_party_branded`, `unbranded`, `unknown`.
- **Image rights:** default may be `assumed_approved`, with override statuses for restricted, uncertain, or do-not-use assets.
- **Reserved units/items:** hidden from public output entirely.
- **Brochures:** request-only or disabled by default until explicitly approved.
- **Golf:** manual enrichment, supported by lightweight `golfCourse` references.
- **Map privacy:** manual ingestion decision with coordinate privacy value; exact coordinates optional and governed by `mapPrivacyLevel`.
- **Community fees / IBI / garbage tax:** private/internal for v1.
- **Commission:** private/internal, useful for reporting, never public.
- **Legal/cadastral/collaboration/source-sensitive details:** stay in Drive/KB/intake; Sanity may store only safe internal summary flags.
- **CRM scoring / advanced lead matching:** deferred.
- **Localisation and currency localisation:** deferred, but v1 should avoid blocking future localisation.

## Field classification labels

Every field or field group in this document is classified as one of:

- **public** — may be returned to public website pages, SEO metadata, public structured data, public downloads, and customer-facing content when approved.
- **private/internal** — may live in Sanity for operational, reporting, governance, or team workflows, but must never be returned to public pages, SEO metadata, structured data, downloads, feeds, or customer-facing content.
- **source/intake-only** — should remain in Google Drive, the KB, or intake notes; Sanity may store only a safe flag or pointer if needed.
- **deferred** — not in v1 unless reopened by a later implementation decision.
- **rejected** — should not be modelled for public output; may have a private/internal safe flag if operationally useful.

## High-level Sanity model set

### Required / day-1 models

- `propertyListing` — individual villas, apartments, resale properties, and independently marketed child units.
- `development` — multi-unit projects, new developments, schemes with shared identity and amenities.
- `unit` — specific unit/villa/apartment within a development when unit-level display or reporting is needed.
- `unitType` — representative typologies within a development.
- `golfCourse` — lightweight reference docs for manual golf enrichment and future golf SEO clusters.
- `locationTaxonomy` — country, region, municipality, area, sub-area, micro-location hierarchy for breadcrumbs, filters, SEO, and map privacy.
- `mediaAssetMetadata` — asset-level governance for public use, brand status, rights, approval, grouping, alt text, captions, and source references.
- `sourceProvenance` — structured provenance summary for publish-critical facts and internal reporting.
- `readinessStatus` / workflow field group — content status, publish readiness, channel readiness, and blockers.
- `reviewApprovalWorkflow` — human review and approval metadata.

### Optional / support models or objects

- `availabilityTable` / `priceList` — structured unit/development pricing and status support object. Public output must be filtered; reserved rows hidden.
- `enquiryRouting` — routing config for forms/WhatsApp/team handling.
- `featureDefinition` — controlled feature taxonomy, if the frontend needs reusable/filterable feature records.

### Deferred models / modules

- `paymentSchedule` — deferred for v1.
- `crmLeadScoring` / advanced lead matching — deferred.
- Rich multilingual/localised document model — deferred; keep v1 migration-friendly.
- Rich POI/distance matrix automation — deferred.
- Advanced similarity/recommendation engine — deferred.
- Public downloadable price-list module — deferred unless explicitly approved.

## Human-readable field map

### 1. Identity and public reference

- `ghiListingId`
  - Classification: **public**.
  - Type: string.
  - Format: `GHIXXXXX`.
  - Purpose: canonical public/enquiry-facing GHI listing ID.
  - Validation: required for public publish; unique; must match `^GHI[0-9]{5}$` unless the pattern is later extended.

- `internalTitle`
  - Classification: **private/internal**.
  - Type: string.
  - Purpose: internal working title; can include source shorthand but must not be used for slugs or public titles without cleaning.

- `publicTitle`
  - Classification: **public**.
  - Type: string.
  - Purpose: page H1/title.
  - Validation: required for public publish; must be clean of commission, source folder shorthand, raw price hints, and internal notes.

- `slug`
  - Classification: **public**.
  - Type: slug.
  - Purpose: URL slug.
  - Validation: required for public publish; generated from clean public title/location, not raw folder names.

- `listingKind`
  - Classification: **public**.
  - Type: enum.
  - Values: `property`, `development`, `unit`, `unit_type`.
  - Purpose: tells the frontend which template/rendering rules apply.

- `propertyType`
  - Classification: **public**.
  - Type: enum/string.
  - Examples: villa, apartment, penthouse, townhouse, plot, finca, development.

- `transactionType`
  - Classification: **public**.
  - Type: enum.
  - Values: `sale`, `rent`, `short_term`, `other`.

- `sourceReference`
  - Classification: **private/internal**.
  - Type: string.
  - Purpose: source/brochure/developer reference when useful for reporting or lookup.
  - Public rule: do not expose unless separately approved as a public developer reference.

- `developerReference`
  - Classification: **private/internal** by default.
  - Type: string.
  - Public rule: public only if the developer already exposes it and GHI approves display.

- Raw folder names containing commission, internal shorthand, or unreviewed price hints
  - Classification: **rejected** for public modelling; **source/intake-only** as evidence.

### 2. Location and map privacy

- `country`, `region`, `municipality`, `area`, `subArea`, `microLocation`
  - Classification: **public**.
  - Type: references to `locationTaxonomy` or controlled strings during early migration.
  - Purpose: breadcrumbs, filters, SEO landing pages, public display.
  - Validation: required to the level needed for the public page and breadcrumb.

- `addressDisplay`
  - Classification: **public**.
  - Type: string.
  - Purpose: safe public-facing location string.

- `exactAddressInternal`
  - Classification: **private/internal**.
  - Type: string.
  - Public rule: never expose unless manually approved through map/privacy workflow.

- `coordinates`
  - Classification: **private/internal** by default; **public** only through a derived safe map payload governed by `mapPrivacyLevel`.
  - Type: geopoint.
  - Purpose: internal mapping, approximate/exact public display where approved.

- `coordinateSource`
  - Classification: **private/internal**.
  - Type: enum/string.
  - Examples: source brochure, agent supplied, manually geocoded, estimated, unknown.

- `mapPrivacyLevel`
  - Classification: **private/internal governance** controlling public map output.
  - Type: enum.
  - Values: `exact`, `approximate`, `area_only`, `hidden`.
  - Validation: required before public publish if any map/location module appears.
  - Public rule: frontend must use this value to transform or suppress coordinates.

- `mapDisplayApproved`, `mapDisplayApprovedBy`, `mapDisplayApprovedAt`, `publicMapNotes`
  - Classification: **private/internal**.
  - Purpose: approval workflow for coordinate/map use.

- Cadastral/legal-plan location detail
  - Classification: **source/intake-only** and **rejected** for public output.
  - Rule: keep in Drive; Sanity may store only a safe internal flag.

### 3. Pricing and availability

- `price`, `priceDisplay`, `currency`, `priceQualifier`
  - Classification: **public** when source-supported and approved.
  - Types: number/string/enum.
  - Purpose: public price display, cards, feeds, enquiries.
  - Validation: `priceDisplay` must match approved public strategy: exact price, from, guide, POA, reduced, sold, enquiry-led.

- `priceFrom`, `priceTo`
  - Classification: **public** for developments when approved.
  - Type: number.
  - Purpose: development range summaries.

- `priceSourceStatus`
  - Classification: **private/internal**.
  - Type: enum.
  - Suggested values: `source_confirmed`, `folder_hint_only`, `price_list_needs_review`, `manual_confirmed`, `unknown`, `stale_needs_review`.
  - Validation: public price cannot rely on `folder_hint_only`.

- `priceReviewedAt`, `priceReviewedBy`
  - Classification: **private/internal**.

- `availabilityStatus`
  - Classification: **public** for visible listings/units; **private/internal** for hidden/reserved rows.
  - Type: enum.
  - Suggested values: `available`, `coming_soon`, `reserved`, `sold`, `under_offer`, `unknown`, `withdrawn`.
  - Rule: if `reserved`, public output is hidden entirely.

- `publicVisibility`
  - Classification: **private/internal governance** controlling public output.
  - Type: enum.
  - Suggested values: `visible`, `hidden`, `preview_only`, `internal_only`.
  - Validation: reserved units/items must be `hidden` or `internal_only`.

- `completionStatus`, `completionDate`, `buildStatus`
  - Classification: **public** when source-supported and approved.
  - Types: enum/date/string.

- `availabilityTable` / `priceList`
  - Classification: **private/internal** source-of-truth by default; selected rows/summary may become **public** only after filtering and approval.
  - Rule: reserved rows must not be returned to public unit tables, cards, feeds, schema markup, downloads, or SEO copy.

- `communityFeesAmount`, `communityFeesPeriod`, `ibiAmount`, `garbageTaxAmount`, `feesTaxSource`, `feesTaxVisibility`
  - Classification: **private/internal** for v1.
  - Purpose: internal qualification/reporting.
  - Public rule: never expose to public pages, SEO metadata, structured data, downloads, brochures, public API payloads, or customer-facing content unless GHI explicitly changes policy later.

- Detailed payment schedules / stage-payment logic
  - Classification: **deferred**.

### 4. Specifications

- `bedrooms`, `bathrooms`, `builtArea`, `builtAreaUnit`, `plotSize`, `plotSizeUnit`, `terraceSize`, `interiorArea`, `exteriorArea`, `gardenArea`, `levels`, `parkingSpaces`, `garageSpaces`, `pool`, `garden`, `orientation`, `views`
  - Classification: **public** when source-supported and relevant.
  - Types: number/string/enum/array.
  - Validation: required fields vary by listing type. Villas generally need bedrooms, bathrooms, built area, and plot size for public publish. Apartments may use terrace/garden/exterior fields instead of plot size when more accurate.

- Ambiguous area mappings, e.g. apartment garden/exterior area vs plot size
  - Classification: **private/internal review** until resolved; public only after mapping decision.

### 5. Development and unit fields

- `developmentName`, `publicTitle`, `slug`, `developmentStatus`, `buildStatus`, `completionDate`, `developerName`, `architectureStudio`, `developmentComposition`, `sharedAmenities`, `featureHighlights`, `sharedGallery`, `sourceFolderUrl`
  - Classification: mixed:
    - public: title, slug, status/build/completion where approved, developer/architect where source-supported and approved, composition, shared amenities, public gallery.
    - private/internal: source folder references and provenance.

- `developmentDisplayMode`
  - Classification: **private/internal governance** controlling public template behaviour.
  - Type: enum.
  - Values: `flat_listing`, `unit_types`, `units`, `price_from_summary`, `enquiry_led`.
  - Requirement: support from day 1.

- `unitTypes[]`, `units[]`
  - Classification: **public** only for approved visible child records; **private/internal** for reporting/source-of-truth records not ready for display.

- `unitName`, `unitNumber`, `unitTypeName`, `parentDevelopment`, `price`, `availabilityStatus`, `bedrooms`, `bathrooms`, `builtArea`, `terraceSize`, `plotSize`, `floorplan`, `unitGallery`, `unitSpecificNotes`
  - Classification: mixed:
    - public: unit/type display fields if approved and not reserved.
    - private/internal: unit-specific notes, hidden/reserved rows, unreviewed source details.

- Reserved units/items
  - Classification: **private/internal**; **rejected** for public display.
  - Public rule: hidden entirely, not displayed as “reserved”, not included in schema markup, feeds, cards, downloadable tables, SEO metadata, or public API payloads.

### 6. Golf fields

- `golfRelevance`
  - Classification: **public** after manual enrichment/review.
  - Type: enum.
  - Suggested values: `frontline_golf`, `golf_view`, `golf_resort`, `near_golf`, `close_to_golf`, `manual_enrichment_needed`, `none`, `unknown`.

- `linkedGolfCourses[]`, `primaryGolfCourse`
  - Classification: **public** when manually enriched and approved.
  - Type: references to `golfCourse`.

- `golfNotes`, `golfEnrichmentStatus`, `golfEnrichedBy`, `golfEnrichedAt`
  - Classification: **private/internal**.
  - Purpose: manual enrichment workflow.

- `distanceToPrimaryGolfCourse`, `golfView`, `buggyAccess`, `golfMembershipInfo`
  - Classification: **public** only when source-supported/reviewed; otherwise private/internal or omitted.

### 7. Content fields

- `shortDescription`, `heroHeadline`, `aboutDescription`, `longDescription`, `locationDescription`, `golfDescription`, `lifestyleDescription`, `featureHighlights`, `amenities`
  - Classification: **public** after human review.
  - Types: text/rich text/array.
  - Validation: no unsupported investment/scarcity claims; no commission/source/legal contamination; source-supported facts only.

- `investmentDescription`
  - Classification: **public** only if source-supported and approved; otherwise **rejected** for unsupported claims.

- `buyerFitNotes`
  - Classification: **private/internal** by default; may inform CRM/sales workflows, not public copy unless rewritten and approved.

- `humanReviewed`, `reviewer`, `reviewDate`
  - Classification: **private/internal** workflow fields.

- Unsupported investment/scarcity claims
  - Classification: **rejected**.

### 8. Feature taxonomy

Feature objects should support:

- `feature`
  - Classification: **public**.
  - Type: reference or controlled slug.

- `label`
  - Classification: **public**.

- `value`
  - Classification: **public** if safe; private/internal if source uncertainty exists.

- `category`
  - Classification: **public** or internal taxonomy support.
  - Suggested categories: golf, outdoor, interior, community, location, energy, security, wellness, investment.

- `isFilterable`, `isHighlighted`
  - Classification: **public** behaviour fields.

Initial controlled feature vocabulary may include: frontline golf, golf views, private pool, communal pool, gated community, garage, large terrace, underfloor heating, air conditioning, walk to golf, sea views, mountain views, new build, off-plan, key ready, renovated, beachside, close to amenities, security, lift, gym/spa/wellness.

### 9. Media and asset governance

- `heroImage`, `gallery`, `galleryGroups`, `thumbnailOverride`, `floorplans`, `videoUrl`, `virtualTourUrl`
  - Classification: **public** only when selected and approved for public use.

- `brochure`
  - Classification: **private/internal** by default; public/request-only only after approval.

- `brochureVisibility`
  - Classification: **private/internal governance** controlling public behaviour.
  - Values: `disabled`, `request_only`, `public_approved`, `internal_source_only`.
  - Default: `request_only` or `disabled` until approved.

- `imageRightsStatus`
  - Classification: **private/internal governance** controlling public media use.
  - Values: `assumed_approved`, `confirmed_approved`, `needs_review`, `restricted`, `do_not_use`.
  - Default: `assumed_approved` unless evidence says otherwise.

- `publicMediaApproved`, `publicUseApproved`, `approvalStatus`, `approvedBy`, `approvedAt`
  - Classification: **private/internal**.

- `assetBrandingType`
  - Classification: **private/internal governance**; may affect public output.
  - Values: `ghi_branded`, `developer_branded`, `agency_branded`, `third_party_branded`, `unbranded`, `unknown`.
  - Rule: GHI-branded assets can be public once final/approved. Non-GHI branded source assets are internal-only unless explicitly approved. Unbranded assets are preferred for public galleries, subject to usage approval.

- `requiresRebrandOrCrop`, `brandingNotes`, `imageUsageNotes`, `sourceMediaFolderUrl`, `sourceDriveFileId`
  - Classification: **private/internal**.

- `altText`, `caption`, `assetCategory`, `order`, `recommendedCrop`, `focalPoint`
  - Classification: **public** when attached to public assets.

- Legal/source-sensitive PDFs, collaboration contracts, cadastral/legal plans
  - Classification: **source/intake-only**; **rejected** for public asset use.

### 10. Enquiry and CTAs

- `primaryCtaLabel`, `secondaryCtaLabel`, `formIntroText`, `responseTimeText`, `brochureCtaText`
  - Classification: **public**.

- `whatsAppEnabled`, `whatsAppMessageTemplate`, `enquiryRouting`
  - Classification: mixed:
    - public: enabled state and public CTA behaviour.
    - private/internal: actual routing configuration, recipient details, tracking internals.

- `brochureCtaEnabled`
  - Classification: **public** behaviour field, but must obey `brochureVisibility`.

### 11. Related content and SEO

- `similarPropertiesMode`, `manualSimilarProperties`, `similarityTags`, `backLinks`, `supportingArticles`
  - Classification: **public** behaviour/content fields, provided selected related items are public-safe.

- `seoTitle`, `metaDescription`, `openGraphTitle`, `openGraphDescription`, `openGraphImage`, `noindex`, `schemaType`
  - Classification: **public**.
  - Validation: must not include private/internal fields such as commission, fees/taxes, raw source references, exact address, legal/source notes, or reserved-unit data.

- `primaryKeyword`, `secondaryKeywords`, `canonicalCluster`
  - Classification: **private/internal SEO workflow** by default; may inform public metadata/content but need not be exposed as raw fields.

- Advanced recommendation/similarity algorithm fields
  - Classification: **deferred**.

### 12. Source provenance and internal reporting

- `sourceFolderUrl`, `sourceFolderId`, `driveFolderReference`, `sourceFileReferences`, `sourceProvenance[]`, `sourceExtractedAt`, `sourceExtractionMethod`, `sourceConfidence`, `publicSafeStatus`
  - Classification: **private/internal**.
  - Purpose: structured source of truth, reporting, audit, and future updates.
  - Public rule: never expose raw Drive IDs, source links, file paths, extraction notes, or provenance details to public pages or payloads.

- Detailed source documents, legal docs, cadastral plans, collaboration contracts, raw brochures/price lists, operational evidence
  - Classification: **source/intake-only** unless explicitly selected/approved as public assets.
  - Storage: Google Drive and KB/intake notes.

### 13. Sensitive/internal governance

- `sensitiveAssetsPresent`, `sensitiveAssetTypes`, `sensitiveReviewStatus`, `sensitiveReviewApprovedBy`, `sensitiveReviewApprovedAt`, `internalOnlyNotes`, `doNotPublishReason`, `requiresHumanApproval`
  - Classification: **private/internal**.
  - Purpose: safe summary flags and workflow blockers.
  - Public rule: never expose the details or notes publicly.

- `legalDocsPresent`, `legalDocsReviewed`, `legalDocsDriveFolderId`, `legalPublicUseAllowed`
  - Classification: **private/internal**.
  - Default: `legalPublicUseAllowed = false`.

- Collaboration contract details, cadastral/legal-plan contents, commission wording, raw legal/source notes
  - Classification: **source/intake-only** and **rejected** for public output.

### 14. Commission and private financial reporting

- `commissionAmount`, `commissionPercentage`, `commissionCurrency`, `commissionNotes`, `commissionSource`, `commissionVisibility`
  - Classification: **private/internal**.
  - Purpose: Sanity structured source of truth and reporting.
  - Validation: `commissionVisibility` should always be `private_internal` for v1.
  - Public rule: never expose to public pages, APIs, SEO metadata, schema markup, downloads, customer-facing copy, partner-facing content, or public frontend data attributes.

- Commission percentage and “for you” wording as public fields
  - Classification: **rejected**.

### 15. Workflow, review, and readiness

- `contentStatus`
  - Classification: **private/internal**.
  - Suggested values: `draft`, `needs_facts`, `ready_for_editorial`, `ready_for_ghi_review`, `approved`, `published`, `archived`.

- `publishReadiness`
  - Classification: **private/internal**.
  - Accepted baseline values:
    - `metadata_only`
    - `structured_extracted_needs_review`
    - `governance_hold`
    - `ready_for_editorial`
    - `ready_for_ghi_review`
    - `approved_for_publish`
    - `published`
    - `archived`

- `channelReadiness`
  - Classification: **private/internal**.
  - Type: object or array keyed by `website`, `email`, `social`, `crm`, `paid_ads`.

- `factsNeedingConfirmation[]`, `missingSourceFields[]`, `approvalNotes`, `approvedBy`, `approvedAt`, `lastSourceReviewAt`, `doNotPublishReason`
  - Classification: **private/internal**.

- Team approval ownership
  - Rule: any approved team member can approve; capture approver identity and timestamp rather than hard-coding a single owner.

### 16. Deferred / rejected field groups summary

Deferred:

- Detailed payment schedules / stage-payment logic.
- Full multilingual/localisation layer and currency-localised content.
- Advanced CRM scoring / buyer persona scoring / automated lead matching.
- Rich POI/distance matrix automation.
- Advanced property similarity algorithms.
- Public downloadable price-list module.
- Rich golf membership/access data beyond lightweight references and approved notes.

Rejected for public modelling:

- Commission percentage, commission amount, “for you” commission wording.
- Raw folder names containing commission, private shorthand, or unreviewed price hints.
- Collaboration contract details.
- Cadastral/legal-plan contents.
- Detailed legal/source notes.
- Unsupported investment/scarcity claims.
- Reserved-unit rows/cards/statuses in public output.
- Community fees, IBI, and garbage tax in public v1 output.

## Minimum publish-ready field sets

### Basic individual property listing

Required before public publish:

- `ghiListingId` in `GHIXXXXX` format.
- `publicTitle`, `slug`, `listingKind = property`, `propertyType`.
- Location taxonomy sufficient for breadcrumbs/public display.
- `addressDisplay` and `mapPrivacyLevel` decision.
- `price` or approved POA/no-price strategy, `priceDisplay`, `currency`, `priceSourceStatus` not equal to unreviewed folder hint.
- Confirmed `availabilityStatus` that is not hidden/reserved.
- Core specs appropriate to the property type.
- Approved `heroImage`; approved gallery if page UX includes gallery.
- Public-safe media governance: no `do_not_use`/restricted hero; branding/use rules satisfied.
- `shortDescription` and `aboutDescription` reviewed.
- `featureHighlights` reviewed if displayed.
- Golf enrichment reviewed: `golfRelevance`, plus `linkedGolfCourses` only when named course claims/cards are shown.
- No publish-blocking `factsNeedingConfirmation` or `doNotPublishReason`.
- Sensitive/internal review complete.
- `publishReadiness = approved_for_publish`.
- Human approval metadata recorded.
- `seoTitle` and `metaDescription` if required by launch workflow.

### Premium / featured individual property listing

Everything in basic, plus:

- Curated premium hero/gallery and gallery groups.
- Strong curated feature set.
- Reviewed location/golf/lifestyle descriptions.
- Reviewed linked golf courses if named.
- Reviewed SEO keyword cluster and supporting links.
- Optional approved video/floorplans/brochure request module.
- Source/provenance complete for visible premium claims.

### Development record

Required before public development publish:

- `ghiListingId` or development-level canonical ID.
- `developmentName` / `publicTitle`.
- `slug`.
- `listingKind = development`.
- `developmentDisplayMode` selected.
- Location taxonomy and `mapPrivacyLevel`.
- `developerName` if source-supported and approved, or blank/unknown.
- `developmentComposition` and shared amenities/features.
- `priceFrom` / `priceTo` or approved POA/range/enquiry-led strategy.
- `currency`.
- `availabilitySummary` and/or linked private `availabilityTable`.
- `developmentStatus` / `buildStatus` and completion information where relevant.
- Approved shared hero/gallery media.
- Approved brochure/floorplan handling if public modules are enabled.
- At least one linked `unitType` or `unit` if the public template displays unit/type details.
- Source provenance for visible claims.
- Sensitive/internal review complete.
- Human approval metadata.

### Unit or unit-type record

Required when units or typologies are displayed publicly:

- `unitName`, `unitNumber`, or `unitTypeName`.
- `parentDevelopment`.
- `price` or approved status/POA strategy.
- `priceDisplay` if price is public.
- `currency` where price is present.
- `priceSourceStatus`.
- `availabilityStatus` and `publicVisibility`.
- Bedrooms, bathrooms, built area, and relevant terrace/plot/garden fields.
- Floorplan/media group if unit-specific visuals are shown.
- Source provenance for price/specs.
- Public display approval and human review metadata.
- Rule: `availabilityStatus = reserved` means public hidden entirely.

## Developer-ready schema outline / pseudocode

The exact Sanity syntax can be adapted by the developer, but the schema should preserve these boundaries and validation rules.

```ts
// Shared visibility convention
// public: safe for public allowlist queries once approved
// private_internal: stored in Sanity but never returned publicly
// source_intake_only: keep in Drive/KB; Sanity stores only safe pointer/flag
// deferred: not implemented in v1
// rejected_public: never model as public field

type Visibility = 'public' | 'private_internal' | 'source_intake_only' | 'deferred' | 'rejected_public'

document propertyListing {
  ghiListingId: string // public, required, unique, /^GHI[0-9]{5}$/
  internalTitle: string // private_internal
  publicTitle: string // public, required
  slug: slug // public, required
  listingKind: 'property' | 'unit' // public
  propertyType: string // public
  transactionType: 'sale' | 'rent' | 'short_term' | 'other' // public

  sourceReference: string // private_internal
  developerReference: string // private_internal unless approved
  sourceProvenance: sourceProvenance[] // private_internal

  location: locationFields // mixed, public-safe derived values only
  pricing: pricingFields // mixed
  specs: specsFields // public when reviewed
  golf: golfFields // public after manual enrichment
  content: contentFields // public after human review
  media: mediaFields // public after media governance
  ctas: ctaFields // public with private routing config
  seo: seoFields // public, must use public fields only
  workflow: workflowFields // private_internal
  sensitiveGovernance: sensitiveGovernanceFields // private_internal
  privateReporting: privateReportingFields // private_internal
}

document development {
  ghiListingId: string // public/development canonical ID if used
  developmentName: string // public
  publicTitle: string // public
  slug: slug // public
  listingKind: 'development' // public
  developmentDisplayMode: 'flat_listing' | 'unit_types' | 'units' | 'price_from_summary' | 'enquiry_led' // private_internal template control

  location: locationFields
  developmentStatus: string // public when approved
  buildStatus: string // public when approved
  completionDate: date|string // public when approved
  developerName: string // public only if approved
  architectureStudio: string // public only if approved
  developmentComposition: array // public when approved

  priceFrom: number // public when approved
  priceTo: number // public when approved
  currency: string // public
  availabilitySummary: string // public when approved
  availabilityTable: reference availabilityTable // private_internal by default

  unitTypes: reference unitType[] // public filtered
  units: reference unit[] // public filtered; reserved hidden
  sharedAmenities: feature[]
  sharedGallery: mediaAssetMetadata[]
  brochureVisibility: 'disabled' | 'request_only' | 'public_approved' | 'internal_source_only'

  golf: golfFields
  content: contentFields
  seo: seoFields
  workflow: workflowFields
  sensitiveGovernance: sensitiveGovernanceFields
}

document unit {
  unitName: string // public if visible
  unitNumber: string // public only if approved
  parentDevelopment: reference development // public relationship
  publicVisibility: 'visible' | 'hidden' | 'preview_only' | 'internal_only' // private_internal control
  availabilityStatus: 'available' | 'coming_soon' | 'reserved' | 'sold' | 'under_offer' | 'unknown' | 'withdrawn'
  price: number // public only if visible/approved
  priceDisplay: string // public only if visible/approved
  currency: string
  priceSourceStatus: string // private_internal
  specs: specsFields
  floorplan: mediaAssetMetadata // public only if approved
  unitGallery: mediaAssetMetadata[] // public only if approved
  sourceProvenance: sourceProvenance[] // private_internal
  workflow: workflowFields
}

document unitType {
  unitTypeName: string // public
  parentDevelopment: reference development
  publicVisibility: 'visible' | 'hidden' | 'preview_only' | 'internal_only'
  representativePriceFrom: number // public if approved
  priceDisplay: string
  currency: string
  specsRange: object
  floorplans: mediaAssetMetadata[]
  gallery: mediaAssetMetadata[]
  sourceProvenance: sourceProvenance[] // private_internal
}

document golfCourse {
  name: string // public
  slug: slug // public
  location: reference locationTaxonomy // public
  shortDescription: text // public after review
  holes: number // public if known
  par: number // public if known
  designStyle: string // public if known
  websiteUrl: url // public if approved
  coordinates: geopoint // private_internal unless map privacy approved
  media: mediaAssetMetadata[] // public only if approved
  reviewStatus: string // private_internal
}

document locationTaxonomy {
  name: string // public
  slug: slug // public
  type: 'country' | 'region' | 'municipality' | 'area' | 'sub_area' | 'micro_location'
  parent: reference locationTaxonomy
  breadcrumbLabel: string
  seoTitle: string
  metaDescription: string
  publicDescription: text
  mapPrivacyDefault: 'exact' | 'approximate' | 'area_only' | 'hidden'
}

object locationFields {
  country: reference locationTaxonomy
  region: reference locationTaxonomy
  municipality: reference locationTaxonomy
  area: reference locationTaxonomy
  subArea: reference locationTaxonomy
  microLocation: reference locationTaxonomy|string
  addressDisplay: string // public
  exactAddressInternal: string // private_internal
  coordinates: geopoint // private_internal raw coordinate
  coordinateSource: string // private_internal
  mapPrivacyLevel: 'exact' | 'approximate' | 'area_only' | 'hidden'
  mapDisplayApproved: boolean
  mapDisplayApprovedBy: string
  mapDisplayApprovedAt: datetime
  publicMapNotes: string
}

object pricingFields {
  price: number
  priceFrom: number
  priceTo: number
  priceDisplay: string
  currency: string
  priceQualifier: 'exact' | 'from' | 'guide' | 'poa' | 'reduced' | 'enquiry_led'
  priceSourceStatus: 'source_confirmed' | 'folder_hint_only' | 'price_list_needs_review' | 'manual_confirmed' | 'unknown' | 'stale_needs_review'
  priceReviewedAt: datetime
  priceReviewedBy: string
  availabilityStatus: 'available' | 'coming_soon' | 'reserved' | 'sold' | 'under_offer' | 'unknown' | 'withdrawn'
  publicVisibility: 'visible' | 'hidden' | 'preview_only' | 'internal_only'

  // private/internal v1
  communityFeesAmount: number
  communityFeesPeriod: string
  ibiAmount: number
  garbageTaxAmount: number
  feesTaxSource: string
  feesTaxVisibility: 'private_internal'
}

object privateReportingFields {
  commissionAmount: number
  commissionPercentage: number
  commissionCurrency: string
  commissionNotes: text
  commissionSource: string
  commissionVisibility: 'private_internal'
}

object mediaAssetMetadata {
  asset: image|file
  assetCategory: 'hero' | 'gallery' | 'floorplan' | 'brochure' | 'video' | 'render' | 'location' | 'lifestyle' | 'source_document'
  order: number
  altText: string
  caption: string
  assetBrandingType: 'ghi_branded' | 'developer_branded' | 'agency_branded' | 'third_party_branded' | 'unbranded' | 'unknown'
  imageRightsStatus: 'assumed_approved' | 'confirmed_approved' | 'needs_review' | 'restricted' | 'do_not_use'
  publicUseApproved: boolean
  requiresRebrandOrCrop: boolean
  brandingNotes: text // private_internal
  imageUsageNotes: text // private_internal
  sourceDriveFileId: string // private_internal
  sourceMediaFolderUrl: url // private_internal
  approvedBy: string
  approvedAt: datetime
}

object workflowFields {
  contentStatus: 'draft' | 'needs_facts' | 'ready_for_editorial' | 'ready_for_ghi_review' | 'approved' | 'published' | 'archived'
  publishReadiness: 'metadata_only' | 'structured_extracted_needs_review' | 'governance_hold' | 'ready_for_editorial' | 'ready_for_ghi_review' | 'approved_for_publish' | 'published' | 'archived'
  channelReadiness: object
  factsNeedingConfirmation: array
  missingSourceFields: array
  approvalNotes: text
  approvedBy: string
  approvedAt: datetime
  lastSourceReviewAt: datetime
  doNotPublishReason: text
  humanReviewed: boolean
}

object sensitiveGovernanceFields {
  sensitiveAssetsPresent: boolean
  sensitiveAssetTypes: string[]
  sensitiveReviewStatus: string
  sensitiveReviewApprovedBy: string
  sensitiveReviewApprovedAt: datetime
  internalOnlyNotes: text
  requiresHumanApproval: boolean
  legalDocsPresent: boolean
  legalDocsReviewed: boolean
  legalDocsDriveFolderId: string
  legalPublicUseAllowed: boolean // default false
}
```

## Validation and readiness rules

### Hard validation rules

- `ghiListingId` must be unique and match `GHIXXXXX` for public listings.
- Public `slug` must not be generated from raw folder names containing commission, source shorthand, or unreviewed price hints.
- Public price cannot be published when `priceSourceStatus = folder_hint_only`.
- `availabilityStatus = reserved` must force `publicVisibility = hidden` or `internal_only`.
- Reserved units/items must be excluded from public queries, unit tables, cards, schema markup, feeds, downloads, SEO metadata, and customer-facing copy.
- `mapPrivacyLevel` must exist before a map module renders.
- Raw `coordinates` must never be sent directly to public pages without transformation/filtering by `mapPrivacyLevel`.
- `commissionVisibility` must be `private_internal` for v1.
- `feesTaxVisibility` must be `private_internal` for v1.
- Brochure downloads must be disabled or request-only unless `brochureVisibility = public_approved`.
- Any asset with `imageRightsStatus = restricted` or `do_not_use` must be excluded from public output.
- Non-GHI branded assets must not be public unless `publicUseApproved = true`.
- `legalPublicUseAllowed` defaults to false.
- Public SEO fields must be generated only from public-safe fields.

### Publish-readiness gates

A record can reach `approved_for_publish` only when:

- Public identity is complete.
- Location/breadcrumb fields are public-safe and reviewed.
- Map privacy is manually set.
- Price/status/specs are source-supported or intentionally blank/POA/enquiry-led.
- Reserved/hidden child records are filtered.
- Public media is selected and public-use safe.
- Branded assets are approved or excluded.
- Brochure behaviour is request-only/disabled/public-approved as configured.
- Golf enrichment is reviewed enough for the claims shown.
- Public copy and SEO metadata are human reviewed.
- Sensitive/internal review has no unresolved blocker.
- No publish-blocking facts remain.
- Human approver and timestamp are recorded.

## Implementation guardrails

### Public frontend query rule

Public frontend queries must use an explicit **public field allowlist**. Do not query documents with broad projections such as “return everything except known private fields.”

Public allowlists should be defined per template:

- property listing page
- development page
- unit/unit-type component
- card/search result
- map component
- SEO metadata
- schema.org structured data
- downloadable/request-only assets
- feeds/sitemaps

### Private/internal field exclusion rule

The following must never be returned to public pages, SEO metadata, structured data, downloads, feeds, customer-facing content, or public API payloads:

- commission fields and commission notes;
- community fees, IBI, garbage tax, and fee/tax source notes for v1;
- raw source folder IDs, Drive links, file paths, source provenance details, and extraction notes;
- exact address/internal address unless explicitly approved through map privacy;
- raw coordinates unless transformed by the map privacy layer;
- legal/cadastral/collaboration/source-sensitive notes;
- sensitive governance details and internal-only notes;
- `doNotPublishReason` and review notes;
- private approval workflow fields;
- reserved units/items/rows;
- raw price-list rows unless explicitly approved and filtered;
- internal routing details;
- raw folder names or source names containing commission/private shorthand.

### Public payload construction pattern

Recommended developer pattern:

1. Query only public allowlisted fields.
2. Apply readiness filters: `publishReadiness in ['approved_for_publish', 'published']` and `publicVisibility = visible`.
3. Filter child units/availability rows: exclude `reserved`, `hidden`, `internal_only`, and unapproved rows.
4. Transform map data according to `mapPrivacyLevel`:
   - `exact`: return exact coordinate only if approved.
   - `approximate`: return intentionally fuzzed/area coordinate.
   - `area_only`: return location taxonomy/area centroid or no marker.
   - `hidden`: return no map coordinate.
5. Filter media by `publicUseApproved`, `imageRightsStatus`, and `assetBrandingType` rules.
6. Build SEO metadata only from the same public-safe payload.
7. Build schema.org structured data only from public-safe fields.
8. Keep private/internal data available only to authenticated admin/reporting surfaces.

### Example public allowlist sketch

```ts
const PROPERTY_PUBLIC_FIELDS = [
  'ghiListingId',
  'publicTitle',
  'slug',
  'listingKind',
  'propertyType',
  'transactionType',
  'location.country.name',
  'location.region.name',
  'location.municipality.name',
  'location.area.name',
  'location.subArea.name',
  'location.microLocation',
  'location.addressDisplay',
  'location.mapPrivacyLevel', // only for map transform logic
  'pricing.priceDisplay',
  'pricing.currency',
  'pricing.priceQualifier',
  'pricing.availabilityStatus',
  'specs',
  'golf.golfRelevance',
  'golf.primaryGolfCourse.name',
  'golf.linkedGolfCourses[].name',
  'content.shortDescription',
  'content.heroHeadline',
  'content.aboutDescription',
  'content.locationDescription',
  'content.golfDescription',
  'content.featureHighlights',
  'media.heroImage.publicFieldsOnly',
  'media.gallery.publicFieldsOnly',
  'ctas.publicFieldsOnly',
  'seo.seoTitle',
  'seo.metaDescription',
  'seo.openGraphTitle',
  'seo.openGraphDescription',
  'seo.openGraphImage',
]
```

Do not include private/internal field groups in public allowlists.

## Notes for future implementation

- This document should be used to brief the website/Sanity developer before schema implementation.
- The next practical deliverables are likely:
  1. a Sanity schema file draft;
  2. public allowlist query definitions;
  3. validation rules/tests for public payload exclusion;
  4. a property intake template aligned to these fields;
  5. a dry-run JSON payload generator behind approval gates.
- Before any live Sanity schema push, review this map with Alex/James and confirm naming conventions, implementation constraints, and frontend query architecture.
