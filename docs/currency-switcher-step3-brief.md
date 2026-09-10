# Currency switcher — Step 3 design brief

_Shaped 2026-09-10. Builds on `currency-switcher-plan.md` (D-1..D-4) and Step 2
(`currency-switcher-step2-plan.md`, merged as #164). This is a brief, not a build plan: it
settles what Step 3 is and how it behaves, so the build session can start without re-opening
design questions._

## Decisions added today (D-5..D-7)

| # | Question | Decision |
|---|----------|----------|
| D-5 | Where the control lives | Header bar (a quiet tracked-caps menu left of Contact) and a flat row in the mobile drawer. Nothing beside the prices; no footer control. |
| D-6 | Shape of a converted price | Full grouped tabular figure, rounded to 3 significant figures, with a small "approx." word marker before it. Same-currency prices stay exact with no marker. |
| D-7 | Native-price visibility | Persistent small second line on the detail summaries and unit rows ("Listed at €1,245,000"). Cards reveal it on hover/focus and to screen readers only. |

## 1. Job and audience

Affluent, mostly older buyers browsing from the UK, the Gulf, the US and the eurozone. They
arrive on a card grid or a detail page, see a figure in a currency that is not theirs, and
want to know roughly what it means in their own money without leaving the page or opening a
converter. Visitor mode for this surface: **Operate** — a single, predictable, one-move control
that changes one thing site-wide and stays out of the way.

## 2. Outcome and proof

- Primary action: pick a currency once; every listing price on the site reads in it from then
  on, for a year, on every page, without a reload.
- Success: the visitor stops mentally converting. A GBP buyer scanning the front-line
  collection sees "approx. £1,050,000" on every card, in aligned tabular columns, and on the
  detail page can still see the price they will actually be quoted.
- Proof the surface carries: rates are real (ECB reference rates, dated, refreshed daily by
  Step 2's cron, editor-overridable in Studio) and the date is shown in the control.
- Product truth: converted figures are indicative, never asking prices. The asking price, in
  the listing's own currency, is the only figure that appears in JSON-LD, GA4 items, enquiry
  emails and meta descriptions. That stays true.

## 3. Selected direction

**Visual authority:** the incumbent world (DESIGN.md + the SiteNav surface brief). This is a
local extension of the header, not a new surface; no concept roll.

**Thesis:** the switcher is a fourth nav voice, not a widget. In the bar it is another Light
300 tracked-caps item whose label is the three-letter code; it opens the same deep-green
dropdown the other items use (2px gold top rule, hairline rows, Regular 400 caps, gold = "you
are here"). Prices then change everywhere at once with no page movement.

**Sequence:** bar item → dropdown lists "As listed", EUR, GBP, USD, AED (code + full name) →
pick → dropdown closes, every price on the page swaps, an aria-live line says "Prices shown in
pounds sterling, approximate" → the bar label now reads the chosen code.

**Focal moment:** the swap itself. It must be instant and layout-stable: no reflow, no flash
of the old currency, no skeleton.

**Implementation consequence (the one that shapes the code):** because public HTML is
edge-cached and visitor-invariant, the server cannot render the chosen currency. Rather than
render native and swap after hydration (a visible flash on every page load for a visitor who
has chosen), **pre-render every variant.** A `<Price>` component emits the native figure plus
one hidden variant per currency; a `data-currency` attribute on `<html>`, set by a tiny inline
script that reads the cookie before first paint, selects which variant is visible via CSS.
The cached document stays identical for everyone; the choice is a one-attribute flip; switching
re-renders nothing. The Svelte store (rune class in context, modelled on `ConsentStore`) owns
the cookie write, the attribute flip, the live-region message and the control's own label.
Rates are already in layout data (`data.rates`, `data.ratesAsOf`) and the cache already purges
site-wide when rates change (Step 2's `nav` tag), so baked variants never go stale.

## 4. Scope and boundaries

**In scope — every GHI-inventory price the visitor can see:**

| Surface | Today | Step 3 |
|---|---|---|
| `PropertyCard`, `DevelopmentCard`, `SpotlightCard` (all rails and grids) | render-time string | `<Price>` with hover/focus + sr-only native |
| `PropertySummary` (property detail header) | render-time | converted large, "Listed at €…" second line |
| `development/Summary` ("Prices from") | render-time, duplicates the "From" logic inline | converted, "Listed from €…" second line; share the framing helper |
| `UnitsInventory` (table rows, mobile unit cards, type-group "from", filter chips) | render-time | converted, native small beneath in rows; chips converted only |
| `InsightListingGrid`, `InsightDevelopmentGrid` | **string baked server-side** in `insightListingCard.ts` / `insightDevelopmentCard.ts` | transforms pass the raw `pricing` object through; grid renders `<Price>` |
| Header bar + mobile drawer | — | the control (D-5) |
| `/cookies` policy table | lists `ghi_consent` | add the new preference cookie row |

**Untouched (explicit):**

- `InsightExternalPropertyGrid` `fromPrice` — CMS free text about third-party inventory.
- JSON-LD offers, GA4 item payloads, enquiry emails, meta descriptions — native only.
- `PriceMenu`, `DiscoveryBar` budget bands, sort labels, URL params — Step 4. Known interim
  state: a GBP visitor will see "€500k – €1M" filter labels until Step 4 lands (see §7).
- GROQ, query params, Step 2's cron and Sanity doc.
- The nav's CMS-authored menu model; the switcher is code, not a Sanity nav item.

**Anti-goals:** no geo-IP guess, no flag icons in the bar (the flag stamp vocabulary means
"country", not "currency"), no currency in the URL, no per-page toggle, no animation on the
swap, no tooltip component for the marker, no rounding of same-currency figures.

## 5. States and ranges

- **Unchosen (first visit, no cookie):** every price native; bar label reads `CURRENCY`;
  "As listed" is the active menu row.
- **Chosen:** bar label is the code (`GBP`); that row is active; all prices convert except those
  already in the chosen currency, which stay exact and unmarked.
- **Same-currency listing under a chosen currency:** exact, no marker, no second line.
- **Converted single price:** `approx. £1,050,000`. Qualifier prefixes stay in front:
  `From approx. £412,000`, `Guide approx. £…`.
- **Converted range:** `approx. £890,000 – £1,320,000` (each end rounded independently).
- **POA / free-text `priceDisplay` / no price:** unchanged, no marker, no second line.
- **Rounding:** 3 significant figures, half-up, on the converted amount; grouped with the
  existing en-GB `Intl` formatter (so USD renders `US$`, AED renders `AED`, as today).
- **Rates missing or fallback:** Step 2 guarantees a table always exists (static snapshot as
  last resort); the control still works and the dated line shows the snapshot date.
- **JS off / before hydration:** native prices, no control in the bar (it is a `<noscript>`
  no-op), drawer row absent. Nothing broken, nothing misleading.
- **Ranges of data:** grids 12–48 cards, unit tables up to ~120 rows × 5 variants each — still
  a few KB of extra HTML; acceptable and cached.

## 6. Interaction and layout

**Bar item.** Sits between the last editorial link and Contact. Same type as the other links
(Light 300, 0.8125rem, 0.14em, `--on-green`), label plus the existing small chevron; opens on
click/focus like a dropdown item, closes on outside click, Escape, or selection. Rows: `AS
LISTED`, `EUR — EURO`, `GBP — POUND STERLING`, `USD — US DOLLAR`, `AED — UAE DIRHAM`, in the
dropdown's Regular 400 / 0.1em caps on hairline rows; the active row takes the gold "you are
here" ink and marker. Beneath a hairline, one `--text-small` line in `--on-green`:
"Converted prices are approximate · ECB rates 9 Sep 2026" (date from `data.ratesAsOf`).
Semantics: a menu button (`aria-haspopup="menu"`, `aria-expanded`) with `menuitemradio` rows;
arrow keys move, Enter/Space select, focus returns to the button.

**Bar width budget.** The bar must keep its full form at 1280px (80rem); the drawer must not
take over 13-inch laptops. Today's menu needs ~1235px; the new item adds ~80px. The builder
measures and closes the gap with the existing levers in order: trim per-link side padding
(1.15rem → 1rem saves ~35px across the row), then shorten the unchosen label from `CURRENCY`
to `PRICES` if still needed. The breakpoint moves only as far as measurement requires, CSS and
`matchMedia` mirrored, per the SiteNav brief's rule.

**Drawer.** A flat section between the editorial items and the pinned Contact footer: an ivory
overline `SHOW PRICES IN`, then one row of five `aria-pressed` segments `AS LISTED · EUR · GBP ·
USD · AED` in the drawer's Regular 400 caps, 44px tall, active in gold. No accordion (the
drawer keeps two interactive tiers). Selecting does not close the drawer.

**Price component.** Native and converted variants stacked in one inline element; the visible
one is chosen by `html[data-currency]`. Marker "approx." is `--text-small`, `--muted` on white
(or `--on-green` at reduced size on green), set before the figure with a thin space; the figure
keeps `tnum`. On cards the native price is a `title`/`aria-describedby` ("Listed at
€1,245,000"). On summaries and unit rows it is a visible `--text-small --muted` line directly
beneath. Focus-visible on a card shows the same hint as hover (keyboard parity).

**Feedback.** No motion. One polite live-region sentence on change. The bar label changing is
the persistent confirmation.

**Responsive.** Card grids already set prices in tabular numerals; the full-figure form (D-6)
keeps columns aligned on every breakpoint. The two-line summary price must not push the
enquiry rail's sticky offset; check the property and development summary at 390px and 1280px.

## 7. Constraints and open decisions

**Binding constraints**

- Visitor-invariant HTML: the server never reads the currency cookie. Setting the cookie must
  not add a `set-cookie` header to any page response (it is written client-side only).
- Cookie: name `ghi_currency`, value one of `EUR|GBP|USD|AED`, `path=/`, one year, `samesite=lax`,
  `secure` on https. A preference cookie set only on explicit action; add it to the `/cookies`
  table with that rationale. It is not analytics and needs no consent gate.
- Store: rune class held in Svelte context, created in the root layout, cookie read on mount
  (or by the pre-paint script) — never at module level (the `ConsentStore` comment explains
  why: shared server module state would leak one visitor's choice to the next).
- Zero radius, 1px rules, gold as state only, one green object (bar + panels), AA contrast for
  the marker and the second line on both white and green.
- Reduced motion already honoured by the dropdown; nothing new animates.
- `formatListingPrice` stays the single formatting choke point; it gains `{ to, rates }` and
  returns structured parts (marker, figure, native) rather than a second string-sniffing layer.
  `developmentCardDisplay.ts` and `development/Summary.svelte` stop inspecting the formatted
  string.
- Tests: rounding table (3 s.f. incl. 999,500 → 1,000,000 edge), same-currency passthrough,
  range/qualifier framing, POA passthrough, `<Price>` SSR markup per variant (svelte/server
  render, per the repo's SSR-test convention), store cookie write/read, transforms carry
  `pricing`, SiteNav renders the control and drawer row.

**Open decisions (not for the builder to invent)**

1. **Step 4 timing.** Ship Step 3 with € filter labels visible to a GBP visitor, or hold the
   PR until Step 4 (filter presets and labels in the chosen currency) is ready to merge behind
   it? Recommendation: ship Step 3; start Step 4 in the same worktree straight after, so the
   interim window is days.
2. **Analytics event.** Whether choosing a currency should fire a GA4 event (`currency_select`,
   with the code) — Step 5 owns analytics, but the store's `onChange` hook is the place. Default:
   not in Step 3.
3. **Pre-paint script placement.** `app.html` inline (simplest, runs before any CSS applies) vs
   a `<svelte:head>` script in the root layout. Default: `app.html`, guarded to touch only
   `data-currency`.
