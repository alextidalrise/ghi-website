# Currency switcher — Step 2 implementation plan

_Live exchange rates. Written 2026-09-10, off `main` (includes #162 Step 1 + #163 the plan).
Branch/worktree: `currency-rates-step2`. Read alongside `docs/currency-switcher-plan.md`
("Step 2 — rates in Sanity")._

## Goal

Replace the static ECB snapshot in `web/src/lib/currency/rates.ts` (`RATES_AS_OF = '2026-09-09'`)
with a **live, editable, daily-refreshed** source, without changing display or the GROQ price
expression. When this ships, sort/filter still compares EUR-equivalents exactly as today — only the
rate numbers now come from Sanity and move each day.

Display conversion, the switcher UI, and currency-aware filters remain **out of scope** (Steps 3–4).
Step 2 is display-invisible: the same pages render identically until a rate actually changes.

## Design decisions (settled here, before coding)

1. **Keep `rates.ts` pure.** It stays free of Sanity imports (the module header promises this). Its
   static table becomes the **fallback**; the pure helpers grow an optional rate-table argument. A
   new `rates.server.ts` does the Sanity read.
2. **Wire rates to query callers via the root layout + `await parent()`**, not via `hooks.server.ts`.
   `hooks.server.ts` ordering is load-bearing and delicate (see its comment about cache/analytics
   ordering); the layout already fetches nav+footer and is the natural place. Page loads that build
   listing queries read `rates` from `await parent()` and pass it down. This matches the plan's
   "`rateQueryParams()` takes the doc as input" and stays explicit and testable.
3. **Purge on change via the existing `nav` tag.** Every page's root layout calls
   `addCacheTags(cacheTag.nav)`, so `nav` is effectively "all pages." A rate change maps to a
   whole-site purge through `nav`. The cron **only purges when a rate actually changed** (no-op on
   weekends/holidays/unchanged fetches) so we don't flush the edge cache needlessly.
4. **Write the published doc to the `development` dataset** — that is what the live site serves
   (memory: `sanity-dataset`). `createOrReplace` the published id, no draft.
5. **Overrides win.** A per-rate manual override in Studio is never overwritten by the cron.

## Why the wiring is the real work

`rateQueryParams()` is a zero-arg pure function called inside two chokepoints:
- `listingSearch.ts:200` — `listingSearchQueryParams()` (feeds `fetchListingCards`/`fetchListings.ts`
  and `featured.ts`).
- `listingFacets.ts:88` — `fetchListingFacetRows()` (homepage `DiscoveryBar` bands).

The moment rates come from a per-request doc, both must receive a rate table, and every route load
that reaches them must supply it. The GROQ itself (`priceNumeric.ts:PRICE_NUMERIC_EUR`) is unchanged —
it already consumes `$rateGBP/$rateUSD/$rateAED`.

---

## Tasks

### S2-01 — `exchangeRates` Sanity singleton

- New `sanity/schemas/documents/exchangeRates.ts`, modelled on `siteSettings.ts`. Fixed id
  `exchangeRates`.
- Fields (one object per non-EUR currency, or a flat set — flat is simpler):
  - `gbpPerEur`, `usdPerEur` — number, "units of currency per 1 EUR" (ECB's own convention, matches
    the private `ECB_PER_EUR` in `rates.ts`). AED is **derived** from USD × the 3.6725 peg, so it is
    not stored unless overridden.
  - `asOf` — date (the ECB publication date the cron wrote).
  - Per-rate override: `gbpOverride`, `usdOverride`, `aedOverride` — nullable numbers (EUR-per-unit,
    the display convention) the cron never touches; when set, they win.
  - `updatedByCron` — datetime, for observability in Studio.
- Register in the schema index and **pin in `deskStructure.ts`** as a singleton (copy the
  `siteSettings` `S.document().schemaType(...).documentId(...)` pattern), with an icon.
- Add `readOnly`/description text so editors understand the cron owns the base fields and overrides
  are the manual lever.
- **Done when:** `pnpm typegen` passes; the doc is a pinned singleton in Studio; deployed with
  `pnpm run deploy` (both workspaces — **not** `pnpm deploy`, memory: `sanity-studio-deploy`).

### S2-02 — Pure rate helpers accept a table (`rates.ts`)

- Introduce `export type RateTable = Record<Currency, number>` (EUR-per-unit).
- Rename the static const to `FALLBACK_EUR_PER_UNIT` (keep `EUR_PER_UNIT` as an alias export so
  nothing breaks) and keep `RATES_AS_OF` as the fallback date.
- `toEur(amount, currency, rates: RateTable = FALLBACK_EUR_PER_UNIT)`.
- `rateQueryParams(rates: RateTable = FALLBACK_EUR_PER_UNIT)` — unchanged shape
  (`{rateGBP, rateUSD, rateAED}`), reads from the table.
- No Sanity import here. Existing callers that pass nothing keep working against the fallback.
- **Done when:** `rates.test.ts` covers the fallback default and an injected table.

### S2-03 — Server rate source (`rates.server.ts`)

- New `web/src/lib/currency/rates.server.ts`:
  - `fetchExchangeRates(): Promise<{ rates: RateTable; asOf: string; source: 'sanity' | 'fallback' }>`.
  - Reads the published `exchangeRates` doc via `fetchPublic` (CDN client, published perspective).
  - Converts stored `gbpPerEur`/`usdPerEur` → EUR-per-unit (`1 / perEur`); derives AED from USD ×
    3.6725; applies any override in place of the derived value.
  - **Fallback:** on missing doc, malformed/zero/negative numbers, or fetch failure, return
    `FALLBACK_EUR_PER_UNIT` with `source: 'fallback'` — never crash a page load over rates.
- **Done when:** unit tests cover doc→table conversion, AED derivation, override precedence, and each
  fallback path.

### S2-04 — Expose rates in root layout, thread to query callers

- `+layout.server.ts`: add `fetchExchangeRates()` into the existing `Promise.all`; return
  `rates` (the `RateTable`) in layout data. `addCacheTags(cacheTag.nav)` already runs here, so the
  rates doc rides the whole-site purge lever; also tag `cacheTag.doc('exchangeRates')` for precision.
- `rateQueryParams` / `listingSearchQueryParams` / `fetchListingCards` / `fetchListingFacetRows` /
  `featured.ts` fns: add an optional `rates?: RateTable` parameter, defaulting to the fallback, and
  pass it through to `rateQueryParams`.
- Route loads that build listing queries read `rates` from `await parent()` and pass it in. Call
  sites to update (from `git grep` on `main`):
  - `web/src/routes/+page.server.ts` — `fetchListingFacetRows()` + featured.
  - `web/src/routes/[country]/+page.server.ts` — `fetchFrontlineListingCards` + grid.
  - `web/src/routes/[country]/[location]/+page.server.ts` — same.
  - `web/src/routes/[country]/[location]/[community]/+page.server.ts` — grid (verify).
  - `web/src/routes/front-line-collection/+page.server.ts` — frontline grid.
  - Any `[country]` search/grid load that calls `fetchListingCards` (audit `fetchListings`/
    `featured`/`fetchFrontline*` callers under `routes/`).
- **Done when:** every listing query in a cacheable route receives request rates; a scratchpad run
  confirms params carry the live numbers, not the static ones.

### S2-05 — Refresh route (`/api/rates-refresh`)

- New `web/src/routes/api/rates-refresh/+server.ts`, auth pattern copied from
  `api/cache-purge/+server.ts` (read secret from `env`, fail loud if unset, reject mismatch):
  - Verify Vercel's cron bearer token: `Authorization: Bearer ${env.CRON_SECRET}`.
  - Fetch the ECB daily XML (`https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`),
    parse `GBP` and `USD` `Cube` entries. Do **not** fetch AED (no ECB rate) — derive it.
  - Compare against the current stored doc; if `asOf` and rates are unchanged, **no-op** (return
    200, `changed: false`, no write, no purge).
  - On change: `createOrReplace` the published `exchangeRates` doc via a **write client** (a
    `withConfig({ token: SANITY_API_TOKEN })` client — the write token, memory: `sanity-token-roles`
    — targeting the `development` dataset; add a small `writeClient.ts` or extend `serverClient`
    setup, but keep stega **off** for writes). Preserve override fields.
  - Then purge: `invalidateByTag([cacheTag.nav])` (guarded by `env.VERCEL_ENV`, like cache-purge), so
    all pages re-render with new params. Return `{ changed: true, asOf }`.
- Failure handling: ECB fetch/parse failure → 502, no write (never overwrite good rates with nulls).
- **Done when:** hitting the route locally with the bearer token updates the doc and reports change;
  unit test covers the parse, AED derivation, and the unchanged no-op.

### S2-06 — Vercel cron

- Add a `crons` array to the **root** `vercel.json` pointing at `/api/rates-refresh`, scheduled after
  ECB's ~16:00 CET publish (e.g. `"schedule": "0 16 * * 1-5"` UTC — confirm against CET/CEST and
  weekend behaviour; a daily run is harmless because the route no-ops when unchanged).
- Verify the cron path resolves against the deployed function tree (the build copies
  `web/.vercel/output` into root `.vercel/output` — check the SvelteKit route surfaces as
  `/api/rates-refresh`).
- **Secrets to provision on Vercel:** `CRON_SECRET`; confirm `SANITY_API_TOKEN` (write) is present and
  scoped to `development`.
- **Done when:** documented in the PR body; cron visible in the Vercel dashboard after deploy.

### S2-07 — Purge mapping (optional precision)

- `nav` from the layout already covers whole-site purge, which is what a rate change needs. No
  `purgeTags.ts` change is strictly required because the cron purges `nav` directly. If a Sanity-side
  webhook edit of `exchangeRates` (a manual override) should also purge, add an `exchangeRates` case
  to `tagsForDoc` → `[cacheTag.nav]`. Recommended, cheap.

### S2-08 — Verification

Automated: `pnpm test`, `pnpm check` (typegen), `pnpm lint` in `web/`; new tests from S2-02/03/05.

Against real data (scratchpad script hitting `development`):
1. Layout `rates` matches the `exchangeRates` doc (or the fallback when the doc is absent).
2. With the doc present, `listingSearchQueryParams` params equal the doc's EUR-per-unit values.
3. Front-line-collection ordering is **identical** to pre-Step-2 with the same numbers, then shifts
   correctly if a rate override is changed in Studio.
4. `/api/rates-refresh` (bearer token) writes the doc, and a second immediate call no-ops.

Browser (dev, `PREVIEW_ALL_LISTINGS=false`): `/front-line-collection?sort=price_asc` order unchanged
vs. `main` on the same rates; native AED prices still on the cards.

### S2-09 — Ship

- Subject: `feat(currency): daily ECB rates in Sanity with cron refresh`.
- PR body: the new doc + cron + secrets, that display is unchanged, and the whole-site purge-on-change
  behaviour. Note override precedence.
- After merge: `pnpm run deploy` (Studio, both workspaces); set Vercel secrets; confirm on **www**
  (memory: `psi-measure-www-not-apex`) that ordering is unchanged, then trigger the cron once and
  confirm the doc + purge.

## Out of scope (Steps 3–5)

Display conversion / rounding / "approx." marker, the switcher UI, cookie-backed client store, the two
server transforms that bake price strings (`insightListingCard.ts`, `developmentCardDisplay.ts`),
currency-aware `PriceMenu` bands, and analytics/GA4 tidy-up.

## Open questions for the human

1. **Cron cadence & timezone** — daily weekday at a fixed UTC hour vs. covering CET/CEST drift.
   (Safe either way because unchanged fetches no-op.)
2. **Override shape** — three nullable override numbers (proposed) vs. a boolean+value pair per
   currency. Nullable numbers are simpler; confirm the editors' mental model.
3. **Whole-site purge acceptability** — a real daily rate change flushes the edge cache site-wide
   (pages rebuild lazily on next view). Acceptable given daily frequency? (The no-op-on-unchanged
   guard keeps it to genuine changes only.)
