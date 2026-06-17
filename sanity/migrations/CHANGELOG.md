# Sanity migrations changelog

A short log of removed schema paths so future debugging has context for
documents that may still carry legacy fields.

## 2026-06-17 — Marketing group cleanup

Trimmed the shared `marketingFields` object (used by `propertyListing` and
`development`) to `marketingDescription` + `keyHooks`, and removed the internal
`enquiryRouting` block from `ctaFields`. None of these were projected to the
public site. The `marketing-cleanup-migrate` script copies the long-form copy to
the renamed field and unsets the retired paths in the dev dataset.

### Renamed field

- `marketing.longFormDescription` → `marketing.marketingDescription`

### Removed schema types

- `marketingChannelNotes` (the `marketing.channelNotes` object: email, social,
  paidAds, crm, brochure)
- `enquiryRouting` (the `ctas.enquiryRouting` object: teamSlug, recipientEmail,
  crmListingKey, trackingCampaign, internalNotes)

### Removed document/object fields

- `marketing.lifestyleAngle`, `marketing.investmentAngle`,
  `marketing.audienceFit`, `marketing.channelNotes`
- `ctas.enquiryRouting`

## 2026-06 — Sanity gating redesign

The publish/visibility/availability model collapsed to five fields:

- `status` (top-level: `draft | in_review | published | unpublished | archived`)
- `pricing.availabilityStatus`
- `pricing.priceConfirmed` (boolean)
- `reviewItems[]` (top-level: `{ label, detail, blocksPublish, category }`)
- `internal {}` (single namespace for commission, fees/tax, notes, source links, Drive folder ids)

Everything below was removed from schema. A one-shot `wipe-legacy-gating-fields`
script unsets these paths from existing documents in the dev dataset.

### Removed schema types

- `workflowFields` (now a tiny module exporting `statusField()` + `reviewItemsField()` helpers)
- `sensitiveGovernanceFields`
- `privateReportingFields`
- `sourceProvenance` (the entries that had value moved into `internal.sources[]` as `internalSourceEntry`)
- `channelReadinessItem`

### Removed enums

`CONTENT_STATUSES`, `PUBLISH_READINESS`, `CHANNEL_KEYS`,
`CHANNEL_READINESS_STATUSES`, `PUBLIC_VISIBILITY`, `PUBLIC_SAFE_STATUSES`,
`SOURCE_CONFIDENCE`, `SOURCE_EXTRACTION_METHODS`, `SENSITIVE_REVIEW_STATUSES`,
`SENSITIVE_ASSET_TYPES`, `COMMISSION_VISIBILITY`, `FEES_TAX_VISIBILITY`,
`REVIEW_SEVERITIES`, `REVIEW_SOURCE_LEVELS`, `PRICE_SOURCE_STATUSES`,
`BROCHURE_VISIBILITY`.

Added: `LISTING_STATUSES`.

### Removed document/object fields

- `workflow.contentStatus`, `workflow.publishReadiness`,
  `workflow.channelReadiness`, `workflow.factsNeedingConfirmation`,
  `workflow.missingSourceFields`, `workflow.approvalNotes`, `workflow.approvedBy`,
  `workflow.approvedAt`, `workflow.lastSourceReviewAt`,
  `workflow.doNotPublishReason`, `workflow.humanReviewed`
- `reviewItem.severity`, `reviewItem.sourceLevel`, `reviewItem.visibleToReviewer`
- `sensitiveGovernance.*` (all sub-fields)
- `privateReporting.*` (collapsed into `internal.commission`)
- `sourceProvenance[].*` (the kept fields — factField, driveFolderUrl,
  extractedAt, notes — moved to `internal.sources[]`)
- `pricing.publicVisibility`, `pricing.priceSourceStatus`,
  `pricing.priceReviewedAt`, `pricing.priceReviewedBy`,
  `pricing.communityFeesAmount`, `pricing.communityFeesPeriod`,
  `pricing.ibiAmount`, `pricing.garbageTaxAmount`,
  `pricing.feesTaxSource`, `pricing.feesTaxVisibility`
- `media.brochureVisibility` (replaced by `media.brochurePublic` boolean)
- `development.brochureVisibility` (top-level alias removed)

### Validators

- `validatePricingFields` slimmed to a numeric sanity check (priceFrom <= priceTo).
- `validatePrivateReportingFields`, `validateFeesTaxVisibility` deleted.
- `validatePublishGate` added: refuses `status = published` while any
  `reviewItems[i].blocksPublish === true`.

### Wipe script

```bash
pnpm --filter sanity wipe:legacy-gating-fields:dry-run -- --dataset development
SANITY_API_TOKEN=… pnpm --filter sanity wipe:legacy-gating-fields -- --dataset development
```
