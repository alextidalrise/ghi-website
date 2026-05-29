# GHI site build — todos

Bite-sized wiring tasks. Work **top to bottom** within each epic. Mark done only when every **Done when** line passes.

Status: `[ ]` pending · `[~]` in progress · `[x]` done

---

## A. Listing card primitives

Foundation for every grid, carousel, and similar-properties block.

---

## B. Search params (logic only, no UI)

- [x] **B-01** `ListingSearchParams` type + defaults _(2026-05-28)_
- [x] **B-02** `parseListingSearchParams(url)` + `serializeListingSearchParams()` _(2026-05-28)_
- [x] **B-03** Shared filter enum constants in web _(2026-05-28)_
- [x] **B-04** `buildPaginationMeta({ total, page, pageSize })` _(2026-05-28)_
- [x] **B-05** `listingSearchParamsToQueryParams()` for link hrefs _(2026-05-28)_

---

## C. GROQ search layer

- [x] **C-01** Sort order GROQ fragment _(2026-05-28)_
- [x] **C-02** Scope filter fragments (country / location / community) _(2026-05-28)_
- [x] **C-03** Facet filter fragments (propertyType, price range, minBeds, golfRelevance) _(2026-05-28)_
- [x] **C-04** `paginatedListingCardsQuery` _(2026-05-28)_
- [x] **C-05** `listingCardsCountQuery` _(2026-05-28)_
- [x] **C-06** `fetchListingCards()` helper _(2026-05-28)_

---

## D. Wire loaders (grids before filter UI)

- [x] **D-01** Community page — render listing grid with pagination _(2026-05-28)_
- [x] **D-02** Location page — add listings to loader + grid _(2026-05-28)_
- [x] **D-03** Community + location — sort via URL _(2026-05-28)_
- [x] **D-04** Pagination UI component _(2026-05-28)_

---

## E. Filter UI

- [x] **E-01** `ListingFilters.svelte` — property type + beds (URL-driven) _(2026-05-28)_
- [x] **E-02** Price range filter (min/max) _(2026-05-28)_
- [x] **E-03** Golf relevance filter _(2026-05-28)_
- [x] **E-04** Facet counts (optional v1 — static labels OK first) _(2026-05-28 — static labels shipped)_
- [x] **E-05** Homepage discovery bar (navigation only) _(2026-05-28)_

---

## F. Featured / frontline listings

**F-01 decision (2026-05-29):**

- **Frontline spotlight** — use existing `golf.golfRelevance == "frontline_golf"` on publishable `propertyListing` docs. No new CMS field. Developments may carry the same enum but v1 queries stay property-only (same as listing search).
- **Featured carousel** (homepage / hand-picked 6–8) — ordered reference lists on `siteSettings` (homepage) and country `locationTaxonomy` docs. Shipped in F-03.


- [x] **F-03** Featured listings query + UI _(2026-05-29)_
  - CMS: `siteSettings.homepageFeaturedListings` (max 8) + country `featuredListings` (max 6)
  - Files: `web/src/lib/sanity/queries/featured.ts`, `FeaturedListings.svelte`
  - Done when: queries preserve editor order, apply public gates, omit unpublished refs; homepage + country pages render featured grid when picks exist; tests pass

---

## G. Similar properties

- [x] **G-01** `similarPropertiesQuery` — automatic mode _(2026-05-29)_
  - Files: `web/src/lib/sanity/queries/similar.ts` (`automaticSimilarPropertiesQuery`)
  - Done when: same community + property type, exclude current, limit 4, public gates applied

- [x] **G-02** Manual + tags modes _(2026-05-29)_
  - Files: `web/src/lib/sanity/queries/similar.ts`, `web/src/lib/sanity/transforms/similarListingCard.ts`
  - Done when: respects `seo.similarPropertiesMode`; manual preserves order (properties + developments); tags overlap; disabled returns empty

- [x] **G-03** `SimilarProperties.svelte` on detail page _(2026-05-29)_
  - Files: `web/src/lib/components/listing/SimilarProperties.svelte`, property `[slug]/+page.server.ts` / `+page.svelte`
  - Done when: section on property template above enquiry; hidden when mode disabled or zero results

- [x] **G-04** Split similar-properties fields from `seoFields` → `relatedContentFields` _(2026-05-29)_
  - CMS: new `related` object on `propertyListing` + `development`; migration copies `seo.similar*`
  - Files: `sanity/schemas/objects/relatedContentFields.ts`, `sanity/migrations/related-content-migrate.ts`, `web/src/lib/sanity/queries/similar.ts`, allowlists + transforms
  - Done when: Studio shows **Related listings** group with mode-conditional fields; existing docs migrated; similar-properties queries read `related.*`; tests + typegen pass; `backLinks` / `supportingArticles` remain on `seo`

---

## H. SEO plumbing

- [x] **H-01** `sitemap.xml` route _(2026-05-28)_
  - Files: `web/src/routes/sitemap.xml/+server.ts`  
  - Done when: lists publishable listings + taxonomy pages; canonical URLs only; valid XML

- [x] **H-02** `robots.txt` route _(2026-05-28)_
  - Done when: allows `/`; disallows `/internal/`

- [x] **H-03** `RealEstateListing` JSON-LD builder _(2026-05-28)_
  - Files: `web/src/lib/listing/seo.ts`  
  - Done when: built from allowlisted fields; no raw coordinates unless map approved

- [x] **H-04** Inject JSON-LD on property detail page _(2026-05-28)_
  - Done when: breadcrumb + RealEstateListing scripts in `<svelte:head>`

---

## I. Navigation

- [x] **I-01** Wire `SiteNav` hrefs to real routes _(2026-05-29)_
  - Files: `web/src/lib/nav/siteNav.ts`, `SiteNav.svelte`, `web/src/routes/about/+page.svelte`
  - Done when: Destinations → `/spain` (or country index); no `#` placeholders for primary items

- [x] **I-02** Optional `+layout.server.ts` taxonomy preload _(2026-05-29)_
  - Files: `web/src/lib/sanity/queries/nav.ts`, `web/src/routes/+layout.server.ts`, `+page.server.ts`
  - Done when: country list available for nav dropdown OR documented skip if static nav preferred

---

## J. Enquiry / lead capture (parallel track)

- [ ] **J-01** HubSpot env vars + server action skeleton  
  - Done when: form POST hits server action; validates required fields; logs payload in dev

- [ ] **J-02** HubSpot API submission  
  - Done when: successful submission creates/updates contact with `ghiListingId` + page URL

- [ ] **J-03** Replace `EnquiryCta.svelte` stub + WhatsApp link  
  - Done when: form works end-to-end; WhatsApp deep link when enabled

---

## K. Sanity Studio QoL

- [x] **K-01** Desk structure — taxonomy grouped by type _(2026-05-29)_
  - Files: `sanity/deskStructure.ts`  
  - Done when: countries / locations / communities browsable separately

- [x] **K-02** Preview URLs → canonical frontend paths _(2026-05-29)_
  - Files: `sanity/presentation/resolve.ts`, `sanity/lib/previewPaths.ts`, `sanity/sanity.config.ts`, `web/src/hooks.server.ts`, `web/src/lib/sanity/serverClient.ts`, listing + taxonomy preview loaders
  - Done when: opening preview from a listing resolves to `/{country}/{location}/{community}/{slug}`; draft preview via Presentation tool + read token

---

## L. Phase 2 — search index (deferred)

Dedicated search index remains **deferred** — free-text search is not a product requirement for v1. Current implementation uses Sanity-backed, URL-driven filtering via `fetchListingCards()`.

Proceed to a search index only when one or more triggers apply:

- Catalogue exceeds roughly **200–300** publishable listings and filter latency becomes visible
- Dynamic facet counts become essential to the UX (static labels are shipped for v1)
- Non-hierarchical global discovery becomes a product requirement
- Free-text search is requested

- [x] **L-01** Document trigger criteria in this file when approached _(2026-05-28)_

---

## Completed

_Move items here with completion date when done._

- [x] **A-01** `buildListingHref()` utility _(2026-05-28)_
- [x] **A-02** `PublicPropertyCard` type + `toPublicPropertyCard()` transform _(2026-05-28)_
- [x] **A-03** `PropertyCard.svelte` (functional, not polished) _(2026-05-28)_
- [x] **A-04** `ListingGrid.svelte` wrapper _(2026-05-28)_
- [x] **F-01** Frontline vs featured decision — `frontline_golf` rule; featured carousel deferred _(2026-05-29)_
- [x] **F-02** Frontline listings query + `FrontlineListings.svelte` on location page _(2026-05-29)_
- [x] **G-01** Automatic similar properties query _(2026-05-29)_
- [x] **G-02** Manual + tags similar properties modes _(2026-05-29)_
- [x] **G-03** `SimilarProperties.svelte` on property detail _(2026-05-29)_
- [x] **G-04** Split similar-properties fields to `relatedContentFields` _(2026-05-29)_
- [x] **F-03** Featured listings query + `FeaturedListings.svelte` on homepage and country pages _(2026-05-29)_
