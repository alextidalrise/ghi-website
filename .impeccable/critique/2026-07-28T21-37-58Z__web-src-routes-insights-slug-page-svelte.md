---
target: nobu monte rei property buyers insight article
total_score: 32
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 1
timestamp: 2026-07-28T21-37-58Z
slug: web-src-routes-insights-slug-page-svelte
---
# Critique — "Nobu at Monte Rei: What the Announcement Means for Property Buyers"

Method: dual-agent (A: a428e1a3d68c10082 · B: a730973381bd731af)
Target: https://www.golfhomesinternational.com/insights/nobu-monte-rei-property-buyers
Surface mode: Read (editorial article) with a Persuade close. Rendered by `web/src/routes/insights/[slug]/+page.svelte` + the `insights/*` component family.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Desktop scroll-spy TOC is excellent; on mobile it collapses behind a toggle and the active-section indicator is hidden mid-read — no orientation while scrolling a 7-section piece. |
| 2 | Match System / Real World | 4 | Domain-perfect voice: "Market" kicker, "Buyer position", "register for verified updates". Insider, never jargon. |
| 3 | User Control and Freedom | 3 | Breadcrumbs + TOC jumps + browse-escape are good, but the FAQ `<details name="insight-faq">` is an *exclusive* accordion — opening one answer closes the one you were reading. |
| 4 | Consistency and Standards | 4 | Shared framed-block idiom (kicker, matted plate, gold-top blocks) applied rigorously across takeaways/callouts/routes. |
| 5 | Error Prevention | 3 | Low surface (no forms). Campaign-param stripping on authored hrefs is careful hygiene; little to get wrong. |
| 6 | Recognition Rather Than Recall | 4 | Thesis stated upfront, sticky desktop TOC, self-labelling headings — nothing held in memory. |
| 7 | Flexibility and Efficiency | 3 | TOC jump-links + WhatsApp accelerator help; mobile has no persistent jump affordance (scroll to top, open drawer). |
| 8 | Aesthetic and Minimalist Design | 4 | Exemplary restraint: one green band, rationed gold, no rule-metronome between sections. Textbook for the brief. |
| 9 | Error Recovery | n/a | No error states on this linear read surface. |
| 10 | Help and Documentation | 4 | The FAQ, "What buyers should verify", and the hero thesis note collectively *are* the help layer, well-placed. |
| **Total** | | **32 / 36** | **Good (89%) — a genuinely well-made page with a few real gaps** |

Heuristic 9 scored n/a (no error states); applicable max 36.

## Design Specificity Verdict — Authored, not interchangeable

**LLM assessment:** This is built for GHI and would break if lifted into a generic property blog. The two-route decision aid ("Assess current Monte Rei opportunities" vs "Register for verified Nobu updates") encodes GHI's insider position — much is unconfirmed, don't buy on assumed brand access — into an interface pattern no template ships. The hero thesis note states the buyer's position before the scroll, deliberately set as a display paragraph so it stays out of the document outline. The copy is unmistakably the brand ("it is not a residential sales release"; "Neither existing nor future property should be valued on assumed facility access…"), and the figure caption's "The image does not depict the proposed Nobu development" is a legal/ethical scruple a generic blog would never write. The matted-plate figure idiom (one 1px frame around photo *and* caption) and the no-rule-between-sections decision are a single authored system, not decoration.

**Deterministic scan:** `detect.mjs --json` over the insight component family + route returned exit 0, **zero findings** — clean. Confirmed functional (entrypoint present, `--help` valid), so this is a real clean scan of the Svelte markup, not a skipped run. Its scope is markup regex; it cannot see rendered contrast or layout, so the P1 contrast failure below is real and simply out of the detector's reach.

**Rendered evidence (raw-HTML parse):** exactly 1 `<h1>`; article heading outline H1→H2→H3 with no skips; 9 images, all 7 editorial images carry specific alt text (only the footer logo is empty-alt-by-design with the accessible name on its link); 3 valid JSON-LD blocks (Article + BreadcrumbList + FAQPage, 12 Q/A pairs); the 8 inline styles are all LQIP blur-up placeholders + one `display:contents`. The closing band's foreground colours are all design-system tokens (`--on-green` on `--green`, gold lead button), so text-on-green is token-governed. Two factual notes: the consent modal emits an H2/H3 cluster *before* the page H1 in DOM order, and the footer adds H2s after the band. No user-visible overlay was produced (no browser injection available), and computed contrast ratios were not machine-measured.

## Overall Impression

This is one of the better-made pages on the site — high design specificity, mature restraint, a bespoke decision aid that turns the brand's insider judgment into layout. It reads as an insider briefing for ~90% of the scroll. The single biggest opportunity is the **ending**: the article's whole thesis is "two routes, and one of them is *wait*," yet the close assumes you're the search-now buyer. The most GHI-specific idea on the page evaporates in the last frame. Fix the ending and the one contrast bug and this is a reference-quality editorial template.

## What's Working

1. **The matted-plate figure idiom is the design's spine.** One 1px frame wraps photo *and* caption together (`InsightFigure.svelte`, mirrored in the hero), with a fixed 16:9 crop enforcing a consistent beat across a long piece. An image reads as *placed on the page*, not dropped in — exactly the "curation over volume" the brand claims.
2. **No rule between sections is mature restraint.** `+page.svelte:125-138` articulates *why* — "an identical hairline at an identical interval, nine times over, is a metronome" — and replaces it with `clamp(3.5rem, 7vw, 5.5rem)` of whitespace plus the Playfair h2. Emphasis-ladder tier 1 doing real work; the difference between "editorial" and "list of items".
3. **The two-route decision aid, structurally.** Equal-weight outline actions (neither is the filled green — that's reserved for enquiry), subgrid keeping both actions on one baseline so "neither route looks like the shorter argument," and an outcome line under each button answering "what happens if I click." A genuine comprehension aid, not a CTA dressed up.

## Priority Issues

**[P1] Gold key-figures caption fails contrast.** `GuideKeyFigures.svelte:47` sets `.guide-figures__caption` in `var(--gold)` (#D6C3A3) on white ≈ **1.6:1** — far below the 4.5:1 AA floor (and below 3:1 for large text). This labels the single most information-dense block on the page, for an audience that skews older. Gold is an *accent* in the system, never text on white. **Fix:** render key-figure captions in `--green` (as the callout label already does in `GuideCallout.svelte`) or `--muted`; keep gold to the 1px rule/marker only. Audit for any other gold-type-on-white. *Command: /impeccable clarify (or a targeted colorize/audit pass).*

**[P2] The close ignores the article's own second route.** The piece defines a "register and wait" buyer, then closes with "Planning a Monte Rei property search?" and search/browse actions only (`+page.svelte:107` passes neither `primary` nor `secondary`, so `TalkToUsBand` falls back to Get-in-touch / WhatsApp / Browse-properties). Peak-end: the final frame contradicts the guidance the reader just accepted, and it's the one spot the design turns salesy. `TalkToUsBand.svelte:27` already accepts a `secondary` action. **Fix:** give this article a close that carries *both* routes — e.g. "Register for Nobu updates" alongside "Get in touch" — so the end mirrors the two-route spine instead of flattening it. *Command: /impeccable clarify.*

**[P3] Mobile readers lose orientation mid-article.** Below 56rem the TOC collapses to a toggle and the scroll-spy highlight is only visible when the drawer is open (`GuideContents.svelte`); there is no persistent "where am I / jump" affordance while reading a 6-minute, 7-section piece one-handed. Heuristics 1, 6 and 7 all dip here for the largest real-world segment (phone). **Fix:** a slim sticky section-label bar, or a persistent floating "Contents" control that opens the drawer in place. *Command: /impeccable adapt.*

**[P3] FAQ is an exclusive accordion and its questions sit outside the heading outline.** `InsightFaq.svelte:24` uses `name="insight-faq"`, so opening any answer closes the previously open one; and each question is a `<summary>` styled at `--text-h4` (`InsightFaq.svelte:60`), not a real heading. A reader comparing two answers can't hold both open; a screen-reader user navigating by heading won't find the questions. **Fix:** drop the shared `name` so answers open independently; wrap each `<summary>` text in an `<h3>` (or `role="heading" aria-level="3"`) to restore it to the outline. *Command: /impeccable harden.*

## Persona Red Flags

**Affluent 60-something skimming on an iPad (GHI-specific, most relevant):**
- Body copy inherits **Libre Franklin Light 300** (global `--text-body`; not overridden in `InsightBody.svelte`). At arm's length on a tablet, 300 on white is thin — undercutting the very legibility the brand promises this reader. Measure (44rem) and 1.75 line-height are right; the *weight* is the risk.
- The **gold key-figures caption** (P1) is near-invisible to ageing eyes — and it labels the numbers they most want.
- In iPad portrait (below the two-column threshold) the hero stacks and the sticky TOC drops out — the jump-to-"What buyers should verify" affordance is gone exactly when a skimmer reaches for it.

**Casey (distracted, one-handed mobile):**
- No persistent TOC/jump while reading (P3) — to move sections, thumb back to the top and open the drawer.
- *Pass worth crediting:* the closing action grid is thumb-friendly (two-up + full-width escape).

**Sam (screen-reader + keyboard):**
- FAQ questions aren't headings (P3) — lost from heading navigation.
- *Passes worth crediting:* focus-visible gold rings on every interactive element; the closing band's DOM order deliberately matches visual order for sane tab order; `aria-labelledby` on sections; decorative marks correctly `aria-hidden`.

## Minor Observations

- **Two quote treatments coexist** — the prose `blockquote` (serif italic between hairlines) and the larger `InsightPullQuote`. Different jobs; worth a house rule so an editor knows which is which.
- **Related-card hover** uses `translateY(-6px)` + shadow (`InsightCard.svelte`). At-rest is shadowless (obeys "no shadow at rest"), but a 40px lift is the most "webby" motion on an otherwise very still page — consider a border-colour + gold-title shift instead.
- **Hero note** is `--muted` on the `--surface-tint` wash — lightest text on the lightest surface; verify on a real panel, not just sRGB math.
- **Detector/LLM divergence:** the clean detector run and the P1 contrast failure are both correct — contrast is simply outside `detect.mjs`'s markup-regex scope, so this is a case where the design review catches what the deterministic layer structurally cannot.

## Questions to Consider

1. Should the **close *be* the second route** — split the closing band into the same "assess now / register for updates" object it uses mid-article, so the end becomes the most GHI-specific moment rather than the most generic?
2. **What is gold actually allowed to be?** It's currently a marker, a rule, a focus ring *and* (wrongly) caption text. If the system said "gold is 1px and dots only, never type," the P1 bug becomes structurally impossible. Worth writing into DESIGN.md?
3. Does an **older, tablet-first audience** justify a per-surface override of the Light-300 body weight on long Read surfaces (350–400)?
4. On mobile, **what is the reader's map?** Desktop gets a sticky spine; mobile gets a drawer they must hunt for. If the phone is where most of this audience reads, should the mobile orientation model be designed first, not inherited as a collapse of the desktop one?
