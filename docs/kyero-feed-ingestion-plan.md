# Kyero V3 feed ingestion — plan

**Created:** 2026-08-05 · **Status:** in progress — D-1, D-2 & D-3 resolved; Epic 1 dry-run shipped.
**Community resolution is owned by external AI agents** (decided 2026-08-14) — this repo's importer just
stores the raw town and blocks until the reference is filled. Draft-writing (Epic 1.6–1.8) unblocked;
Epic 2 reduced to exposing fields; Epic 3 (Studio reconciliation UI) likely superseded.

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

The single most important framing: **three parties, clean seams.**

```
Our importer (Node)          External AI agents        Our editors (Studio)
  fetch XML → field-map   →    read raw sourceTown  →    approve + publish
  → upload images             research + assign          drafts carry review
  → allocate GHI ids          the community              flags; the publish
  → write DRAFT docs          (lives OUTSIDE this repo)  gate holds unresolved
  (raw town kept,                                        drafts back
   community left empty)
```

The importer does **not** resolve town→community and does **not** run inside Studio. It produces
deterministic drafts with the feed's raw `<town>` preserved (`sourceTown`) and the community reference
left empty — which blocks publish. Community assignment is handled by **AI agents that live outside this
project**; our editors give final sign-off in Studio.

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

- [x] **D-3 — Where do feed towns/resorts land in the taxonomy?** _(resolved 2026-08-14)_

  **Decision:** the two provinces — **Murcia and Alicante — become `location` nodes** under Spain
  (indexable browse pages at `/spain/murcia`, `/spain/alicante`). **Every golf resort and town becomes a
  `community`** parented to its province-location. Listings resolve to
  `/spain/{province}/{community}/golf/{slug}`. There is **no region ("Costa Cálida") tier** — the browse-hub
  question is moot.

  **Consequences:**
  - **Province → location is deterministic** (read straight from `<province>`), so only the town/resort →
    community step needs a human. A couple of feed rows carried an ambiguous province and are now pinned
    (2026-08-14): *Pilar de la Horadada* (feed had both Murcia and Alicante) → **Alicante**; *La Finca Golf*
    (feed blank) → **Alicante**. The importer should hard-code these two overrides so re-syncs don't re-ask.
  - **Communities get no indexable page** (`buildTaxonomyPath` returns null below the location tier,
    `web/src/lib/listing/sitemap.ts:39`). Branded resort terms — "La Manga Club", "El Valle Golf Resort" —
    will **not** have their own landing page; the resort name lives only in the listing URL and as a filter
    facet. This is the SEO cost of community-placement over resort-as-location; it's reversible later by
    promoting a specific resort to a `location`, or giving it a `golfCourse` doc (which does get a page).
  - **~58 communities to seed** (see Appendix), each parented to `murcia` or `alicante`. Merge spelling
    variants first (Appendix) so we don't create duplicate communities.
  - The taxonomy was **Spain/Portugal-only** and had **Costa del Sol / Algarve** only — so this still means
    **seeding a new Murcia + Alicante location subtree** under Spain before the first sync's reconciliation
    is meaningful. **Expect the first sync to be an editorial pass, not a rubber stamp.**

  **Who assigns the community (updated 2026-08-14):** not the importer, and not a Studio reconciliation UI —
  **AI agents external to this project** read the stored raw `sourceTown` and assign the community. The
  importer's only job is to preserve the raw string and block publish until the reference is filled. This
  supersedes the earlier "resolve via `sourceAliases` inside the importer" recommendation (see Epic 2/3).

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
   - **Reference resolution** (D-3): `<province>` → `location` is **deterministic** and done by the importer
     (Murcia/Alicante only, plus the two pinned overrides). `<town>`/resort → `community` is **not the
     importer's job** — the raw string is stored verbatim as `sourceTown` and resolved downstream by
     **external AI agents**. The importer leaves the community reference empty and blocks publish until it's
     filled. No alias lookup, no matching, no AI inside the importer.

3. **Build draft docs** — write `status: draft`, storing the raw `<town>` as `sourceTown` and leaving the
   community reference empty (a **blocking** review item until an external agent assigns it). Review items
   also cover imported copy, unconfirmed price, and dropped coordinates.

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

- [x] **1.1** `fast-xml-parser` + fetch in `sanity/importers/kyero/` (`parse.ts`, `import.ts`), reusing the
  migration client/token/`--dataset` scaffolding. Refuses `production`; dry-run is the DEFAULT (`--write` opts in).
- [x] **1.2** `parse.ts` → normalized `KyeroProperty` records (still Kyero-shaped).
- [x] **1.3** `kyero-map.ts` — field map + vocab tables (type, pool, transaction, build status), real tag
  names (`desc/en`, `notes` → internal, `new_build=1` → `off_plan`, `video_url` → `media.videoUrl`).
- [x] **1.3a** Defensive value handling: empty `type` → unresolved (blocking, no guess); empty `pool` →
  `unknown`; `beds`/`baths` 0 → unset + flag; 0/0 coords → ignored (community pin inherited).
- [x] **1.4** GHI id — **left to the external pipeline** (per memory: assigned out-of-repo; uniqueness not
  schema-enforced, so allocating in-repo risks collisions). `ghiListingId` is left unset with a blocking
  review item. Re-sync idempotency instead comes from a stable doc id: `kyero-import-<ref>` (`draftId()`),
  so `createOrReplace` updates in place — no duplicates, no `feedImportMap` doc needed.
- [ ] **1.5** Image ingest — **deferred (next).** Each draft currently carries a blocking "Import media (N
  images not yet ingested)" review item. To build: for each `<image><url>`, fetch → `client.assets.upload`
  → wrap in `mediaAssetMetadata` gallery member; skip already-uploaded on re-sync (url/hash map).
- [x] **1.6** Province → location: `mapProvince()` maps `<province>` → `murcia`/`alicante` (deterministic),
  with the two pinned overrides and a **feed-wide town→province consensus** that backfills blank-province
  rows from the same town's other rows (15 blank/`Spain` rows → 1 genuine residual: *Sucina*, flagged, not
  guessed). Stores raw town + province in `internal.feedImport`; leaves `location.community` empty (native
  block). No town→community matching — external agents do that.
- [x] **1.7** `build-draft.ts` (pure) + `import.ts` (writer) produce `status: draft` docs via
  `createOrReplace`, each with blocking review items: assign community, assign GHI id, review imported copy,
  map type (if unresolved), import media, plus non-blocking specs notes. **Validated in dry-run against the
  live 209-property feed** (`pnpm kyero:import`): 209 drafts, 881 blocking items, `pnpm check` clean. Live
  write (`--write`) is wired but not yet run — awaiting go.
- [ ] **1.8** Removal handling: listings absent from the feed since last sync → flag (not auto-delete) for
  human decision. (Query by `kyero-import-` id prefix vs current feed refs.)

  **Done when:** a sample Kyero feed produces correct draft `propertyListing` docs in `development`
  dataset (✓ shapes validated in dry-run); images are uploaded (1.5, pending); unknown towns and imported
  copy hold publishing via review items (✓); a second run updates in place with zero duplicates (✓ by
  stable id — to confirm live under `--write`).

## Epic 2 — Expose the resolution surface for the external agents (was: alias resolution)

Resolution logic lives outside this repo now; our job is just to give the external agents clean fields to
read from and write into.

- [x] **2.1** Provenance seam added: `internal.feedImport` object on the listing (`internalFields.ts`) with
  `sourceTown` (raw feed `<town>`, verbatim), `sourceProvince` (normalized `murcia`/`alicante`), and
  `importedAt`. Lives inside the `internal` namespace, which GROQ allowlists never project — private by
  construction. Importer writes it; external agents read it. `pnpm check` clean.
- [x] **2.2** Confirmed the block is **native — nothing to build**: `location.community` is `Rule.required()`
  (`locationFields.ts:27`) and the document runs `validatePublishGate` (`propertyListing.ts:199`). An empty
  community therefore cannot publish. Note: `location`/`country` **derive from** the chosen community
  (`LocationFieldsInput` + `locationFieldsSync`), so the importer must NOT pre-write them — the agent picks
  the community and the chain auto-fills. That is why province lives in `feedImport`, not `location`.
- [ ] **2.3** *(optional, the agents' call)* `sourceAliases: string[]` on `locationTaxonomy` — only if the
  external agents want to persist learned town→community mappings in Sanity rather than in their own store.

  **Done when:** the importer stores `feedImport`, an empty community blocks publish (✓ native), and an
  external agent can resolve a draft by writing the community reference (which clears the block).

## Epic 3 — "Feed" reconciliation tool (likely superseded — see note)

**Superseded (2026-08-14):** this bespoke in-Studio queue existed to give humans an efficient way to
resolve town→community. With external AI agents now owning resolution, it is probably unnecessary. Keep it
only as a **manual fallback** for drafts the agents can't confidently resolve — and build it only if that
tail proves painful in practice. The MVP does not need it.

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

---

## Appendix — communities to seed (D-3 resolved)

Generated from the live murciaservices feed on 2026-08-05 (`sanity/importers/kyero/`), merging the
same place written under different provinces. **58 distinct place names**, from **68** raw town+province
combinations. **Per D-3 (resolved 2026-08-14) every place below becomes a `community`** parented to its
province-`location` (Murcia or Alicante). The resort/town split is cosmetic now — both are communities —
and is kept only to show the naming mix. **Merge the spelling variants first** so we don't seed duplicates.

**Merge these spelling variants to one canonical place first** (candidates for `sourceAliases`):
Serena Golf = La Serena Golf · Santa Rosalía Lake & Life Resort = Santa Rosalía Resort ·
La Manga Club ≈ La Manga Club Resort · Pilar de la Horadada = Pilar De Horadada.
One entry — **"Country Club"** — is too vague to place; ask the partner.

### Golf resorts / clubs — 20 places, 104 listings

| Listings | Place | Province |
|---:|---|---|
| 24 | La Torre Golf Resort | Murcia |
| 13 | Santa Rosalía Lake & Life Resort | Murcia |
| 12 | El Valle Golf Resort | Murcia |
| 11 | La Manga Club | Murcia |
| 11 | Serena Golf | Murcia |
| 6 | Peraleja Golf Resort | Murcia |
| 5 | Altaona Golf & Country Club | Murcia |
| 4 | Hacienda del Álamo Golf Resort | Murcia |
| 3 | Roda Golf Resort | Murcia |
| 2 | Corvera Golf Resort | Murcia |
| 2 | La Manga Club Resort | Murcia / Cartagena |
| 2 | Las Colinas Golf & Country Club | Alicante |
| 2 | Mar Menor Golf Resort | Murcia |
| 1 | Country Club | Murcia |
| 1 | Hacienda Riquelme Golf Resort | Murcia |
| 1 | La Finca Golf | Alicante |
| 1 | La Serena Golf | Murcia |
| 1 | Lo Romero Golf | Alicante |
| 1 | Santa Rosalía Resort | Murcia |
| 1 | United Golf | Murcia |

### Towns / areas — 38 places, 105 listings

| Listings | Place | Province |
|---:|---|---|
| 9 | La Manga del Mar Menor | Murcia |
| 9 | Los Alcázares | Murcia |
| 8 | Roldán | Murcia |
| 6 | Pilar de la Horadada | Alicante |
| 6 | San Pedro del Pinatar | Murcia |
| 5 | Avileses | Murcia |
| 5 | Las Terrazas de la Torre | Murcia |
| 5 | Torrevieja | Alicante |
| 4 | Condado de Alhama | Murcia |
| 4 | Torre Pacheco | Murcia |
| 3 | San Miguel de Salinas | Alicante |
| 2 | Balsicas | Murcia |
| 2 | Cabo de Palos | Murcia |
| 2 | Calpe | Alicante |
| 2 | Campoamor | Alicante |
| 2 | Camposol | Murcia |
| 2 | Isla Plana | Murcia |
| 2 | La Manga – Playa Honda | Murcia |
| 2 | Lo Pagán | Murcia |
| 2 | Los Belones | Murcia |
| 2 | San Javier | Murcia |
| 2 | Santiago de la Ribera | Murcia |
| 2 | Sucina | Murcia |
| 2 | Torre de la Horadada | Alicante |
| 2 | Valle del Sol | Murcia |
| 1 | Algorfa | Alicante |
| 1 | Beniel | Murcia |
| 1 | Benijófar | Alicante |
| 1 | Dolores | Alicante |
| 1 | El Carmolí / Los Urrutias | Murcia |
| 1 | Las Lomas | Murcia |
| 1 | Los Montesinos | Alicante |
| 1 | Murcia (city) | Murcia |
| 1 | Pinar de Campoverde | Alicante |
| 1 | Quesada | Alicante |
| 1 | San Cayetano | Murcia |
| 1 | _(blank town)_ | Murcia |
