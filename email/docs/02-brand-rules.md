# Brand rules for email

How the GHI design system translates to the inbox, and what does not survive the
journey.

The governing principle from the brief: **functional and brand consistency, not
pixel identity**. Font substitution, square corners in old Outlook, a hairline
that disappears under colour transformation. All acceptable, provided content,
hierarchy and actions stay clear.

---

## What does not survive

These are losses, not oversights. Naming them here stops every campaign
relitigating them.

| Site device | Email | Why |
|---|---|---|
| Underline on hover only | **Underline at rest**, green | No hover state exists. WCAG 1.4.1 forbids colour as the only link signal. |
| Green to gold on hover | Static green | No hover. |
| Arrow slides 3px on hover | Static `→` glyph | No motion. |
| Libre Franklin **Light 300** body | **Regular 400** | Arial has no light weight; most recipients see the fallback. Designing to a weight most people never receive tunes the measure for the wrong rendering. |
| Light-on-dark compensation (weight 350, leading 1.8, tracking 0.01em) | Not applied | Depends on a weight axis the fallback does not have. |
| `clamp()` fluid type | Fixed px + one mobile media query | No `clamp()` support across the matrix. |
| Gold as accent text | Gold as **fill only** | `#d6c3a3` on white is ~1.7:1. Fails AA badly. |
| `--surface-tint` green wash | Dropped | An `oklch()` value with no client support, and a whisper-faint tint is the first thing forced inversion destroys. |
| `--green-soft` display italic | Dropped | Derived with `color-mix()`, unsupported. |
| 112px section gap | 56px maximum | At 600px wide, 112px reads as an accidentally blank screen. |
| 1060px content max | 600px | Widest column that fits an Outlook reading pane. |
| Motion (0.3s hover, 0.4s lift, 0.6s image scale) | None | Email is static. |

**Zero border-radius is an unexpected advantage.** Square corners mean the CTA
is a plain table cell: no VML, no `<v:roundrect>`, no conditional markup, and
identical rendering in classic Outlook and Apple Mail. Rounded corners are the
single most common reason email CTAs need Outlook-specific code, and this brand
does not have them. Keep it that way.

---

## Colour

Light mode is identical to the site.

| Token | Hex | Role in email |
|---|---|---|
| `green` | `#1f3d34` | Masthead and footer ground, primary CTA fill, headings, links. |
| `gold` | `#d6c3a3` | Hairline edges on green bands, links on green, secondary CTA fill. **Never ink on a light ground.** |
| `white` | `#ffffff` | The body surface and the outer canvas. |
| `on-green` | `#f5f1e8` | Ink on green surfaces only. Never a surface. |
| `charcoal` | `#2b2b2b` | Body copy. Also alt text on the stone placeholder. |
| `border` | `#e2ded5` | 1px hairlines, image placeholder ground. Decorative only. |
| `muted` | `#6b6b6b` | Secondary text on white. 5.3:1. |

### Measured contrast

Every pair the system can produce, verified by `lib/contrast.mjs`:

| Pair | Ratio | Floor | |
|---|---|---|---|
| charcoal on white | 14.15:1 | 4.5 | pass |
| muted on white | 5.32:1 | 4.5 | pass |
| green on white | 11.82:1 | 4.5 | pass |
| ivory on green | 10.49:1 | 4.5 | pass |
| gold on green | 6.86:1 | 4.5 | pass |
| green on gold (gold CTA label) | 6.86:1 | 4.5 | pass |
| charcoal on stone (blocked-image alt) | 10.54:1 | 4.5 | pass |
| dark: ink on dark body | 12.76:1 | 4.5 | pass |
| dark: muted on dark body | 4.64:1 | 4.5 | pass |
| dark: sage CTA edge on dark body | 10.51:1 | 3.0 | pass |
| **muted on stone** | **3.96:1** | 4.5 | **fails, do not use** |
| **gold on white** | **1.72:1** | 4.5 | **banned** |
| **green fill on dark body** | **1.35:1** | 3.0 | **needs the sage edge** |

Reproduce these at any time:

```bash
node -e "import('./lib/contrast.mjs').then(async(c)=>{const{color}=await import('./lib/tokens.mjs');
console.log(c.formatRatio(c.contrastRatio(color.gold, color.white)))})"
```

The last three are why gold is a fill and not ink, why blocked-image alt text is
charcoal rather than muted, and why the dark-mode CTA gains a border.

---

## The Emphasis Ladder in email

Ported from DESIGN.md, compressed for a 600px column. Take the **lowest tier
that does the job**.

| Tier | Device | Budget per email |
|---|---|---|
| 1 | Whitespace, width, type scale | unlimited |
| 2 | Hairline rule (`x-rule`) | generous |
| 3 | Full-bleed photography (`x-figure`) | 1–2 |
| 4 | Full-bleed green band (`x-band`) with gold hairline edges | **1 in the body, hard cap** |

The **masthead already spends the brand's green-punctuation budget.** The footer
is chrome and does not count. That leaves exactly one green band available to a
campaign, for the single most important moment.

**A green band may not sit immediately above the footer.** The footer is also
green, so the two merge into one continuous slab roughly 40% of the email tall,
which defeats the bookend structure the whole dark-mode strategy rests on. Close
the body on white. Both rules fail the build.

Tier 3 does not apply when the section's own content is already photographic;
image-on-image competes.

Overlines are capped at **one per email**. The brand has a real overline in its
type scale, so it is not banned; what is banned is the reflex of a tracked label
above every section, which reads as a template rather than a voice.

---

## Spacing

8px base, same as the site.

| Step | px | Use |
|---|---|---|
| Element gap | 24 | Between paragraphs. |
| Heading gap | 16–20 | Below a heading. |
| Block gap | 40 | Section padding, top and bottom. |
| Section gap | 56 | Band padding. |
| Gutter | 32 desktop, 24 mobile | Column side padding. |

Only one thing changes on mobile besides type: the gutter tightens to 24px. The
vertical rhythm holds, because 40px is already modest at phone width.

---

## Dark mode

| Token | Light | Dark |
|---|---|---|
| Outer canvas | `#ffffff` | `#0e1410` |
| Body surface | `#ffffff` | `#1c231e` |
| Body ink | `#2b2b2b` | `#e8e5df` |
| Muted | `#6b6b6b` | `#8a8a8a` |
| Headings and links | `#1f3d34` | `#c5d6c0` |
| Hairline | `#e2ded5` | `#2a332c` |
| **Masthead and footer ground** | `#1f3d34` | **`#1f3d34`, unchanged** |
| CTA | green fill, ivory label | green fill, ivory label, **plus sage edge** |

The bookends deliberately do not invert. That is the whole strategy: a dark
ground is what inverting clients leave alone, so the logo and the required
footer render consistently in all five client behaviours.

Rules of thumb:

- Define important foreground and background colours explicitly. Never inherit.
- Prefer off-white and near-black over pure white and black. The palette already
  does: `#f5f1e8` and `#1c231e`, not `#ffffff` and `#000000`.
- Solid CTA fills, never outline-only.
- No essential text inside a transparent image.
- No meaning from colour alone.
- Accept that Gmail Android and some Outlook builds will transform colours
  regardless. The bookends are what make that survivable.

---

## Component vocabulary

Primitives, not content modules. Template and component *inventory* is a later
phase; this is the alphabet those will be written in.

| Component | Renders | Notes |
|---|---|---|
| `x-main` | The whole document | Layout. Owns masthead and footer. **Locked.** |
| `x-section` | White band | `pt`, `pb`, `edit` |
| `x-band` | Green band with gold edges | Rationed to 1. `pt`, `pb`, `edit` |
| `x-heading` | h1/h2/h3 | `level`, `size`, `tone`, `gap` |
| `x-text` | Paragraph | `variant` (lead/body/ui/legal), `tone`, `gap` |
| `x-button` | Table-based CTA | `href`, `variant` (primary/gold), `gap` |
| `x-link` | Inline anchor | `href`, `tone`. Underlined at rest. |
| `x-rule` | 1px hairline | `gap`, `tone` |
| `x-figure` | Full-bleed image | `src`, `alt`, `width`, `height`, `href`, `caption`, `edit` |
| `x-overline` | Tracked label | Capped at 1. `tone`, `gap` |
| `x-spacer` | Vertical space | `height`, `tone` |

**Numeric props are compared with `==`, and zero is expressed as `gap="0"`.**
posthtml-component runs `JSON.parse` over attribute values, so `level="1"`
arrives as the number `1`; a `=== '1'` comparison silently never matches and the
component renders its fallback branch. The same coercion makes `gap="0"` falsy,
so components check `prop === ''` rather than truthiness. Every prop needs a
default in `config.js`, or a comparison against it throws and the whole
expression renders empty, producing `color:;` with no build error.

### Requirements any future component must satisfy

1. Horizontally symmetric padding, or RTL breaks.
2. All spacing through `<td>` padding.
3. `role="presentation"` on every table.
4. `mso-line-height-rule: exactly` on every text cell.
5. Explicit inline `color` and `background-color` on anything that shows either.
6. A `dm-*` class wherever a colour needs to change in dark mode.
7. Readable with the `<style>` block removed.
8. No border-radius, shadow, gradient, flex, grid or positioning.
9. An `edit` prop if a marketer may change its contents.
10. A default in `config.js` for every prop it reads.
