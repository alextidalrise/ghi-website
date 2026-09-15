# Currency switcher — Step 4 brief: price filters in the selected currency

_Confirmed 2026-09-10. Follows Step 3 (display conversion, PR #167/#168). Mode: Operate._

## Job & audience

An active buyer narrowing a country or location grid who has set the switcher to their own
currency and now expects the **filter** to speak it too — not just the prices on the cards.
Success: they think in £/$/AED, pick a budget, and the right homes appear, without ever
seeing a euro figure they did not ask for.

## The one mechanic

The URL and the GROQ query stay canonically **EUR** — `PRICE_NUMERIC_EUR` normalises every
listing's price to a EUR-equivalent, so `minPrice`/`maxPrice` are always euros. Each price
control gains a thin display layer: it **presents** in the selected currency and **converts
to EUR** before the href is built. Nothing downstream of the URL changes.

Selected currency = the switcher's choice (`getCurrencyOptional().chosen`), never the
listing's own currency. `null` ("as listed") and `EUR` both present in euros — which is
exactly the pre-Step-4 behaviour, so the SSR render is unchanged for everyone and the flip
to £/$/AED only happens post-hydration, after a visitor has interacted. No first-paint flash.

## Three surfaces

1. **Budget bands** (`DiscoveryBar`, homepage + country landing) — a per-currency ladder of
   round edges in the selected currency, each converted to EUR bounds for the query:

   | | Up to | | | | top |
   |---|---|---|---|---|---|
   | **EUR** (default) | €500k | €500k–€1M | €1M–€2M | €2M–€5M | €5M+ |
   | **GBP** | £500k | £500k–£1M | £1M–£2M | £2M–£5M | £5M+ |
   | **USD** | $500k | $500k–$1M | $1M–$2M | $2M–$5M | $5M+ |
   | **AED** | AED 2M | 2M–5M | 5M–10M | 10M–20M | 20M+ |

   AED gets a dirham-scale ladder, not a mechanical ×4 of the euro edges. Band `value` keys
   (`b1`…`b5`) are stable across currencies, so a selection survives a switch. The euro
   ladder's bounds are byte-for-byte the pre-Step-4 ones.

2. **Desktop free min/max** (`PriceMenu`) — inputs typed in the selected currency (a `£`/`$`/
   `€`/`AED` mark adorns each); the trigger label formats the stored EUR back into the
   selected currency. On apply, typed selected → EUR (rounded) into the EUR bindables.

3. **Mobile sheet min/max** (`ListingFilters`) — same conversion and mark; converts on
   apply, and the editable mirror reseeds from the applied EUR values (and on a currency
   switch) so reopening shows a stable figure.

## Round-trip rounding

A visitor types a round number in their currency; we store the converted EUR rounded to 4
s.f. (tidy in a URL), and re-display it rounded to 3 s.f. in the selected currency — so
reopening shows the same figure back, even at an awkward real-world rate. EUR passes through
untouched (exact, as before). Consistent with the feature's "approx." stance; the filter is
a coarse instrument.

## Honesty note

When the selected currency ≠ EUR, the desktop price panel and the sheet's price row carry
one quiet line — _"Approximate — homes are matched on their euro value."_ Absent for
EUR/as-listed (no approximation to disclose).

## Boundaries & constraints

- No-JS degrades to the EUR controls (the switcher is JS-only, so EUR is correct there);
  currency presentation is a pure enhancement. The `PriceMenu` details path commits the
  mirror to EUR on submit under JS, and the named inputs already hold euros without it.
- Analytics `priceBandLabel` keeps logging the **EUR** band — comparable across visitors
  regardless of display currency. No change.
- Reuse existing chrome (`PriceMenu`, `filterControls.css`, the sheet, `DiscoveryBar`) and
  helpers (`convertAmount`, `roundSignificant`, a new `$lib/currency/filterPrice`). No new
  visual world.
- Input `aria-label`s stay meaningful; the symbol marks are decorative (`aria-hidden`).

## Anti-goals

No euro figures shown to a non-EUR visitor; no band-boundary drift as ragged labels; no
second server round-trip or per-visitor SSR; no "approx." marker cluttering the compact
trigger (the note lives in the panel/row only).
