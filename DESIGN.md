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

### Display / Headings: Cormorant Garamond
- **Weights used:** Light 300 (display), Regular 400 (section headings)
- **Rationale:** High-contrast transitional serif with dramatic thin strokes. At large sizes, the delicate hairlines create a "whisper, don't shout" effect. Reads as established, European, timeless. Not commonly seen in tech or SaaS -- places the brand firmly in the editorial/luxury space.
- **Loading:** Google Fonts -- `family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400`

### Body / UI: Libre Franklin
- **Weights used:** Light 300 (body text), Regular 400 (UI labels, prices), Medium 500 (overlines, navigation labels)
- **Rationale:** A revival of Morris Fuller Benton's 1912 Franklin Gothic. Genuine warmth in the letterforms without being quirky. Not on any AI's default list. It defers to the serif in the hierarchy while remaining comfortable at small sizes.
- **Loading:** Google Fonts -- `family=Libre+Franklin:ital,wght@0,300;0,400;0,500;1,300;1,400`

### Type Scale

| Level | Font | Weight | Size | Line Height | Tracking | Usage |
|-------|------|--------|------|-------------|----------|-------|
| Display | Cormorant Garamond | Light 300 | 4rem (64px) | 1.05 | -0.02em | Hero headlines, page titles |
| H2 | Cormorant Garamond | Regular 400 | 2.5rem (40px) | 1.1 | normal | Section headings |
| H3 | Cormorant Garamond | Regular 400 | 1.75rem (28px) | 1.2 | normal | Card titles, sub-sections |
| H4 | Cormorant Garamond | Regular 400 | 1.5rem (24px) | 1.2 | normal | Property names |
| Body | Libre Franklin | Light 300 | 1rem (16px) | 1.7 | normal | Long-form copy, descriptions |
| UI | Libre Franklin | Regular 400 | 0.95rem (15.2px) | 1.6 | normal | Input text, prices, labels |
| Small | Libre Franklin | Regular 400 | 0.9rem (14.4px) | 1.6 | normal | Nav links, card metadata |
| Overline | Libre Franklin | Medium 500 | 0.7rem (11.2px) | normal | 0.15em | Category labels, section markers |
| Caption | Libre Franklin | Regular 400 | 0.75rem (12px) | 1.5 | normal | Metadata, hex values, fine print |

### Data / Tables
- **Font:** Libre Franklin with `font-feature-settings: 'tnum'` for tabular numerals
- **Usage:** Property prices, dimensions, dates

## Color

### Approach: Restrained
Color is used sparingly and with intent. The palette traces back to the landscape: fairway greens, coastal sand, Mediterranean linen, and stone white. Gold is the only accent and is reserved for interactive states and emphasis.

### Palette

| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Deep Golf Green | `#1F3D34` | `--green` | Primary. Typography, structural borders, dark backgrounds, primary buttons. |
| Soft Linen | `#F5F1E8` | `--linen` | Surface. Warm tone for feature sections, alternating panels, and photography mounts. |
| Sand Gold | `#D6C3A3` | `--gold` | Accent. Interactive states, overlines, hover underlines. Used sparingly. |
| White | `#FFFFFF` | `--white` | Background. Primary canvas across all surfaces; cards are defined by 1px borders. |
| Charcoal | `#2B2B2B` | `--charcoal` | Body text, secondary headings. |
| Stone Border | `#E2DED5` | `--border` | 1px structural borders, dividers, input underlines. |
| Muted | `#7A7A7A` | `--muted` | Secondary text, descriptions, metadata. |

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
| `--linen` | `#F5F1E8` | `#151B17` |
| `--charcoal` | `#2B2B2B` | `#E8E5DF` |
| `--white` | `#FFFFFF` | `#1C231E` |
| `--border` | `#E2DED5` | `#2A332C` |
| `--muted` | `#7A7A7A` | `#8A8A8A` |
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
| On Dark | transparent | `--linen` | `rgba(linen, 0.4)` | bg becomes `--linen`, text becomes `--green` |

Button padding: `0.875rem 2rem`
Font: Libre Franklin, Regular 400, 0.85rem, letter-spacing 0.04em

### Text Links
Underline on hover (not at rest). Arrow (`→`) slides right 3px on hover. Color transitions from green to gold on hover.

### Property Cards
- White surface, 1px border, no shadow at rest
- Image: 3:2 aspect ratio, `object-fit: cover`, scales to 1.03 on hover
- Location badge: white chip overlaid on bottom-left of image
- Metadata: dot-separated (using pseudo-element `::after` with 3px gold dot)
- Title: Cormorant Garamond, Regular 400, 1.5rem
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
    --linen: #F5F1E8;
    --gold: #D6C3A3;
    --charcoal: #2B2B2B;
    --white: #FFFFFF;
    --border: #E2DED5;
    --muted: #7A7A7A;

    --serif: 'Cormorant Garamond', 'Georgia', serif;
    --sans: 'Libre Franklin', 'Helvetica Neue', Helvetica, Arial, sans-serif;

    --ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Libre+Franklin:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" rel="stylesheet">
```

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-07 | Green + linen + gold palette selected | Derived from the landscape: fairway greens, coastal sand, Mediterranean light. Restrained to 4 core colors. |
| 2026-05-07 | Cormorant Garamond for display | High-contrast transitional serif. Delicate hairlines create understated luxury at large sizes. Distinctly European. |
| 2026-05-07 | Libre Franklin for body/UI | 1912 Franklin Gothic revival. Warm without being quirky. Not on any AI default list. Defers to the serif. |
| 2026-05-07 | Zero border-radius everywhere | Deliberate departure from convention. Square corners signal precision and editorial authority. |
| 2026-05-07 | Bottom-border-only form inputs | Another deliberate departure. Forms feel like a considered questionnaire, not a web form. |
| 2026-05-07 | Asymmetric hero layouts | Editorial composition over centered templates. Text offset, image bleeding to edge. Feels curated. |
| 2026-05-07 | Rejected Inter, Montserrat, Playfair Display | Inter and Montserrat are overused. Playfair Display is common in luxury templates and reads as "vibe-coded." |
| 2026-05-09 | Page background switched from Soft Linen to White | Cleaner, more modern canvas. Linen retained in the palette as a warm surface for feature sections and on-dark contrast; cards now rely on the 1px Stone Border for definition. |

## Preview
See `design-system/index.html` for a live rendering of all tokens and components.
