# Design System -- Golf Homes International

## Product Context
- **What this is:** A curated portfolio of residential properties on or near premier golf courses, starting in southern Europe (Spain and Portugal) with plans for global expansion.
- **Who it's for:** Affluent buyers and lifestyle investors seeking property tied to world-class golf. Not exclusively ultra-high-net-worth, but aspirational enough to attract them.
- **Space/industry:** Luxury real estate, golf lifestyle, relocation and second homes.
- **Project type:** Marketing site with property listings, editorial content, and lead capture.
- **Memorable thing:** Calm exclusivity -- like a private members' club, not a property search engine.

## Aesthetic Direction
- **Direction:** Luxury / Refined with Editorial influence
- **Decoration level:** Minimal -- typography, negative space, and photography do all the work. No decorative elements, gradients, or ornament.
- **Mood:** Walking into a quiet room in a private club. A leather portfolio is placed in front of you. Everything has been considered. Nothing competes for attention. You feel welcomed, not sold to.
- **Key rules:**
  - Zero border-radius on all elements (square corners throughout)
  - No drop shadows at rest (hover states may use subtle shadow for lift)
  - 1px borders only -- never thicker
  - Photography carries the emotional weight; UI stays out of the way
  - Generous negative space signals exclusivity (nothing looks crowded)

## Typography

### Display / Headings: Playfair Display
- **Weights used:** SemiBold 600 (display headlines), Regular 400 (section headings), Bold 700 (wordmark)
- **Italic:** Used for select display moments — hero taglines, pull quotes. The italic cut has a calligraphic quality that adds editorial character at large sizes.
- **Rationale:** Didone-influenced transitional serif designed by Claus Eggers Sørensen (2011). Strong vertical stress and dramatic thick/thin contrast give it conviction at display sizes. Pairs naturally with the wordmark, which is already set in Playfair Bold. Reads as confident magazine-editorial luxury rather than understated whisper.
- **Loading:** Google Fonts -- `family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700`

### Body / UI: Libre Franklin
- **Weights used:** Light 300 (body text, desktop nav links), Regular 400 (UI labels, prices, dropdown items), Medium 500 (overlines)
- **Rationale:** A revival of Morris Fuller Benton's 1912 Franklin Gothic. Genuine warmth in the letterforms without being quirky. Not on any AI's default list. It defers to the serif in the hierarchy while remaining comfortable at small sizes.
- **Loading:** Google Fonts -- `family=Libre+Franklin:ital,wght@0,300;0,400;0,500;1,300;1,400`

### Type Scale

All sizes are exposed as CSS custom properties (`--text-*`) on `:root`. Headings use fluid `clamp()` for smooth scaling between mobile and desktop. Body and UI sizes are fixed rem values.

| Token | Font | Weight | Size | Line Height | Tracking | Usage |
|-------|------|--------|------|-------------|----------|-------|
| `--text-display` | Playfair Display | SemiBold 600 | clamp(2.25rem, 5vw + 0.5rem, 4rem) | 1.05 | `--tracking-tight` (-0.015em) | Hero headlines, page titles |
| `--text-h2` | Playfair Display | Regular 400 | clamp(1.5rem, 3vw + 0.75rem, 2.5rem) | 1.1 | normal | Section headings |
| `--text-h3` | Playfair Display | Regular 400 | clamp(1.25rem, 1.5vw + 0.75rem, 1.75rem) | 1.2 | normal | Card titles, sub-sections |
| `--text-h4` | Playfair Display | Regular 400 | 1.375rem (22px) | 1.25 | normal | Property names, lead text, small headings |
| `--text-body` | Libre Franklin | Light 300 | 1rem (16px) | 1.7 | normal | Long-form copy, descriptions, inputs |
| `--text-ui` | Libre Franklin | Regular 400 | 0.875rem (14px) | 1.5 | normal | Buttons, nav links, form labels, prices |
| `--text-small` | Libre Franklin | Regular 400 | 0.75rem (12px) | 1.5 | normal | Metadata, captions, hex values, fine print |
| `--text-overline` | Libre Franklin | Medium 500 | 0.6875rem (11px) | 1 | `--tracking-overline` (0.12em) | Uppercase labels, section markers |

### Tracking Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tight` | -0.015em | Display headings |
| `--tracking-wide` | 0.04em | Buttons, dimension labels |
| `--tracking-overline` | 0.12em | All uppercase overlines and labels |

### Modern Typography Features
- `font-kerning: normal` and `font-optical-sizing: auto` on body
- `text-wrap: balance` on all headings (h1–h4)
- `text-wrap: pretty` on body paragraphs and descriptions
- `font-feature-settings: 'tnum'` for tabular numerals on prices

### Light-on-Dark Compensation
Body text on dark surfaces (green backgrounds, dark mode panels) gets adjusted for legibility:
- Weight bumped from 300 to 350
- Line-height increased to 1.8
- Letter-spacing added at 0.01em

### Data / Tables
- **Font:** Libre Franklin with `font-feature-settings: 'tnum'` for tabular numerals
- **Usage:** Property prices, dimensions, dates

## Color

### Approach: Restrained
Color is used sparingly and with intent. The system is **white by default, deep green for punctuation**: white carries every surface, deep green appears as the occasional dramatic band (hero, enquiry), and gold is the only accent, reserved for interactive states and emphasis. There is no tinted "surface" colour. Rhythm comes from whitespace, 1px hairlines, photography, and the green bands.

**The White-Default Rule.** Feature sections, panels, and data blocks sit on white, not on a tinted surface. Where a data block (key facts) needs anchoring, it gets a 1px hairline frame, never a fill. The warm cream that once tinted these panels (`--linen`) was removed on 2026-06-01; warmth now comes from gold, photography, and typography, not from the background.

**The Green-Punctuation Rule.** Deep green is the only full-bleed surface colour. It is the heaviest tool in the kit, so it is rationed: **one green band per page, hard cap** (the hero is usually that one). Two green bands stacked read as one heavy slab and burn the page's only landing point; that is the failure the Emphasis Ladder exists to prevent. If a page feels flat, reach down the ladder (rules, photography, whitespace) before reaching for a second green.

### The Emphasis Ladder

When a section needs to feel distinct from the white editorial default, pick the **lowest tier that does the job**. Weight is reserved for importance; spending tier 4 on a supporting section leaves nothing for the real moment.

| Tier | Device | Use for | Budget / page |
|------|--------|---------|----------------|
| 1 — lightest | Whitespace + width + type scale (larger Playfair heading, Playfair italic for a select moment) | Most sections | unlimited |
| 2 | Hairline rules or a 1px frame on white (full-bleed `--border` rules bracketing the band; the rail may still bleed off the right edge). Gold reserved as accent marks (spec dots, focus), not as the rule colour. | "This is its own thing" — supporting sections that still need separation | generous |
| 3 | Full-bleed **photography** band (single image + scrim + overlaid heading) | "This is a moment" / a destination | ~1–2 |
| 4 — heaviest | Full-bleed **green** band (`--green`, gold hairline `border-block`, on-green type) | The single most important emphasis on the page | **1, hard cap** |

The levers that compose these tiers: **width** (full-bleed / contained / deliberately narrowed), **whitespace**, **hairline rules and frames**, **photography as surface**, **layout-mode change** (prose → grid → rail), **typographic scale and italic**, and **gold as accent marks** (never a fill). Tier 3 does not apply when the section's own content is already photographic (e.g. a listing rail); image-on-image competes, so use tier 2 instead.

**Stacking bands.** Two full-bleed bands sit **flush**, never with a section-gap between them: each band's own `padding-block` is the breathing room, so an external gap just reads as dead space. When a ruled tier-2 band runs straight into a tier-3/4 band, the lower band's edge is the divider, so the upper band drops its now-redundant bottom rule (on the location page the white golf rail flows directly into the green frontline band). A band keeps its closing rule only when plain white content follows it.

### Palette

| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Deep Golf Green | `#1F3D34` | `--green` | Primary. Typography, structural borders, dark backgrounds, primary buttons. |
| Sand Gold | `#D6C3A3` | `--gold` | Accent. Interactive states, overlines, hover underlines. Used sparingly. |
| White | `#FFFFFF` | `--white` | Background. The canvas for every surface, including feature sections and panels. Sections are defined by whitespace, 1px borders, and hairline frames, never fills. |
| On Green | `#F5F1E8` | `--on-green` | Light ink for text and icons on green surfaces only. Never a page or panel surface. |
| Charcoal | `#2B2B2B` | `--charcoal` | Body text, secondary headings. |
| Stone Border | `#E2DED5` | `--border` | 1px structural borders, dividers, input underlines. |
| Muted | `#6B6B6B` | `--muted` | Secondary text, descriptions, metadata. ~5.3:1 on white (AA). |

### Semantic Colors (to be defined as needed)
- **Success:** TBD -- should align with the green family, distinct from primary
- **Warning:** TBD -- warm amber, not competing with gold accent
- **Error:** TBD -- muted red, not alarming (this is a luxury brand, not a dashboard)
- **Info:** TBD -- could use charcoal or muted

### Dark Mode
The palette inverts with care, not mechanically.

| Token | Light | Dark |
|-------|-------|------|
| `--green` | `#1F3D34` | `#C5D6C0` |
| `--on-green` | `#F5F1E8` | `#F5F1E8` (light ink, unchanged) |
| `--charcoal` | `#2B2B2B` | `#E8E5DF` |
| `--white` | `#FFFFFF` | `#1C231E` |
| `--border` | `#E2DED5` | `#2A332C` |
| `--muted` | `#6B6B6B` | `#8A8A8A` |
| `--gold` | `#D6C3A3` | `#D6C3A3` (unchanged) |

Dark background for hero/mockup sections: `#0E1410`

## Spacing

### Base Unit: 8px
### Density: Comfortable -- generous whitespace is a design feature, not an accident.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 8px | Tight gaps: between metadata items, icon padding |
| `sm` | 16px | Element spacing: between label and input, between list items |
| `md` | 24px | Component internal padding, card body padding |
| `lg` | 32px | Between components within a section |
| `xl` | 48px | Between sections, card groups |
| `2xl` | 80px | Major section separation, hero padding |

### Section Rhythm
- Section bottom margin: 7rem (112px) -- sections breathe
- Hero padding: 5rem (80px) vertical
- Content max-width: 1060px
- Content horizontal padding: 3rem (48px)

## Layout

### Approach: Editorial with Grid Discipline
Marketing and hero sections use asymmetric, editorial-style layouts (text offset to one side, image bleeding to the opposite edge). Property listings and structured content use a strict grid. The hybrid feels curated, not templated.

### Grid
- **Property listings:** 2-column grid, 3rem (48px) gap
- **Color swatches / small cards:** 4-column grid, 1.5rem (24px) gap
- **Typography specimens:** 2-column grid, 3rem gap
- **Hero mockups:** 50/50 split, asymmetric visual weight (text left, image right full-bleed)

### Max Content Width: 1060px
Narrower than typical -- keeps body text comfortable and reinforces the editorial feel.

### Border Radius: 0 everywhere
No exceptions. Square corners are a deliberate brand signal. This is one of the "risks" that gives the brand its face -- most luxury real estate sites round their corners.

## Motion

### Approach: Minimal-Functional
Movement exists only to provide feedback or draw attention to state changes. Nothing decorative. Nothing that makes you wait.

### Easing
- **Standard:** `cubic-bezier(0.16, 1, 0.3, 1)` -- a custom ease-out that starts fast and settles gently. Used for all transitions.

### Durations
- **Hover states:** 0.3s -- color changes, border reveals, arrow slides
- **Card lift on hover:** 0.4s -- `translateY(-6px)` with subtle shadow
- **Image scale on hover:** 0.6s -- `scale(1.03)` within overflow-hidden container

### Scroll
- `scroll-behavior: smooth` on `html`

## Components

### Buttons
Three tiers, all square-cornered, all with 1px borders:

| Type | Background | Text | Border | Hover |
|------|-----------|------|--------|-------|
| Primary | `--green` | `--white` | `--green` | bg becomes `--charcoal` |
| Outline | transparent | `--green` | `--green` | bg becomes `--green`, text becomes `--white` |
| Gold | `--gold` | `--green` | `--gold` | bg becomes `--green`, text becomes `--white` |
| On Dark | transparent | `--on-green` | `rgba(on-green, 0.4)` | bg becomes `--on-green`, text becomes `--green` |

Button padding: `0.875rem 2rem`
Font: Libre Franklin, Regular 400, 0.85rem, letter-spacing 0.04em

### Text Links
Underline on hover (not at rest). Arrow (`→`) slides right 3px on hover. Color transitions from green to gold on hover.

### Property Cards
- White surface, 1px border, no shadow at rest
- Image: 3:2 aspect ratio, `object-fit: cover`, scales to 1.03 on hover
- Location badge: white chip overlaid on bottom-left of image
- Metadata: dot-separated (using pseudo-element `::after` with 3px gold dot)
- Title: Playfair Display, Regular 400, `--text-h3`
- Price: Libre Franklin, Regular 400, tabular numerals
- Footer: separated by 1px border-top, contains text link

### Form Elements
- Bottom-border inputs only (no boxes, no background)
- Padding: `0.875rem 0`
- Border color: `--border`, focus: `--green`
- Select: custom arrow using `::after` pseudo-element, native `<select>` with `appearance: none`
- Labels: Libre Franklin, Regular 400, 0.8rem

### Hero / Mockup Sections
- Full-width, deep green background
- Asymmetric 50/50 grid: text left, image right (full bleed)
- Overline + display heading + body + CTA button
- Text side padding: 4rem

## CSS Custom Properties

```css
:root {
    --green: #1F3D34;
    --on-green: #F5F1E8; /* light ink on green only, not a surface */
    --gold: #D6C3A3;
    --charcoal: #2B2B2B;
    --white: #FFFFFF;
    --border: #E2DED5;
    --muted: #6B6B6B;

    --serif: 'Playfair Display', 'Georgia', serif;
    --sans: 'Libre Franklin', 'Helvetica Neue', Helvetica, Arial, sans-serif;

    --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Libre+Franklin:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" rel="stylesheet">
```

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-07 | Green + linen + gold palette selected | Derived from the landscape: fairway greens, coastal sand, Mediterranean light. Restrained to 4 core colors. |
| 2026-05-07 | Cormorant Garamond for display (later reversed -- see 2026-05-12) | High-contrast transitional serif. Delicate hairlines create understated luxury at large sizes. Distinctly European. |
| 2026-05-07 | Libre Franklin for body/UI | 1912 Franklin Gothic revival. Warm without being quirky. Not on any AI default list. Defers to the serif. |
| 2026-05-07 | Zero border-radius everywhere | Deliberate departure from convention. Square corners signal precision and editorial authority. |
| 2026-05-07 | Bottom-border-only form inputs | Another deliberate departure. Forms feel like a considered questionnaire, not a web form. |
| 2026-05-07 | Asymmetric hero layouts | Editorial composition over centered templates. Text offset, image bleeding to edge. Feels curated. |
| 2026-05-07 | Rejected Inter and Montserrat | Inter and Montserrat are overused. (Playfair Display was also rejected here for being common in luxury templates -- this was reversed on 2026-05-12.) |
| 2026-05-09 | Page background switched from Soft Linen to White | Cleaner, more modern canvas. Linen retained in the palette as a warm surface for feature sections and on-dark contrast; cards now rely on the 1px Stone Border for definition. |
| 2026-05-12 | Display serif swapped from Cormorant Garamond to Playfair Display | Owner preference. Playfair already used in the wordmark, so unifying the system serif removes the Cormorant/Playfair split. Earlier "vibe-coded" objection acknowledged and overridden -- the higher contrast and stronger conviction were judged more on-brand than Cormorant's whisper. Display weight steps up from Light 300 to Regular 400 (Playfair Display has no Light weight on Google Fonts). |
| 2026-05-12 | Typography system consolidated to 8 semantic tokens | 23 arbitrary font sizes consolidated to 8 `--text-*` tokens and 3 `--tracking-*` tokens. Headings (Display, H2, H3) use fluid `clamp()` for responsive sizing, eliminating breakpoint overrides. Modern rendering added: `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs, `font-kerning: normal`, `font-optical-sizing: auto`. Light-on-dark body text gets weight/spacing/leading compensation. |
| 2026-05-12 | Display weight bumped to 600, italic introduced for select display moments | Display headings now SemiBold 600 (was Regular 400) to widen the stroke contrast against Light 300 body text -- the weight cascade is now 600 → 400 → 300. Playfair italic activated for hero taglines (e.g. "the fairway") to leverage the calligraphic quality at large sizes. Italic 600 weight added to the Google Fonts request. |

## Preview
The live design system showcase renders from the real tokens and components at the
`/internal/design-system` route (`web/src/routes/internal/design-system/`). It is
env-gated (`ENABLE_DESIGN_SYSTEM=true`, or any non-production deploy) and `noindex`.
Because it consumes `web/src/lib/styles/tokens.css` and the actual `$lib` components,
it can never drift from what ships. The earlier hand-built static HTML showcase has
been retired in favour of this page.

## Decisions Log (continued)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-01 | Consolidated two clashing design-system showcases into one | A frozen hand-built HTML page (`web/static/design-system/design-system/index.html`) and a live Svelte page (`/internal/design-system`) both showed the system and had drifted. The static page hardcoded its own `:root` tokens, so it could not stay in sync. Retired the static page; kept the live Svelte page as the single source-of-truth showcase. Load-bearing brand assets under `web/static/design-system/assets/` (logo, hero image, referenced by `SiteNav` and the homepage) were preserved. |
| 2026-06-01 | Removed the cream surface (`--linen`); moved to white-default + green-punctuation | Partner no longer liked the warm cream tint on feature panels. Tested the data-heavy sections (key facts, amenities) on white and confirmed they hold: key facts now sits in a 1px hairline frame, amenities became outline chips, image-led sections (gallery, location) go straight to white. Cream had no remaining job. `--linen` deleted; its only other role (light ink on green) renamed to `--on-green`. Rhythm now carried by whitespace, hairlines, photography, and the deep-green emphasis bands. |
| 2026-06-05 | Darkened `--muted` `#7A7A7A` → `#6B6B6B` (light mode) | `#7A7A7A` measured ~4.3:1 on white, below the AA 4.5 floor PRODUCT.md sets for the older, affluent audience. Every muted-on-white instance (metadata, labels, the property location line) was technically failing. `#6B6B6B` is ~5.3:1 and still reads as soft secondary gray. Dark-mode `--muted` (`#8A8A8A`, on a dark surface) unchanged. |
| 2026-06-06 | Introduced the Emphasis Ladder; capped green at one band per page | Distinguishing a section kept defaulting to a green band, and two greens stacked (golf courses + frontline listings on the location page) read as one heavy slab. Codified a four-tier ladder (whitespace/type → hairline rules → photography → green) so sections take the lowest tier that works and green stays the page's single landing point. Tier 3 (photography) is void when the section is itself photographic (a listing rail), so the golf-courses section moved to tier 2: full-bleed white bracketed by `--border` hairline rules, elevated cards (factual spec line, framed images, no arrow). |
| 2026-06-06 | Reshaped the development page to mirror the property page; added the units inventory table | The development page kept its own image-overlay hero and rendered inventory as card grids, diverging from the built property page. Aligned it to the property pattern (full-bleed gallery → summary block with "Prices from" + badges + hairline key-facts strip → about + sticky `EnquiryRail` → similar rail → back-to area chips), and replaced the unit/unit-type card grids with a single sortable **`UnitsTable`** ("Properties available"): unit number, status, price, beds, size, floor, type, phase, completion, each available row linking to that unit's page. Columns render only when at least one unit carries the data; reserved/sold units stay listed but recede and don't link; on mobile the table collapses to one stacked, labelled record per unit (no horizontal pinch-scroll). Per-row "View →" uses the built text-link style, not the mockup's filled button. |
| 2026-06-06 | Unit pages are synthesized from the development + unit type, not authored standalone | A clicked unit renders through the existing `PropertyDetail` template, with images inherited from its unit type's shared gallery, context (location, golf, about, features, CTAs, SEO base) from its development, and only price/size/floor/number its own. Unit URLs nest under the development (`…/{development}/{unit}`) with a `/u/[ghiId]` permalink. Keeps unit authoring light and guarantees the unit page never drifts from the development's look. |
| 2026-06-25 | "Explore by country" reshaped from photo panels to a flag-led index (tier 2) | The two full-bleed landscape panels became a flag-led stacked index: hairline-bracketed rows (Emphasis Ladder tier 2), each a 1px-framed flag stamp + name + tagline + gold cue. Editors had been loading flags into `heroImage`, which rendered them scrimmed and full-bleed (and polluted the country page hero). Flags now live in a dedicated `flag` field on `locationTaxonomy` (country-only, SVG), dereferenced to a raw URL (`flag.asset->url`) so they ship crisp; the selector no longer requires or reads `heroImage`. Spain/Portugal keep built-in stamp fallbacks (matching `BuyerGuideCard`) so a country still renders before its flag is uploaded. Collapses the section's vertical footprint ~5×, especially on mobile, and scales to N countries by adding rows. |
| 2026-06-25 | Desktop nav (`SiteNav`) typography & button refreshed; collapse breakpoint raised to 72rem | The bar's all-caps links were Libre Franklin Medium 500 / 14px / `--tracking-wide` in translucent cold white (`rgba(255,255,255,.8)`) — corporate-leaning and slightly hazy (the translucency was real drift from the `--on-green` token used for text on every other green surface). Reset to **Light 300 / 13px / 0.14em** in solid `--on-green` warm ivory: lighter, more open, "expensive caps" rather than blunt, and consistent with the rest of the site's on-green text. The second-tier dropdown was elevated — anchored under the parent (was right-edge aligned), warm-ivory items at Regular 400, hairline dividers between rows, gold top accent, deeper refined shadow. Contact stays a gold fill (lead-capture prominence) but its type now matches the nav (Light/tracked, `text-indent` to optically centre the tracked caps) instead of the old heavier Medium. The airier type widened the menu to need ~1140px, so the mobile-drawer breakpoint moved 56rem → 72rem (full nav only renders when it fits; the drawer covers tablet/small-laptop). |
| 2026-06-25 | Mobile drawer aligned to the refreshed desktop nav vocabulary | The drawer had diverged: top-level items were Playfair serif mixed-case while desktop was sans caps, and children ("MARBELLA") were uppercase cold white while the desktop dropdown shows them mixed-case warm ivory — the casing was effectively inverted between the two menus. Brought the drawer onto one system: parents are now Libre Franklin Light 300 uppercase / 1rem / 0.11em in `--on-green` (the desktop treatment scaled up for touch; the Playfair wordmark keeps the serif present at the top), children are Regular 400 **uppercase / 0.1em** warm ivory with hairline row dividers echoing the desktop dropdown, and the drawer CTA matches the refined desktop Contact (weight 400, 0.14em, `text-indent`). Cold `rgba(255,255,255,.65/.75)` removed. `line-height:1.3` keeps "Front Line Collection" reading as a clean two-line item where it wraps (≤360px only; 390px+ fit one line). |
| 2026-06-25 | Submenu children set to tracked uppercase on both tiers | The desktop dropdown initially rendered children mixed-case ("Marbella"); owner preferred the tracked-uppercase treatment ("MARBELLA"). Unified both the desktop dropdown (`.site-nav__submenu-link`) and the mobile drawer (`.site-nav__drawer-sublink`) to Regular 400 uppercase / 0.1em in `--on-green` — a deliberate two-step casing system: Light-300 caps parent → Regular-400 caps child, distinguished by weight, the dropdown panel / drawer recess + indent, and the gold active markers. |
