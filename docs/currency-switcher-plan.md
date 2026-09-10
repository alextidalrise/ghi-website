# Currency switcher — plan

_Decisions taken 2026-09-09. Step 1 is specified in full below; steps 2–5 are outlined at the
end so step 1 is built in a shape they can extend._

## Decisions (settled, do not re-open)

| # | Question | Decision |
|---|----------|----------|
| D-1 | How converted prices read | Approximate: 3 significant figures, "approx." marker, native price on hover. Native stays in JSON-LD, GA4 items, enquiry emails, meta descriptions. |
| D-2 | Rate source | Vercel cron pulls ECB reference rates daily into a Sanity settings doc; per-rate override in Studio. |
| D-3 | First-visit default | Native currency per listing until the visitor picks; choice in a cookie for a year. No geo-IP. |
| D-4 | Sequencing | Cross-currency sort/filter fix ships first as its own PR (this document's Step 1). |

Constraint behind all of it: public pages are edge-cached as **visitor-invariant** HTML
(`web/src/lib/cache/policy.ts`). Anything per-visitor happens in the browser after hydration.

## Why Step 1 is a live bug, not pre-work

Published `development` dataset, 2026-09-09:

| Currency | Docs |
|---|---|
| EUR | 1,029 |
| AED | 9 — 4 `propertyListing`, 5 `development` |
| null | 15 — all `unit`/`unitType` rows with **no price either**, so harmless |

Three of the four AED properties are `frontline_golf`, so they sit in `/front-line-collection`
today, and all nine flow into the homepage facet rows. Every price comparison in the codebase is
on the raw number with no currency predicate:

- `web/src/lib/sanity/queries/listingSearch.ts:19` `PRICE_NUMERIC` — feeds `price_asc`/`price_desc`
  sorts (L33–34) and the `$minPrice`/`$maxPrice` facets (L113–126).
- `web/src/lib/sanity/queries/listingFacets.ts:51` — the homepage `DiscoveryBar` budget bands
  (`DiscoveryBar.svelte:176`) compare `row.price` against EUR bands.

Effect: AED 3.9m reads as "under €1m"; AED 69.95m sorts as the most expensive thing on the site
when it is roughly €17m. The bug appears wherever `scope: 'global'` is used and will appear on any
country page the moment a second currency enters that country.

---

## Step 1 — cross-currency price coherence (one PR)

Branch `fix/cross-currency-price-sort` from `main`, in a fresh worktree. PR #160
(`feat/country-listing-grid`) touches `listingSearch.ts` (adds a `$location` facet) and
`listingFacets.ts` (removes a country-scoped query). Overlap is a few lines; base on `main` and
rebase after #160 lands rather than waiting for it.

Do not touch: `PriceMenu.svelte` "€" labels, URL params, `priceBandLabel`, `seo.ts`, analytics.
URL params stay canonical EUR by design (Step 4 converts filter *inputs*, not the URL).

### S1-01 Currency enum in Studio

- Today: `sanity/schemas/objects/pricingFields.ts:41-47` and `propertyPricingFields.ts:28-32`
  are bare `type: 'string'`, `initialValue: 'EUR'`, `Rule.max(3)`. `"aed"`, `"Dhs"`, `""` all publish.
- Change:
  - `sanity/schemas/constants/enums.ts`: add
    `CURRENCIES = [{title:'Euro (EUR)',value:'EUR'},{title:'Pound sterling (GBP)',value:'GBP'},{title:'US dollar (USD)',value:'USD'},{title:'UAE dirham (AED)',value:'AED'}] as const`
    mirroring `AREA_UNITS` (L38).
  - Both currency fields: `options: { list: [...CURRENCIES], layout: 'dropdown' }`, keep
    `initialValue: 'EUR'`, drop `Rule.max(3)`. Leave the field optional — the 15 unpriced
    child rows carry no currency and should not start failing validation.
- Done when: dropdown in Studio; `pnpm typegen` passes; existing docs untouched; Studio deployed
  with `pnpm run deploy` (both workspaces — see memory note, **not** `pnpm deploy`).

### S1-02 Guard the formatter

- Today: `web/src/lib/listing/formatPrice.ts:5-14` passes the stored string straight into
  `Intl.NumberFormat`, which throws `RangeError` on a bad code. No test file exists for this module.
- Change: `formatter()` wraps construction in try/catch; on failure return a formatter-like object
  whose `format()` yields `${currency} ${n.toLocaleString('en-GB')}` (or a plain number when the
  code is empty). Cache the fallback too so the try/catch fires once per code.
- Add `web/src/lib/listing/formatPrice.test.ts`: EUR/AED/GBP/USD happy paths, `null` currency
  defaults to EUR, malformed code degrades instead of throwing, `POA` short-circuit, range and
  `from` qualifier cases (these are untested today).
- Done when: tests green; an invalid code renders a degraded price.

### S1-03 Rate module (static for now, replaced in Step 2)

- New `web/src/lib/currency/rates.ts`:
  ```ts
  export const CURRENCIES = ['EUR', 'GBP', 'USD', 'AED'] as const;
  export type Currency = (typeof CURRENCIES)[number];
  /** EUR per 1 unit of currency. Static snapshot — Step 2 sources this from Sanity. */
  export const EUR_PER_UNIT: Record<Currency, number> = { EUR: 1, GBP: …, USD: …, AED: … };
  export const RATES_AS_OF = 'YYYY-MM-DD';
  export function toEur(amount: number, currency: string | null | undefined): number;
  export function rateQueryParams(): { rateGBP: number; rateUSD: number; rateAED: number };
  ```
  Fill the numbers from the ECB reference table on the day the PR is written and record the date.
  AED is USD-pegged (3.6725), so derive it from EUR/USD rather than looking it up separately.
- `toEur` treats unknown/null currency as EUR (matches the formatter's default).
- Keep this module free of Sanity imports so Step 2 can swap the data source without touching
  callers.
- Done when: unit test covers `toEur` for each currency and the null/unknown fallback.

### S1-04 Normalise the search query

- `listingSearch.ts`: replace `PRICE_NUMERIC` with

  ```groq
  coalesce(pricing.price, pricing.priceFrom) * select(
    pricing.currency == "GBP" => $rateGBP,
    pricing.currency == "USD" => $rateUSD,
    pricing.currency == "AED" => $rateAED,
    1
  )
  ```
  Keep the export name so `SORT_ORDER_FRAGMENTS` and `FACET_FILTERS` are unchanged in shape.
  Null currency falls through to the `1` default, which is the EUR assumption the site already makes.
- `listingSearchQueryParams()` (L177): spread `rateQueryParams()` into the returned object. This
  is the single param builder for both `fetchListings.ts` and `featured.ts`, so both get the
  params Sanity requires for every referenced `$name`.
- Sanity evaluates the expression per document at query time; no index, no stored field. With four
  currencies and ~450 candidate rows this is well inside budget. Revisit `priceBase` (UAE plan X-01)
  only if query timings regress.
- Done when: `listingSearch.test.ts` asserts the `select(` fragment appears in both sort fragments
  and both facet branches, and that params carry the three rate keys.

### S1-05 Normalise the homepage facet rows

- `listingFacets.ts:51`: project `"price"` with the identical expression (extract it to a shared
  constant in `listingSearch.ts` or a new `queries/priceNumeric.ts` and import from both files).
- `fetchListingFacetRows()` passes `rateQueryParams()` as query params.
- Also project `"currency": pricing.currency` on the row. Not consumed yet; Step 3 needs it and
  it avoids a second projection change later.
- Done when: `DiscoveryBar` budget bands classify AED rows by their EUR-equivalent; existing
  `listingFacets` tests updated.

### S1-06 Optional: Studio warning when currency does not match market

UAE plan **U-03**. Cheap to add here since the enum lands in the same PR: a document-level warning
when the resolved country is `uae` and currency is not `AED`, or a European country and currency is
not `EUR`. Warning, not error — the AED-in-Spain case is legitimate for some vendors. Skip if it
turns the PR into a schema-plumbing exercise; it is not required for coherence.

### S1-07 Verification

Automated:
- `pnpm test`, `pnpm check` (runs typegen), `pnpm lint` in `web/`.
- New/updated tests in S1-02, S1-03, S1-04, S1-05.

Against real data, from a scratchpad script hitting the `development` dataset with the exact
query + params the app builds:
1. `scope: 'global'`, `sort: 'price_desc'`, no facets — the top of the list should be the ~€19.9m
   Spanish villas, with Four Seasons Residences (AED 69.9m ≈ €17m) a few rows down, not first.
2. `scope: 'global'`, `maxPrice: 1_000_000` — no AED doc returned (the cheapest is AED 1.65m).
3. `scope: 'global'`, `minPrice: 5_000_000, maxPrice: 6_000_000` — Redwood Avenue (AED 22.5m)
   is included alongside the €5–6m EUR listings.
4. Facet rows: Redwood Avenue's projected `price` is ~5.5e6, not 22.5e6.

In the browser (dev server, drafts off with `PREVIEW_ALL_LISTINGS=false`): `/front-line-collection?sort=price_asc`
shows Wildflower/The Sundials/Lime Tree Valley interleaved by EUR-equivalent, with their native
AED price still on the card.

### S1-08 Ship

- Commit message subject: `fix(search): sort and filter prices by EUR-equivalent across currencies`.
- PR body states the nine affected docs, the rate snapshot date, and that display is unchanged.
- After merge: Studio deploy (S1-01), then confirm on `www` (memory note: measure on www, not apex)
  that the front-line collection order matches the scratchpad run. Cache purge is tag-based on
  publish; a deploy invalidates everything anyway.

### Out of scope for Step 1

Display conversion, the switcher UI, currency-aware price-menu bands, the cron and Sanity rates
doc, `priceBase`, and the free-text `priceDisplay` clean-up (ignored whenever a numeric price
exists, which is ~97% of docs).

---

## Later steps (outline)

- **Step 2 — rates in Sanity.** `exchangeRates` singleton settings doc (four rates + `asOf` +
  per-rate `override`), `/api/rates-refresh` route on a daily Vercel cron pulling the ECB reference
  table, rates exposed via root layout data. `rates.ts` from S1-03 reads from layout data instead
  of the static table; `rateQueryParams()` takes the doc as input.
- **Step 3 — client currency store + switcher.** Cookie-backed store modelled on
  `analytics/consent.svelte.ts`; `formatListingPrice` gains a target currency and the approx/rounding
  rules from D-1; the two server-side transforms that bake strings (`insightListingCard.ts`,
  `developmentCardDisplay.ts`) pass raw pricing through instead; switcher in the header and the
  mobile drawer. Native rendered on the server, swapped after hydration.
- **Step 4 — filters in the chosen currency.** `PriceMenu` presets and labels per currency; inputs
  convert to EUR before the URL is built so URLs stay canonical.
- **Step 5 — tests and analytics tidy-up.** Confirm GA4 items still carry native price/currency;
  document the switcher in `docs/analytics.md`.
