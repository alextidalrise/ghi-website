# Sanity gating — the five-concept model

The Sanity schema gates publishability with **five fields**. Everything that
used to be a separate enum, boolean, or governance object on a listing has
collapsed into one of these. There is no second visibility flag.

## The five fields

| Field | Type | Purpose |
|---|---|---|
| `status` (top-level) | `draft \| in_review \| published \| unpublished \| archived` | Is this document live on the website? Public site renders ONLY `published`. |
| `pricing.availabilityStatus` | `available \| coming_soon \| under_offer \| reserved \| sold \| withdrawn \| unknown` | Is this unit currently available to buy? Renderer policy decides display. |
| `pricing.priceConfirmed` | boolean | Do we trust the numeric price enough to show it? When false, the public renderer renders `POA`. |
| `reviewItems[]` (top-level) | `{ label, detail?, blocksPublish, category }[]` | What's blocking publish? Each item is either a publish blocker or a non-blocking note. |
| `internal { … }` | object | Categorically private fields (commission, fees & tax, internal notes, source folders, Drive links). GROQ allowlists never project this object. |

## Lifecycle

```
draft ─▶ in_review ─▶ published ─▶ unpublished ─▶ published
                          │             │
                          ▼             ▼
                       archived      archived
```

Editors choose `status` directly. The Studio publish-gate validator refuses to
move `status` to `published` while any `reviewItems[i].blocksPublish === true`.
Untick "Blocks publish" on each item, or resolve them, then publish.

## Inventory display policy

The renderer applies one rule, in one place
([`reservedFilter.ts`](../web/src/lib/sanity/transforms/reservedFilter.ts)):

- `availabilityStatus === 'withdrawn'` → drop from public output entirely.
- `reserved` / `sold` → render as **locked, non-clickable** rows in the
  development inventory table.
- everything else → clickable.

There is no longer a "reserved implies hidden" coupling — taking a listing
offline is a `status` change, not a pricing change.

## How privacy is enforced

Two layers, end to end:

1. **Schema validation** rejects invalid documents in Studio (publish gate;
   pricing sanity).
2. **Server transforms** strip non-public fields from the raw query result
   before it reaches the page (POA fallback when `priceConfirmed === false`,
   inventory display policy, gallery slots without files).

The GROQ filter is a one-line gate that drops non-`published` documents from
public queries. It is mirrored 1:1 by `passesPublicListingGate(doc)` so the
same predicate can run against fixture payloads in tests.

## Out of scope (deliberately)

- Channel / marketing readiness matrix. Reintroduce only when an embargoed
  launch or off-market listing actually happens — and then as a single
  `marketing.release` field with three states (`open` / `embargoedUntil` /
  `private`), not a per-channel matrix.
- An `approvedBy` / `approvedAt` audit trail. Sanity document history
  covers it.
- Data migration of legacy documents. Fresh-slate dev dataset; launch content
  is reauthored under the new model.
- A new permissions model.
- The `golfCourse` workflow. It keeps its own
  `GOLF_COURSE_REVIEW_STATUSES`; revisit after this redesign has shipped.

## See also

- [`sanity/migrations/CHANGELOG.md`](../sanity/migrations/CHANGELOG.md) — every
  removed path / type, plus the one-shot wipe script.
- [`web/src/lib/sanity/verification/privacy-layers.test.ts`](../web/src/lib/sanity/verification/privacy-layers.test.ts) — automated coverage of the two privacy layers.
