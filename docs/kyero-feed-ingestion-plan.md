# Kyero V3 feed ingestion — plan

**Created:** 2026-08-05 · **Status:** in progress — D-1 & D-2 resolved, D-3 deferred; Epic 1 dry-run shipped

A prospective partner wants to supply their listings as a **Kyero V3 XML feed** (the de-facto
Spain/Portugal property syndication format — a flat list of `<property>` blocks refreshed on a
schedule at a URL). This plan covers whether and how we ingest that feed into our Sanity model.

Same conventions as `docs/TODOS.md`: work top to bottom within each epic; mark done only when every
**Done when** line passes. Status: `[ ]` pending · `[~]` in progress · `[x]` done.

Related: `docs/Sanity CMS Field Mapping.md` (canonical field map — the target schema), `docs/sanity-gating.md`
(publish gate), `docs/uae-expansion-plan.md` (states "there is no property feed" — **this plan is what
changes that**, so the two should be read together). A visual walkthrough of the reconciliation UI was
sketched at: https://claude.ai/code/artifact/d838ed68-e3fd-4441-8d45-eb4a9db4cb4c

---

## Verdict

**Feasible, no blockers.** The XML parsing is trivial; the real work is (a) reconciling a machine feed
with a model built for hand-curated content, and (b) a modest amount of custom Studio UI. Nothing here
is exotic. We reuse the existing migration-script scaffolding, the existing `reviewItems` / publish
gate, and current Studio (`sanity ^5.31.1`, React 19, `@sanity/ui ^3`).

The single most important framing: **this is two halves.**

```
Backend importer (Node)                          Sanity Studio (browser)
  fetch XML → field-map → value-map      ───►      humans finish + approve
  → upload images → allocate GHI ids               drafts carry review flags;
  → write DRAFT docs + review items                publish gate holds them
```

The importer does **not** run inside Studio — Studio never fetches feeds. Studio is only the surface
where humans resolve what the importer couldn't and give final sign-off.

---

## Context — what already exists (and what doesn't)

**Target model** (from `docs/Sanity CMS Field Mapping.md` and the schemas):

- Closest match to a Kyero `<property>` is the **`propertyListing`** document
  (`sanity/schemas/documents/propertyListing.ts`). New-build stock instead needs the
  **`development` → `unitType` → `unit`** graph (4 document types).
- Sub-objects: `propertyPricingFields` (price, priceDisplay, currency), `specsFields` (bedrooms,
  bathrooms, builtArea/plotSize + units, pool, views…), `locationFields`, `propertyContentFields`,
  `propertyMediaFields`, `mediaAssetMetadata`.
- **`reviewItems` + publish gate already exist**: a document can't publish while a review item has
  `blocksPublish: true`. This is the hook the importer uses to flag unfinished work.

**What is NOT in the repo today:**

- **No feed integration of any kind.** All listings are hand-authored in Studio. `docs/uae-expansion-plan.md`
  explicitly records this; this plan introduces the first importer.
- **No XML parser and no HTTP client** in `sanity/package.json` (only `@sanity/client ^7.14.0`). Both are
  net-new deps for the importer.
- **No GHI id generator.** `ghiListingId` is validated (`^GHI[0-9]{5}$`, `sanity/schemas/validators/rules.ts:58`)
  but assigned by hand / an external pipeline. Uniqueness is **not** schema-enforced. The importer must
  allocate ids itself and hold a stable `kyero-ref → GHI-id` map so re-syncs update rather than duplicate.
- **No i18n.** Content is single-language (English) throughout. Kyero's multi-language description blocks
  collapse to `<en>`; the rest are dropped.
- **No per-listing coordinates.** Map pins were deliberately removed from listings
  (`sanity/migrations/unset-listing-map-fields-migrate.ts`); `coordinates` (geopoint) live only on
  `locationTaxonomy` and `golfCourse`. Kyero's per-property lat/lng has nowhere to land and is dropped —
  listings inherit their community's pin.

**Reusable scaffolding:** the ~65 scripts in `sanity/migrations/` establish the client/token/`--dry-run`/
`--dataset` pattern, image upload (`client.assets.upload`), and upsert (`createOrReplace`). Best template
for the importer: `sanity/fixtures/sample-development/seed.ts`.

---

## Sample feed — murciaservices (checked 2026-08-05)

First real feed: `https://www.propertyportalmarketing.com/xml/murciaservices-kyero.xml` — a standard,
well-formed Kyero V3 feed. Numbers below are measured by the dry-run importer
(`sanity/importers/kyero/dry-run.ts`) against the live feed, not estimated.

- **Shape:** `<root>` / `feed_version` 3 · **209 properties** · all `currency` EUR ·
  `price_freq` = sale ×204 / **month ×5** (5 monthly rentals → `transactionType: rent`).
- **new_build:** 117 off-plan / 92 resale — but every unit is a flat `<property>` (see D-1).
- **Fields present:** `id`, `date`, `ref`, `notes`, `price`, `currency`, `price_freq`, `part_ownership`,
  `leasehold`, `new_build`, `type`, `town`, `province`, `country`, `location/latitude`, `location/longitude`,
  `beds`, `baths`, `video_url` (28%), `surface_area/built`, `surface_area/plot`, `desc/en` + `desc/pl`,
  `features/feature` (optional), `pool`, `images/image` (`id` + `url`), `url/en`.
- **Note the tag names:** description is **`desc`** (not `description`), with `<en>` and `<pl>` (Polish
  usually empty → take `en`). There is a **`notes`** field — treat as agent-internal, never public copy.
- **Region:** Costa Cálida / Costa Blanca South (Murcia + Alicante) — see D-3. **68 distinct towns, none
  in our taxonomy** — mostly golf-resort/urbanisation names (La Torre Golf Resort, La Manga Club, El Valle
  Golf Resort…), with near-duplicates (Serena Golf vs La Serena Golf; Pilar de la Horadada vs Pilar De
  Horadada) that a human must reconcile.

**Data-quality gaps, measured** (the importer must not trust the feed blindly):

- **22% (46/209) have an empty `<type>`** → cannot map to `propertyType`; block + route to queue.
  Other raw types map cleanly (Villa, Apartment, Townhouse, Land - Building Plot, House/Villa).
- **100% have empty `<built>` and `<plot>`** → this feed carries **no surface area at all**; `specs.builtArea`
  / `plotSize` stay empty, flag for review. (Biggest single content gap.)
- `<pool>` empty for **99%** → `specs.pool = unknown` (cannot infer none vs private).
- **~3% (6/209)** have `beds`/`baths` = 0 → leave unset + review, don't publish a false 0.
- **100% have 0/0 or absent coordinates** → confirms per-listing pins are correctly dropped.
- Descriptions carry doubly-escaped entities (`&#13;`) even outside CDATA → sanitise on import (handled).
- Image URLs are **CDATA-wrapped** via an **Optimole CDN**; **3,533 images total** (avg 17, max 50 per
  listing) → each fetched + re-uploaded to Sanity. This is the heaviest runtime cost.

---

## Open decisions — resolve before building

- [x] **D-1 — Resale or new-build stock?** _(resolved for the murciaservices feed, 2026-08-05)_

  Determines the target shape. Individual resale properties → flat **`propertyListing`** (straightforward).
  Off-plan / new developments → the **`development` → `unitType` → `unit`** graph, which is materially more
  importer code (build the parent, children, patch circular refs — see `seed.ts`).

  **Resolved:** the murciaservices feed carries **both** (`new_build` = 0 and 1), but every unit is a flat
  `<property>` — there is no development grouping in the feed. So **ingest everything as `propertyListing`**
  and map `new_build=1` → `specs.buildStatus = off_plan`. No development graph for this partner. Revisit
  only if a future partner supplies genuinely grouped off-plan schemes.

- [x] **D-2 — Auto-publish or editor-approved drafts?** _(resolved 2026-08-05: editor-approved drafts)_

  Our site is hand-curated and human-reviewed; the schema has `humanReviewed` flags and a publish gate
  for exactly this reason. The importer writes **drafts** with blocking review items and an editor
  approves. **Never auto-publish** third-party copy onto our domain. Cost: a human touches each listing once.

- [ ] **D-3 — Where do town→community mappings live?** _(deferred 2026-08-05 — revisit before draft-writing)_

  Not settled yet, so the importer's draft-writing (Epic 1.6–1.7) and the alias field (Epic 2) are on
  hold; the dry-run currently flags every town as unresolved. **Recommendation: in Sanity, as aliases on
  the community.** Add a `sourceAliases: string[]` to
  `locationTaxonomy`; resolving "Estepona → this community" writes the alias, so future syncs resolve it
  automatically and only genuinely new towns ever reach a human. The alternative (a crosswalk config in
  the repo) needs a developer for every new town. Sanity keeps the location decision with the editors who
  make it. Note the taxonomy is **Spain/Portugal-only** today — an out-of-region feed needs the country
  tier extended first.

  **This feed lands in a brand-new region.** The murciaservices towns are **Costa Cálida / Costa Blanca
  South** (Murcia + Alicante provinces) — none of which exist in our taxonomy today (Costa del Sol /
  Algarve only). So the first sync requires **seeding a new Murcia / Costa Cálida location subtree** before
  reconciliation is meaningful. Worse, the feed's `<town>` values mix real municipalities (Torrevieja,
  Torre Pacheco, Pilar de la Horadada) with **golf-resort / urbanisation names** (El Valle Golf Resort,
  Lo Romero Golf, Serena Golf, Altaona Golf, Condado de Alhama) that each need a human parent-community
  decision. **Expect the first sync to be an editorial pass, not a rubber stamp** — this is the real cost
  for this partner, not the parsing.

---

## Architecture — the field/value mapping split

Three stages sit **before** Sanity; drafts are a fourth stage on top.

1. **Field mapping** (static, code) — which XML element → which Sanity field. ~30 fields, set once,
   version-controlled in `kyero-map.ts`. This is the cheap part. See `docs/Sanity CMS Field Mapping.md`
   for the target fields. Clean maps: `price`→`pricing.price`, `beds`→`specs.bedrooms`,
   `surface_area.built`→`specs.builtArea`, `images[].url`→`media.gallery[]` (fetch + upload),
   `id`/`ref`→`sourceReference`.

2. **Value mapping**, two kinds:
   - **Vocabulary** (closed sets, static lookup tables): Kyero `type` → our `propertyType` enum
     (villa/apartment/penthouse/townhouse/plot/finca), `pool` yes/no → our `pool` enum. Extend a table
     when the feed shows a new value. Low cost.
   - **Reference resolution** (needs a human, must persist): town/province → `location.community`. The
     importer resolves via community `sourceAliases`; unknowns go to a queue for a one-time human decision
     (D-3). This is the only recurring human cost, and the alias mechanism makes it *decreasing* over time.

3. **Build draft docs** — write `status: draft` with review items for anything unresolved or requiring
   human judgement (imported copy, unconfirmed price, dropped coordinates).

4. **Editorial review in Studio** — resolve blocking review items, approve, publish (the existing gate).

---

## The Studio UI — native vs custom

Be honest about what's free and what's built:

| Piece | Rests on | Effort |
|---|---|---|
| Drafts + review flags + publish gate | Existing schema (`reviewItems`/`blocksPublish`) + native drafts | **Already exists** |
| Community `sourceAliases` field | One schema field | Trivial |
| "Feed" reconciliation pane (overview, unresolved queue, resolve-a-location) | Sanity **Tool API** (`tools:[]` in `sanity.config`), `@sanity/ui`, `useClient()` | **Bespoke React** — supported, but you build it |
| Read-only field-map view | Tool API / static | Trivial |

The "Feed" tool is real front-end engineering inside the Studio codebase — not a plugin or a config
toggle — but it uses `@sanity/ui` (already a dependency) so it looks native. Crucially, it is **not
required for v1**: the native draft + review-item flow already lets editors resolve locations and approve
listings from the normal document view.

---

## Epic 1 — Importer MVP (native only, no custom UI)

Proves the pipeline end-to-end on machinery we already have. Editors finish listings in the normal
document view via review items.

- [ ] **1.1** Add `xml2js` (or `fast-xml-parser`) + a fetch step to a new `sanity/importers/kyero/` script,
  reusing the migration client/token/`--dry-run`/`--dataset` scaffolding. Refuse `production` by default.
- [ ] **1.2** Parse the feed into normalized intermediate records (still Kyero-shaped).
- [ ] **1.3** `kyero-map.ts` — field map + vocabulary lookup tables (type, pool). Use the real tag names:
  `desc/en` → copy (strip HTML entities, drop `pl`), `notes` → internal only (never public),
  `new_build=1` → `specs.buildStatus = off_plan`, `video_url` → `media.videoUrl`.
- [ ] **1.3a** Defensive value handling for the known data-quality gaps: empty `type` → unresolved
  (review item, no guess); empty `pool` → `unknown`; `beds`/`baths` of 0 → leave unset + review flag;
  0/0 coordinates → ignored (community pin inherited).
- [ ] **1.4** GHI id allocation: query current max `ghiListingId`, increment zero-padded; persist a
  `kyero-ref → GHI-id` map (a dedicated `feedImportMap` doc, or `sourceReference` lookups) so re-syncs
  patch existing docs instead of duplicating.
- [ ] **1.5** Image ingest: for each `<image><url>`, fetch bytes → `client.assets.upload('image', …)` →
  wrap in `mediaAssetMetadata`; record provenance in `sourceFileName`/`sourceMediaFolderUrl`. Skip
  already-uploaded images on re-sync (hash or url-map).
- [ ] **1.6** Location resolution: match `town` against community `sourceAliases`; on miss, attach a
  **blocking** review item ("Assign community for '<town>'") rather than guessing.
- [ ] **1.7** Write `status: draft` docs (`createOrReplace`) with review items: unresolved location
  (blocking), imported copy → review (blocking), dropped coordinates (info).
- [ ] **1.8** Removal handling: listings absent from the feed since last sync → flag (not auto-delete) for
  human decision.

  **Done when:** a sample Kyero feed produces correct draft `propertyListing` docs in `development`
  dataset; images are uploaded; unknown towns and imported copy hold publishing via review items; a
  second run of the same feed updates in place with zero duplicates.

## Epic 2 — Community alias resolution (D-3)

- [ ] **2.1** Add `sourceAliases: string[]` to `locationTaxonomy` (`sanity/schemas/documents/locationTaxonomy.ts`).
- [ ] **2.2** Importer reads aliases during location resolution (1.6).

  **Done when:** resolving a town once (via alias) means the next sync resolves it with no human step.

## Epic 3 — "Feed" reconciliation tool (efficiency layer, after MVP proves out)

Build only once the feed's real quirks are known and the queue is painful enough to justify it.

- [ ] **3.1** Custom Studio Tool (`tools:[]`): **overview** — last sync, new/updated/removed counts,
  "N listings blocked".
- [ ] **3.2** **Unresolved queue** — values grouped by kind (locations, property types), each showing how
  many listings it blocks; batch-resolve one value across all affected listings.
- [ ] **3.3** **Resolve-a-location** view — feed data (read-only) beside match-existing / create-community;
  on save, write the alias (Epic 2) and patch affected drafts.
- [ ] **3.4** Read-only field-map view for transparency.

  **Done when:** an editor can clear a sync's unresolved values from one pane without opening each draft,
  and resolved values never re-prompt.

## Epic 4 — Scheduling & operations

- [ ] **4.1** Decide cadence and host (cron / scheduled function) for the importer against `production`.
- [ ] **4.2** Sync report/log: counts, new drafts, unresolved queue, errors.
- [ ] **4.3** Runbook: how to run a sync, read the report, and clear the queue.

  **Done when:** the feed syncs on schedule to production, always as drafts, with a readable report.

---

## Explicitly out of scope for v1

- Multi-language content (drop non-`<en>` descriptions).
- Per-listing map pins (inherit community pin).
- Auto-publish (D-2: drafts only).
- New-build `development` graph, **unless** D-1 says the stock requires it.
- Multiple partners / multiple feed formats — if this grows, revisit whether a standalone feed-management
  tool (or a SaaS like Channable) earns its keep. For one Kyero V3 partner, it does not.
