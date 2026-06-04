---
target: the gallery
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-06-03T20-03-35Z
slug: web-src-lib-components-property-gallery-svelte
---
## Gallery critique

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Counter + active-thumb + lightbox counter all present |
| 2 | Match System / Real World | 3 | Standard gallery/lightbox conventions |
| 3 | User Control and Freedom | 4 | Esc, close, arrows, swipe, click-backdrop |
| 4 | Consistency and Standards | 3 | On-brand tokens, but stage breaks its own 3:2 promise |
| 5 | Error Prevention | 3 | n/a-ish; lightbox can't trap |
| 6 | Recognition Rather Than Recall | 3 | Thumbs + "+N more" signal the full set |
| 7 | Flexibility and Efficiency | 3 | Keyboard arrows + swipe |
| 8 | Aesthetic and Minimalist Design | 2 | Wasted width + portrait crop on a photo-led surface |
| 9 | Error Recovery | 3 | n/a |
| 10 | Help and Documentation | 3 | n/a for a gallery |
| **Total** | | **30/40** | **Good foundation; the layout is the gap** |

### Anti-Patterns Verdict
Detector (detect.mjs) on Gallery.svelte: clean, 0 findings. Not AI-slop: zero-radius, 1px hairlines, brand tokens, native dialog. The tell here isn't slop, it's a layout that under-uses the surface.

### Priority Issues

**[P1] The gallery wastes ~30% of the viewport.** Measured at 1512px wide: the gallery is 1060px (content-wrap), leaving 452px of empty margin. Photography is the emotional payload of this brand (DESIGN.md: "photography carries the weight"), and it's boxed into the body text column. The hero surface should command more width than a paragraph.

**[P1] The stage renders portrait, not landscape.** Measured stage: 621x733 (portrait), despite an intended aspect-ratio of 3:2 (which would be 621x414). The thumbnail grid's height is driving the layout: grid-auto-rows:1fr over 3 rows stretches the right column taller than the stage's natural 3:2, and align-items:stretch then pulls the stage to match. So a landscape villa photo gets center-cropped into a vertical slot. Thumbnails inherit the same problem (153x232, portrait). The stage's 3:2 must be the source of truth for height; the thumbnail column should fit within it.

**[P2] Width and ratio are one fix.** Widening the container makes the stage wider, so at a fixed 3:2 it gets shorter and more landscape, and a 2-col thumbnail column at that height yields landscape tiles. Decoupling the stage height from the grid is the other half.

### Persona Red Flags
**Casey (mobile):** mobile stage is full-width and already landscape-correct; this issue is desktop-only.
**Sam (a11y):** thumbnails are keyboard-reachable with visible focus, lightbox traps focus correctly; no red flags from the layout issue.
**Riley (stress):** 1-photo and 3-photo cases render without breaking, but the 3-photo case produces two very tall portrait thumbs beside the stage, the worst expression of the ratio bug.

### Minor Observations
- Caption uses --charcoal (AA-safe), good.
- "+N more" overlay at 0.45 scrim is legible.
- The odd-tile span trick keeps the grid rectangular but amplifies verticality when tiles are already too tall.
