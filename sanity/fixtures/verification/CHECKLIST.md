# Verification fixtures — manual checklist

Three documents in the **`development`** Sanity dataset exercise every privacy gate. Seed them with:

```bash
# After `pnpm exec sanity login` (uses CLI auth), or with an explicit token:
SANITY_API_TOKEN=… pnpm --filter sanity fixtures:seed
```

Point the web app at the development dataset while verifying:

```bash
# web/.env.local
PUBLIC_SANITY_DATASET=development
```

Run automated layer tests anytime:

```bash
pnpm --filter web test:verification
```

---

## Fixture index

| # | Type | GHI ID | Canonical URL |
|---|------|--------|---------------|
| 1 | Property (golden) | `GHI99001` | `/spain/costa-del-sol-verification/verification-community/verification-golden-villa` |
| 2 | Development (privacy) | `GHI99002` | `/spain/costa-del-sol-verification/verification-community/verification-privacy-units` |
| 3 | Property (media) | `GHI99003` | `/spain/costa-del-sol-verification/verification-community/verification-media-privacy` |

Permalinks: `/p/GHI99001`, `/d/GHI99002`, `/p/GHI99003` (301 → canonical).

---

## Layer 1 — Schema validation (Sanity Studio)

Open Studio at `/development` and confirm invalid states are **blocked on save**.

### Golden property (`GHI99001`)

- [ ] Document saves successfully with `publishReadiness = approved_for_publish`
- [ ] Hero image has an uploaded file and alt text
- [ ] Pricing uses `priceSourceStatus = source_confirmed` with a numeric price

### Privacy development (`GHI99002`)

- [ ] Development saves with `priceSourceStatus = folder_hint_only` and `priceDisplay = POA` only (no numeric price fields)
- [ ] Attempting to add `price` or `priceFrom` while `folder_hint_only` → **validation error**
- [ ] Reserved unit (`Villa B`) saves only with `availabilityStatus = reserved` **and** `publicVisibility = hidden`
- [ ] Attempting `reserved` + `visible` on a unit → **validation error**

### Media privacy property (`GHI99003`)

- [ ] Document saves with first gallery slot as placeholder (alt text, no file)
- [ ] Second gallery item has an uploaded file

---

## Layer 2 — GROQ query gates

In Vision (development workspace), run each query. Expect **one row** for publishable fixtures and **zero rows** when gates fail.

### Golden property — should resolve

```groq
*[
  _type == "propertyListing"
  && ghiListingId == "GHI99001"
  && coalesce(workflow.publishReadiness, "") in ["approved_for_publish", "published"]
  && coalesce(pricing.publicVisibility, "visible") == "visible"
  && coalesce(pricing.availabilityStatus, "") != "reserved"
][0]{ publicTitle, "slug": slug.current }
```

- [ ] Returns `Verification Golden Villa`

### Privacy development — parent resolves; reserved unit excluded from public child filter

Parent:

```groq
*[
  _type == "development"
  && ghiListingId == "GHI99002"
  && coalesce(workflow.publishReadiness, "") in ["approved_for_publish", "published"]
  && coalesce(pricing.publicVisibility, "visible") == "visible"
  && coalesce(pricing.availabilityStatus, "") != "reserved"
][0]{ publicTitle, "units": units[]->unitName }
```

- [ ] Returns development title
- [ ] `units` array in raw query includes both unit names (references resolve)

Public child filter (what the transform layer applies):

```groq
*[
  _type == "unit"
  && _id in *[_type=="development" && ghiListingId=="GHI99002"][0].units[]._ref
  && coalesce(workflow.publishReadiness, "") in ["approved_for_publish", "published"]
  && coalesce(pricing.publicVisibility, "visible") == "visible"
  && coalesce(pricing.availabilityStatus, "") != "reserved"
]{ unitName, "availability": pricing.availabilityStatus }
```

- [ ] Returns **only** `Villa A (available)` — reserved unit absent

### Gate failures — should return empty

```groq
*[_type=="propertyListing" && ghiListingId=="GHI99001" && coalesce(workflow.publishReadiness,"") == "metadata_only"][0]._id
```

- [ ] Empty (not approved)

```groq
*[_type=="propertyListing" && ghiListingId=="GHI99003" && coalesce(pricing.availabilityStatus,"") == "reserved"][0]._id
```

- [ ] Empty (reserved top-level listing would not publish — fixture 3 is available; use to confirm filter works)

---

## Layer 3 — Server transforms + rendered page

Start web dev server with `PUBLIC_SANITY_DATASET=development`, then verify each URL.

### Fixture 1 — Golden property

URL: `/spain/costa-del-sol-verification/verification-community/verification-golden-villa`

- [ ] Page returns **200** (not 404)
- [ ] Title shows **Verification Golden Villa**
- [ ] Price displays (~€895,000 or guide price)
- [ ] Hero image renders
- [ ] Gallery shows **1** approved image
- [ ] View source / network: no `priceSourceStatus`, `publicVisibility`, or listing-level map fields in serialized data
- [ ] Community taxonomy (`verificationFixture-community-costa-del-sol`) has `coordinates` set; listing page map shows community area

### Fixture 2 — Privacy development

URL: `/spain/costa-del-sol-verification/verification-community/verification-privacy-units`

- [ ] Page returns **200**
- [ ] Development headline renders
- [ ] Price shows **POA** only — no €650k / €720k range from folder hints
- [ ] Units list shows **Villa A (available)** only
- [ ] **Villa B (reserved)** does not appear anywhere on the page
- [ ] Reserved unit price (€720,000) not visible

### Fixture 3 — Media privacy property

URL: `/spain/costa-del-sol-verification/verification-community/verification-media-privacy`

- [ ] Page returns **200**
- [ ] No hero image rendered (first gallery slot has no uploaded file)
- [ ] Gallery shows **1** image (placeholder slot omitted from public output)

---

## Re-seed / reset

Re-running the seed script is idempotent (stable `_id` values):

```bash
SANITY_API_TOKEN=… pnpm --filter sanity fixtures:seed
```

Dry run (no writes):

```bash
pnpm --filter sanity fixtures:seed -- --dry-run
```

---

## Review items workflow

Open any property listing in **Governance & workflow → Review items**:

- [ ] **Review checklist** shows only `must_check` items with `visibleToReviewer = true`
- [ ] **Internal audit notes** section is collapsed by default and includes `internal_note` / `nice_to_check` items
- [ ] Resolving a checklist item removes it from the array
- [ ] `blocksPublish = true` items prevent `publishReadiness = approved_for_publish`

Migrate legacy string arrays (if any documents pre-date this schema):

```bash
pnpm --filter sanity migrate:review-items:dry-run -- --dataset development
SANITY_API_TOKEN=… pnpm --filter sanity migrate:review-items -- --dataset development
```

Unset legacy media rights / branding governance fields (after schema deploy):

```bash
pnpm --filter sanity migrate:unset-media-rights:dry-run -- --dataset development
SANITY_API_TOKEN=… pnpm --filter sanity migrate:unset-media-rights -- --dataset development
```

Remove obsolete workflow review items (media rights, public-use status, aerial privacy):

```bash
pnpm --filter sanity migrate:prune-media-privacy-review-items:dry-run -- --dataset development
SANITY_API_TOKEN=… pnpm --filter sanity migrate:prune-media-privacy-review-items -- --dataset development
```

Media checklist items should cover gallery order (first image is hero) and alt text only. If intake automation recreates rights/aerial labels, update that pipeline separately.

---

## Automated coverage

`web/src/lib/sanity/verification/privacy-layers.test.ts` asserts the same three fixtures against:

1. Schema validator functions (`validatePricingFields`)
2. Query gate mirror (`passesPublicListingGate`)
3. Transform pipeline (`toPublicPropertyListing`, `toPublicDevelopment`)

All tests must pass before marking this phase complete.
