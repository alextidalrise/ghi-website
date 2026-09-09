---
target: mobile menu
total_score: 26
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-08-25T11-11-23Z
slug: web-src-lib-components-sitenav-svelte
---
Method: dual-agent (A: design-review sub-agent · B: detector-evidence sub-agent)

# Critique — Mobile menu (`web/src/lib/components/SiteNav.svelte`, drawer + hamburger; serves all viewports < 72rem)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Active page invisible when it's a child inside a collapsed accordion (drawer opens with `expanded = null`; submenu `hidden`, :283); no cue that the CTA sits below the fold |
| 2 | Match System / Real World | 3 | Plain, honest labels; unlabeled bare hamburger is a convention gamble for the older audience, especially at iPad widths |
| 3 | User Control and Freedom | 4 | Escape, scrim tap, toggle-as-X, focus restore, afterNavigate close — genuinely complete (:56–113, :235) |
| 4 | Consistency and Standards | 3 | Drawer is `<aside aria-label="Main">` duplicating the `<nav aria-label="Main">` landmark name with the wrong role (:118, :239–243); parent active logic uses `isActive` in the drawer but `itemActive` on desktop (:257 vs :137) |
| 5 | Error Prevention | 3 | Split label/chevron row prevents accidental navigation — but `{#each}` keyed by `item.label`/`child.label` (:124, :249, :284) means duplicate CMS labels throw and kill the header site-wide |
| 6 | Recognition Rather Than Recall | 3 | All options visible; but "where am I" hidden behind collapsed accordions |
| 7 | Flexibility and Efficiency | 2 | Single-exclusive accordion (:276); can't compare Spain and Portugal children at once |
| 8 | Aesthetic and Minimalist Design | 4 | Ruthlessly quiet: one accent, hairlines, zero radius, 0.4s expo-out glide — on-brief |
| 9 | Error Recovery | 2 | Resize past 72rem with drawer open: `open` stays true, body scroll stays locked (:68), every close control `display:none` (:771–791) — Escape works but is invisible |
| 10 | Help and Documentation | n/a | A nav drawer needs no documentation surface |
| **Total** | | **26/36** | **Good (72%)** |

## Design Specificity Verdict

**LLM assessment:** Genuinely authored, not templated. The deep-green surface, gold leading-edge active marker (:678–686), recessed near-black submenu well (:713), hairline child dividers (:733–735), and a drawer CTA that mirrors the desktop gold Contact exactly (:743–755) execute the documented 2026-06-25 drawer decisions to the letter. But the brand's signature serif — Playfair Display — never appears in the drawer. The comment at :645–647 claims "The Playfair wordmark at the top keeps the serif present"; no such wordmark exists in the markup (the bar shows an SVG logo image). Strip the green and this is a competent minimalist fashion-label drawer: color and discipline carry the brand; typography contributes restraint but not identity.

**Deterministic scan:** `detect.mjs` exit 0, **0 findings** — verified genuine (`.svelte` is scannable, config-independent, pipeline proven live on a seeded antipattern). Caveat: the rule set is static-antipattern-focused and does not compute contrast through CSS custom properties or alpha compositing, so the clean bill does not certify the `rgba(245,241,232,0.55)` static-label contrast failure the design review caught — the two assessments are complementary here, not in disagreement.

**Visual overlays:** Not available — no browser automation tool exposed this session and no dev server running (ports 5173/4173/3000 empty; boot skipped to stay bounded). All findings are source-verified with line references instead.

## Overall Impression

This is a drawer built by someone who cared: the focus engineering, the iOS clip-path guard, and the reduced-motion block are above the median for hand-rolled navigation. The failure pattern is the opposite of sloppiness — it's that the drawer serves the brand's discipline but not the visitor's orientation or the business's conversion. The single biggest opportunity: make the drawer answer "where am I?" and guarantee the gold Contact button is always on screen.

## What's Working

1. **Real focus engineering** (:64–113, :245, :293). Focus trap spanning toggle + drawer, focus-on-open, focus restore on close, `inert` + `aria-hidden` when closed, tabindex gating of hidden sublinks.
2. **Edge-case craft nobody sees.** `clip-path: inset(0 0 0 100%)` so iOS rubber-banding can't reveal the parked drawer (:620–624), `overscroll-behavior: contain` (:619), thorough `prefers-reduced-motion` block (:794–807).
3. **Documented decisions executed precisely.** Parent/child/CTA type specs match DESIGN.md exactly (:648–662, :718–730, :743–755); the desktop dropdown's hairline-and-recess vocabulary is echoed, not copied.

## Priority Issues

1. **[P1] Active page is invisible when it's a child.** Drawer opens with all accordions collapsed (:15, reset at :56–60); the active child's gold state sits inside `hidden` (:283); a static parent (`span`, :266) gets no active styling; linked parents use `isActive(item.href)` (:257) instead of `itemActive`. A visitor on the Marbella page opens the menu and nothing says where they are. **Fix:** on open, initialize `expanded` to the index where `isSiteNavItemActive(item, pathname)`; apply `is-active` to parent rows via `itemActive`. **Suggested command:** /impeccable polish
2. **[P1] Contact CTA can be off-screen with no cue.** Single scrolling column (:613–618) with the CTA last (:316–324). A landscape phone or one long CMS submenu pushes the site's only conversion action out of view — no fade, no pinning. **Fix:** make the list the scroll region and pin the CTA as a drawer footer (or add a bottom fade + reserved space). **Suggested command:** /impeccable polish
3. **[P2] Breakpoint-crossing scroll-lock trap.** Open the drawer at 71rem, widen past 72rem: drawer, scrim, and toggle all `display:none` (:771–791) but `open` stays true and `document.body.style.overflow='hidden'` (:68) persists — frozen page with no visible control. **Fix:** `matchMedia('(min-width: 72rem)')` listener that sets `open = false`. **Suggested command:** /impeccable harden
4. **[P2] Static parent label fails AA and reads as disabled.** `rgba(245,241,232,0.55)` on `#1F3D34` ≈ 4.3:1 (:664–666) at 16px weight-300 — under the 4.5:1 floor for an audience that skews older, and the dimming discourages the chevron tap that reveals the children. **Fix:** full-opacity `--on-green`; let the chevron alone signal "expands, doesn't navigate." **Suggested command:** /impeccable polish
5. **[P3] Wrong/duplicate landmark.** Drawer is `<aside aria-label="Main">` (:239–243) — a `complementary` landmark carrying the primary menu, same accessible name as `<nav aria-label="Main">` (:118). **Fix:** make the drawer (or its list) a `<nav aria-label="Main menu">`. **Suggested command:** /impeccable harden

## Cognitive Load

Top level presents 7 options (6 items + CTA) — over the 4-option guideline but conventional for a nav. With a 5-child country expanded, 12+ options are simultaneously live with no dimming of the unexpanded groups; children are CMS-unbounded, so a 15-location country produces a 22-option wall. The flat list mixes destination types (countries, a collection, guides, editorial, about) with no grouping. Progressive disclosure itself is present and correct (exclusive accordion); no memory demands.

## Persona Red Flags

- **Casey (one-handed, distracted):** Tapping the wide "SPAIN" link (`flex:1`, :648–662) navigates when she wanted the submenu; only the 56px chevron zone (:693) expands. Toggle is exactly 44×44 (:548–550) — meets the floor with zero slop; the visual is 22×15px of 1.5px hairlines. Row heights all clear 44px; interruption recovery fine.
- **Sam (screen reader / keyboard):** Rotor announces two "Main" regions, one the wrong role (:118, :239–243). Otherwise strong: `aria-expanded`/`aria-controls` throughout, flipping accessible names, trap includes the close control. The trap excludes the still-visible logo (nav z100 sits above scrim z90) — sighted-keyboard users can see it but never reach it.
- **Margaret (63, affluent, iPad):** Landscape iPad (1024px) is under the 1152px breakpoint, so a large screen with room for the full bar gets a bare, unlabeled 3-hairline hamburger. Biggest discoverability risk in the component; a tracked-caps "MENU" label beside the bars would cost nothing and be on-brand. Weight-300 uppercase at 16px is delicate stroke-width for older eyes; the 55%-alpha static parent will read as greyed-out/unavailable.

## Minor Observations

- `{#each}` keyed by `item.label`/`child.label` (:124, :249, :284): duplicate CMS labels throw a Svelte duplicate-key error and take down the header on every page. Key by href or index.
- Stale comment :645–647 describes a Playfair wordmark that isn't in the markup.
- `.site-nav__drawer-sublink` color transition (:729) missing from the reduced-motion list; harmless (color-only) but inconsistent.
- `.site-nav__scrim` set `display:flex` then immediately `display:block` (:784–791) — dead rule.
- `expanded` persists across Escape/scrim close (only navigation resets it) — defensible as memory, but undocumented and interacts with the P1 auto-expand fix.
- External links open new tabs (:291–292) with no visual or aria hint.
- iOS body scroll lock is `overflow:hidden` only (:68); Safari can sometimes still scroll — partially mitigated by `overscroll-behavior: contain`.

## Questions to Consider

1. The drawer contains zero Playfair — the one typeface that makes this brand recognizable. Would a single serif moment (a small wordmark, or the country names) turn a disciplined drawer into an unmistakable one?
2. The drawer serves every viewport up to 1151px — including landscape iPads, the core demographic's device. Is a naked hamburger the right trigger at 1024px, or should the bar keep a visible "MENU" label?
3. Contact is the business's only conversion action and the drawer's designed final note — why isn't the gold button the one thing the drawer guarantees is always on screen?
