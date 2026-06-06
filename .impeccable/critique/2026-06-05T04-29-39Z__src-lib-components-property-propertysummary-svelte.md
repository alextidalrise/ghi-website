---
target: property title section
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-06-05T04-29-39Z
slug: src-lib-components-property-propertysummary-svelte
---
# Critique — Property title / summary section (PropertySummary.svelte)

## Design Health (scoped to a presentational header)
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 2 | Match System / Real World | 2 | "exact €1,495,000" — the price qualifier reads as a typo/system leak |
| 4 | Consistency & Standards | 3 | Location appears in both the title and the subtitle; CMS title formatting varies (em dash vs comma) |
| 6 | Recognition Rather Than Recall | 4 | Everything visible at a glance |
| 8 | Aesthetic & Minimalist | 3 | Strong hierarchy, but redundant location + "exact" + low-contrast subtitle cost it |
Interaction heuristics (1,3,5,7,9,10) are not exercised by a static header.

## Anti-patterns verdict
Not AI slop. Detector clean (0 findings). No gradient text, no per-section eyebrow, no generic card. Big-serif + tracked uppercase subtitle is a luxury-listing convention, but it's appropriate and matches committed DESIGN.md.

## Priority issues
- [P1] Price qualifier "exact" leaks into the hero price. formatListingPrice prepends pricing.priceQualifier; "exact" reads as broken. Suppress non-meaningful qualifiers; keep "From"/"Guide"/POA.
- [P1] Contrast: location line #7a7a7a @14px Light = ~4.3:1 (below AA 4.5); spec labels same colour @11px. PRODUCT.md sets AA as floor for an older audience. Darken location to charcoal/green and drop Light weight; bump label muted.
- [P2] Title/location redundancy: "Arco Iris — Marbella" + "GOLDEN MILE, MARBELLA, SPAIN" repeats Marbella; the title carries the location the subtitle already states. Partly CMS data.
- [P3] Vertical emptiness between badge row and spec strip; price weight 300 falls back to Playfair 400 (no explicit weight).

## Persona red flags
- Sam (a11y): subtitle + labels fail AA contrast; em dash announced oddly by screen readers.
- Casey (mobile): long enriched titles + em dash risk awkward wraps at the 2.25rem clamp floor.

## Questions
- Is the "exact" qualifier ever wanted, or always suppressable?
- Should the location line stay given titles already embed location?
