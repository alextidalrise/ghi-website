# UAE / Dubai market expansion — plan

**Created:** 2026-07-24 · **Status:** blocked on decisions D-1, D-2, D-3, D-4

Adding a third market (UAE / Dubai) alongside Spain and Portugal. Site went **live 2026-07-23**, so
this work now touches production content and a (very small) live search footprint.

Same conventions as `docs/TODOS.md`: work top to bottom within each epic; mark done only when every
**Done when** line passes. Status: `[ ]` pending · `[~]` in progress · `[x]` done

---

## Context — what already works

The geography model is **country-agnostic by design** and needs no structural change:

- One self-referencing `locationTaxonomy` doc (`sanity/schemas/documents/locationTaxonomy.ts`, Studio
  title "Place") with a `type` discriminator (`country` | `location` | `community`) and a `parent` ref.
  There is no `country` document type and no province/region tier.
- Routes are `/[country]/[location]/[community]/[slug]` — data-driven, no country ever named in code.
- **Nothing is enumerated at build time**: no `generateStaticParams`, no `entries()`, no ISR config.
  New countries appear in the sitemap automatically (`web/src/routes/sitemap.xml/+server.ts`).
- No route matcher or reserved-slug guard exists, but `uae` and `dubai` are both free — no collision
  with `about`, `guides`, `insights`, `partners`, `contact`, `p`/`d`/`u`, `internal`, `api`, etc.
- Analytics is country-**dimensional**, not country-enumerated (`web/src/lib/analytics/item.ts:41`,
  `pageType.ts:56`) — no changes needed.
- Breadcrumbs, canonical paths, JSON-LD and preview paths are all generic.
- Flag artwork degrades gracefully: `CountryFlagArt.svelte:35` falls back to a neutral green field
  until an editor uploads `flag` on the country doc.

**Size/area is already Dubai-ready.** `specsFields.ts:34-40` and `:48-54` store magnitude as `number`
plus a constrained `AREA_UNITS` dropdown (`sqm | sqft`). Display handles it
(`property/KeyFacts.svelte:22`) and JSON-LD emits correct UN/CEFACT codes (`seo.ts:176`). An editor
just picks "Square feet".

**There is no property feed.** No Resales / Kyero / Idealista / MLS integration exists; all listings
are hand-authored in Studio. The agent listing-management team will author UAE listings manually with
human oversight — so **guardrails belong in the schema**, not in an importer.

---

## Open decisions — resolve before building

- [ ] **D-1** Top-level node: **Dubai** or **UAE**? _(with team)_

  The obvious mapping (country=UAE → location=Dubai → community=Jumeirah Golf Estates) puts the whole
  Dubai portfolio on **one** location page, because communities are not standalone URLs:
  `buildTaxonomyPath` returns `null` for them (`web/src/lib/listing/sitemap.ts:38`), breadcrumbs link
  them as `?community=` filters (`breadcrumbs.ts:32`), and filtered views are hard-set `noindex`
  (`web/src/lib/listing/seo.ts:100`).

  That works in Spain because search volume sits at the *location* tier ("Marbella property"). In
  Dubai it sits at the *community* tier ("Jumeirah Golf Estates villas for sale"), which under that
  mapping would be non-indexable.

  **Recommendation: Dubai as the top-level node** (`slug: dubai`), golf communities as *locations* →
  `/dubai/jumeirah-golf-estates/…`. Precedent exists: `promote-algarve-communities-migrate.ts` did
  exactly this reshaping for Portugal. Cost: the `country` tier is really "market", and Abu Dhabi
  later becomes a second market node rather than a sibling location.

  Blocks: D-3, and epics V, W, X.

- [ ] **D-2** Brand positioning: global three-market brand, or Europe + Dubai outpost? _(with team)_

  `docs/Golf Homes International — Keyword Map.md` hardcodes the homepage around *"golf property for
  sale in Spain and Portugal"*. `PRODUCT.md:9` already says "expanding globally"; `soon/+page.svelte:236`
  says "Spain · Portugal · expanding globally".

  **Time-sensitive.** Live since 2026-07-23 means ranking equity is ~zero, so repositioning is
  effectively free *today* and gets more expensive every week. Decide before UAE content is built.

- [ ] **D-3** Abu Dhabi / wider GCC within 12 months? _(with team)_ — materially changes D-1.

- [ ] **D-4** Which Sanity dataset does production serve? — `sanity.config.ts:42-58` defines both
  `production` and `development` workspaces. Prior working assumption was that only `development` was
  in use; **that may be stale now the site is live.** Every seed/migration below must target the
  right one, and will now touch live content. Verify before running anything.

- [ ] **D-5** Does UAE launch block on HubSpot? — CRM is entirely stubbed
  (`web/src/routes/api/newsletter/+server.ts:52` TODO; no portal ID, no form GUID; `docs/TODOS.md`
  J-01…J-03 all open). Either build it, or ship UAE with the same stub Spain/Portugal have.

- [ ] **D-6** Publish Dubai areas in **sq ft** (local convention, matches developer brochures and
  Bayut) or force **m²** for portfolio consistency? Recommendation: author native, display a
  converted secondary value. Schema already supports either.

---

## U. Pre-work — hardening (independent of every decision above)

Do this first. It is worth doing even if UAE never ships, and it is a prerequisite for any non-EUR
listing being entered safely.

- [ ] **U-01** Constrain `currency` to an enum
  - Today: `sanity/schemas/objects/pricingFields.ts:41-47` — bare `type: 'string'`,
    `initialValue: 'EUR'`, validation is `Rule.max(3)` and nothing else. `"aed"`, `"Aed"`, `"AE"`,
    `"DHS"`, `""` are all publishable. Same shape in `propertyPricingFields.ts:28-31`.
  - Add a `CURRENCIES` constant in `sanity/schemas/constants/enums.ts` (`EUR`, `AED`, `GBP`, `USD`)
    and switch both fields to a dropdown, mirroring `AREA_UNITS`.
  - Done when: currency is a dropdown in Studio; existing docs unaffected (all EUR); typegen passes.

- [ ] **U-02** Guard the currency formatter against invalid codes
  - `web/src/lib/listing/formatPrice.ts:5-14` passes the stored string straight into
    `new Intl.NumberFormat('en-GB', { style: 'currency', currency })`, which throws
    `RangeError: Invalid currency code` on anything malformed. **This is a live crash vector** — it
    cannot fire today only because everything defaults to EUR. The first hand-typed bad code takes
    out every card grid and detail page rendering that listing.
  - Wrap `formatter()` in try/catch with a plain-number fallback.
  - Done when: an invalid code renders a degraded price instead of throwing; unit test covers it.

- [ ] **U-03** Studio validation — currency must match the market
  - Risk with a manual authoring team: the path of least resistance against a EUR-defaulted field is
    to type `"AED 3,500,000"` into the free-text `priceDisplay` override (`pricingFields.ts:34-40`)
    and move on. Those listings render fine but become **invisible to price filtering entirely**,
    because `PRICE_FILTERABLE` (`listingSearch.ts:26`) requires `defined(pricing.price)`. Silent and
    very hard to diagnose.
  - Add a document-level rule: warn when the selected community resolves to a UAE/Dubai country node
    but `currency == 'EUR'` (and vice-versa for European markets).
  - Done when: rule fires in Studio as a warning; documented for the listings team.

- [ ] **U-04** Delete dead `BuyerGuideCard.svelte`
  - `web/src/lib/components/home/BuyerGuideCard.svelte` carries `type Guide = 'spain' | 'portugal'`
    (L2) and a two-country flag branch (L66). **Verified unused** — the only occurrence of the name
    outside the file is a code comment at `web/src/routes/api/newsletter/+server.ts:19`.
  - Done when: file deleted; comment reference updated; build + tests pass.

- [ ] **U-05** Fix inconsistent country resolution _(latent data bug)_
  - `web/src/lib/sanity/queries/filters.ts:19` coalesces the stored country ref against the parent
    chain. `listingSearch.ts:73` (`scopeFilter`, `case 'country'`) and
    `web/src/lib/sanity/queries/sitemap.ts:28` use the **stored ref only**.
  - Effect: a listing whose denormalised `location.country` ref is stale resolves at its URL but
    vanishes from country-scoped search *and* from the sitemap. Seeding a new market is exactly when
    refs get written inconsistently.
  - Done when: all three use the same coalesce; regression test with a stale-ref fixture.

- [ ] **U-06** JSON-LD `addressCountry` should be an ISO code
  - `web/src/lib/listing/seo.ts:141` emits the display name ("Spain"); Google expects `ES` / `AE`.
  - Done when: ISO 3166-1 alpha-2 emitted; derived from the country taxonomy doc (needs a field —
    see V-01); `seo.test.ts` updated.

---

## V. Taxonomy, schema and seed _(blocked on D-1, D-4)_

- [ ] **V-01** Add an ISO country code field to country-type `locationTaxonomy` docs
  - Needed by U-06. Field hidden unless `type == 'country'`, same pattern as `flag`
    (`locationTaxonomy.ts:168-176`).

- [ ] **V-02** Extend `COUNTRY_OPTIONS`
  - `sanity/schemas/constants/enums.ts:195-198` — currently `spain` / `portugal`. Value **must** equal
    the country taxonomy slug (see the comment at L193). Drives `guide.ts:43-54` and
    `partner.ts:38-47`; without it no UAE guide or partner can be tagged and the enquiry shelf stays
    permanently empty.
  - Note the model's duality: guides/partners store country as a *plain string slug*; listings store
    it as a *reference*. They are joined only by convention.

- [ ] **V-03** Seed the UAE/Dubai taxonomy tree
  - Follow `sanity/migrations/seed-location-taxonomy.ts` (stable IDs from
    `migrations/lib/placesIds.ts` — `places-${type}-${slug}`).
  - Each location needs a catch-all community (`isCatchAll`, `locationTaxonomy.ts:194-235`) or its
    listings get a 4-segment URL.
  - Done when: tree seeded in the correct dataset (D-4); country page renders; sitemap picks it up.

- [ ] **V-04** Country hero + flag assets
  - Heroes live in `sanity/migrations/assets/locations/` (`country-spain.jpg`, `country-portugal.jpg`)
    and are uploaded by `curated-heroes-migrate.ts:55-62`; its `spain: [...] / portugal: [...]` map at
    L118-119 needs a third entry.
  - Flag SVG uploads to the `flag` field. Until then the neutral green fallback renders.

---

## W. De-hardcode the two-country assumptions _(blocked on D-1)_

- [ ] **W-01** Nav + footer fallbacks
  - `web/src/lib/nav/siteNav.ts:26-32` `FALLBACK_ITEMS`; `web/src/lib/footer/footerContent.ts:18-50`
    `FALLBACK` (one column per country).
  - **`web/src/lib/nav/siteNav.test.ts:6-21` will fail** — it asserts the exact label array and
    `toHaveLength(6)`. This is the only test that genuinely breaks.

- [ ] **W-02** Remove the `'spain'` default bias
  - `web/src/lib/sanity/queries/nav.ts:53` `DEFAULT_PRIMARY_COUNTRY_SLUG`;
    `web/src/lib/components/listing/DiscoveryBar.svelte:85-89` (comment: "Spain is the larger, lead
    portfolio, so it's the default").

- [ ] **W-03** Newsletter guide allowlist
  - `web/src/routes/api/newsletter/+server.ts:29` — `const GUIDES = ['spain','portugal']`. A UAE guide
    request is **silently dropped** (L48-50).

- [ ] **W-04** `BuyerGuides.svelte` — three-country layout
  - `web/src/lib/components/home/BuyerGuides.svelte:27-36` hardcodes `['spain','portugal']` as a
    stamp *pair*, and L44-58 duplicates the flag SVGs instead of using `CountryFlagArt`.
  - Needs the layout rethought for N countries, not just an array extended. Route the flags through
    `CountryFlagArt` while here. `DiscoveryBar.svelte:374-391` has a third copy of the same SVGs.

- [ ] **W-05** Partners page country cards
  - `web/src/routes/partners/+page.svelte:12-13` — hardcoded `/spain` and `/portugal` cards.

- [ ] **W-06** Consolidate duplicated logic surfaced by this work _(optional, do if cheap)_
  - URL building duplicated 3× (`web/src/lib/listing/canonicalPath.ts`, `sanity/lib/previewPaths.ts`,
    `web/src/lib/listing/sitemap.ts` — the latter has its own inline `buildGolfCoursePath`).
  - sqm→m² label logic duplicated 3× (`property/KeyFacts.svelte:22`, `development/KeyFacts.svelte:34`,
    `development/UnitsInventory.svelte:94`).
  - `nav.ts:55` `fetchNavTaxonomy()` fans out one query per country — an N+1 that grows per market.

---

## X. Currency model — cross-country price filtering _(blocked on D-1)_

- [ ] **X-01** Decide and implement a price normalisation strategy

  **Verified problem:** `web/src/lib/sanity/queries/listingSearch.ts` compares
  `PRICE_NUMERIC >= $minPrice` / `<= $maxPrice` inside `FACET_FILTERS` with **no currency predicate**,
  and `SORT_ORDER_FRAGMENTS.price_asc/desc` sort on the same raw number. Invisible today (all EUR).
  With AED at roughly 4:1, a €900k villa and an AED 3.6m villa are the same price but sort three
  places apart, and "under €1m" silently includes AED 3.9m.

  Live cross-country surfaces affected: `/front-line-collection`, homepage featured listings, and the
  planned global frontline index (`docs/TODOS.md` F-04).

  Options, cheapest first:
  1. Scope price filtering to a single country — cheap, but kills filters on the global frontline page.
  2. **Store a normalised `priceBase` (EUR) alongside the display price**, written at publish time
     from a controlled rate. Filter and sort on `priceBase`, display native. *Recommended.*
  3. Live FX at query time — no; re-indexes on every rate move.

  - Done when: cross-country grids sort and filter coherently; native currency still displayed;
    rate source and refresh cadence documented.

- [ ] **X-02** Area-unit tidy-up
  - `web/src/lib/listing/featureHighlights.ts:92` `MEASUREMENT_LABEL` strips `m²`/`sqm`/`hectares`
    from the feature vocabulary but **not `sq ft`** — Dubai measurement blurbs would leak into the
    feature filters.
  - If D-6 lands on "display both", add the conversion at the same time.

---

## Y. Content and SEO _(blocked on D-1, D-2)_

- [ ] **Y-01** UAE buying guide — **launch blocker, not phase 2**
  - `web/src/lib/sanity/queries/enquiryShelf.ts:35` matches `guide.country == $countrySlug`. With no
    UAE guide the enquiry shelf renders **empty on every UAE page** (see the comment at L131).
  - Content does not transfer: Spain/Portugal guides cover NIE/NIF, notaries, IMT, NHR
    (`sanity/fixtures/guides/seed.ts:182+`). UAE needs DLD transfer fee (4%), escrow accounts,
    freehold-zone eligibility for foreign buyers, Golden Visa thresholds, and **no annual property
    tax** — which is a headline selling point, not a footnote.

- [ ] **Y-02** UAE partners — **launch blocker**
  - `enquiryShelf.ts:43` matches `$countrySlug in partner.countries`. At least one UAE-tagged partner
    needed or the shelf stays empty. Seed pattern: `sanity/fixtures/partners/seed.ts`.

- [ ] **Y-03** Off-plan / payment-plan fields
  - Dubai golf property is heavily off-plan and developer-led. The `development` → `unitType` → `unit`
    model actually fits Dubai *better* than Spain, but there are no fields for the standard payment
    structures (60/40, post-handover). `PROPERTY_BUILD_STATUSES` already has `off_plan`.
  - Also consider a freehold/leasehold field — UAE buyers will ask.

- [ ] **Y-04** Copy sweep
  - Fallbacks are concentrated in `web/src/lib/sanity/transforms/pageContent.ts` (L67, 73, 78, 84, 94,
    170, 258, 269, 279, 366). **Sanity-authored values win**, so most of this is CMS entry, with the
    code fallbacks tidied behind it.
  - Component defaults duplicating the same phrasing: `FeaturedLocations.svelte:16`,
    `TrustedPartners.svelte:41`, `GoogleReviews.svelte:25`, `BuyerGuides.svelte:16`.
  - Route-level meta: `+page.svelte:24`, `about/+page.server.ts:22-41` (the `DESTINATIONS` array) and
    `:86`, `about/+page.svelte:29,35,113`, `guides/+page.svelte:19`, `guides/[slug]/+page.svelte:35`,
    `insights/+page.svelte:22,40`, `insights/[slug]/+page.svelte:18`, `partners/+page.server.ts:19`,
    `contact/+page.server.ts:48`, `front-line-collection/+page.server.ts:40`,
    `soon/+page.svelte:81,87,137,236`.
  - Matching strings in `sanity/migrations/seed-page-content.ts` (L78-223) if seeds must stay
    reproducible.

- [ ] **Y-05** Reissue the two-country handoff docs
  - `docs/Golf Homes International — Keyword Map.md` and
    `docs/Golf_Homes_International_Page_Specification.md` (L40 "Country pages 2 (Spain, Portugal)",
    L60, L81-165) are structurally two-country documents. These are what the content team works from.
  - Also update `PRODUCT.md:9` and `DESIGN.md:4`.

- [ ] **Y-06** Seed scripts for reproducibility
  - `seed-header-nav.ts:100-108`, `seed-footer.ts:56` (`COUNTRY_ORDER`),
    `guide-country-migrate.ts:25`, `partner-countries-migrate.ts:34`.

---

## Z. Legal and compliance — **gap, not an extension**

- [ ] **Z-01** Governing law / jurisdiction / international transfers

  This is a pre-existing gap that UAE makes urgent. `web/src/routes/privacy/+page.svelte` (53 lines)
  contains exactly one geographic phrase — "southern Europe and beyond" (L9) — and **no** controller
  location, no international-transfer clause. `terms/+page.svelte` (49 lines) has **no jurisdiction
  clause at all**. `cookies/+page.svelte` has no jurisdiction language.

  Handling EU residents' data in relation to non-EEA property makes this a real exposure.
  **Needs a qualified human, not an engineer.** Treat as a launch blocker.

---

## Test impact

- **Actually breaks:** `web/src/lib/nav/siteNav.test.ts:6-21` (exact label array + `toHaveLength(6)`).
- **Fixture-only, encode the two-country world but won't fail:** `listing/sitemap.test.ts`,
  `queries/featured.test.ts`, `queries/fetchListings.test.ts`, `queries/similar.test.ts`,
  `queries/enquiryShelf.test.ts`, `transforms/golfCourse.test.ts`, `transforms/propertyCard.test.ts`,
  `analytics/item.test.ts`, `analytics/events.test.ts`, `listing/seo.test.ts`,
  `sanity/lib/previewPaths.test.ts`, `sanity/lib/locationFieldsSync.test.ts`.
- **Shared fixtures:** `web/src/lib/sanity/verification/fixture-payloads.ts:18-19`,
  `sanity/fixtures/verification/constants.ts:3,20`.
- CI runs `pnpm --filter web test` only (`.github/workflows/test.yml`) — Sanity tests are not in CI.

---

## Suggested sequencing

1. **Now, unblocked:** epic **U** (hardening). Worth doing regardless; U-01/U-02/U-03 must land before
   any non-EUR listing is entered.
2. **Now, time-sensitive:** resolve **D-2** (positioning) while ranking equity is still ~zero.
3. **On D-1 + D-4:** epic **V** (taxonomy + seed), then **W** (de-hardcode).
4. **Parallel track:** **Y-01/Y-02** (guide + partners) — long lead time, hard launch blockers.
5. **Before any cross-country surface ships with AED:** **X-01**.
6. **Independent, start early:** **Z-01** (legal).
