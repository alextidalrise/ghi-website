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

- [ ] **F-01** Decision: manual CMS flag vs `frontline_golf` rule  
  - Done when: decision recorded in this file or CMS field mapping doc

- [ ] **F-02** Frontline listings query + section component  
  - Files: `web/src/lib/sanity/queries/featured.ts`, `FrontlineListings.svelte`  
  - Done when: scoped by country or location; returns ≤8 cards; used on location page

- [ ] **F-03** Featured listings query (if manual flag chosen)  
  - Done when: CMS field exists OR rule-based interim documented; homepage/country can render carousel placeholder

---

## G. Similar properties

- [ ] **G-01** `similarPropertiesQuery` — automatic mode  
  - Done when: same community + property type, exclude current, limit 4, public gates applied

- [ ] **G-02** Manual + tags modes  
  - Done when: respects `seo.similarPropertiesMode`; disabled returns empty

- [ ] **G-03** `SimilarProperties.svelte` on detail page  
  - Done when: section on property template; hidden when mode disabled or zero results

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

- [ ] **I-01** Wire `SiteNav` hrefs to real routes  
  - Done when: Destinations → `/spain` (or country index); no `#` placeholders for primary items

- [ ] **I-02** Optional `+layout.server.ts` taxonomy preload  
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

- [ ] **K-01** Desk structure — taxonomy grouped by type  
  - Files: `sanity/deskStructure.ts`  
  - Done when: countries / locations / communities browsable separately

- [ ] **K-02** Preview URLs → canonical frontend paths  
  - Done when: opening preview from a listing resolves to `/{country}/{location}/{community}/{slug}`

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
