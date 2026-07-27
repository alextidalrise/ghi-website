# HTML email technical standard

The rules every GHI campaign must satisfy. Where a rule exists to work around a
specific client, the client is named: a rule whose reason is forgotten becomes a
rule someone deletes.

Most of this is enforced by `bin/validate.mjs`, which fails the build. Rules
that cannot be checked mechanically are marked **by review**.

---

## 1. Architecture

```
email/
  config.js                 base build config, design tokens, locale resolution
  config.production.js      purge, minify, attribute cleanup
  lib/
    tokens.mjs              single source of truth for colour, type, spacing
    locales.mjs             locale loading, direction helpers
    image-url.mjs           Sanity CDN URLs with the format pinned
    merge-tags.mjs          Mailchimp tag registry
    contrast.mjs            WCAG contrast maths
    plaintext.mjs           deterministic plain-text generation
    validate.mjs            all checks
  src/
    css/main.css            resets, one media query, dark mode
    layouts/main.html       head, preheader, masthead, footer  (LOCKED)
    components/*.html       the primitive vocabulary
    templates/*.html        one file per campaign per locale
  locales/*.json            en, es, pt, ar
  build_production/         compiled HTML + .txt, COMMITTED
  qa/screens/               QA contact sheet
```

**Compiled output is committed.** A pull request shows the exact HTML that will
be uploaded, not just the source that generates it. Reviewing a diff of the
delivered file is the only way to catch a build-tool change that alters output.

### Build

```bash
pnpm --filter email assets      # regenerate logo PNGs and reference photo
pnpm --filter email build       # compile + generate plain text
pnpm --filter email check       # self-test, build, validate, plaintext, screenshots
```

The build is deterministic Node with no browser execution. Same input, same
byte-for-byte output. That is a hard requirement for the agent phase and it is
why nothing in the pipeline renders or measures anything at build time.

**Maizzle 5, not 6.** Maizzle 6 is a Vite and Vue rewrite whose template
compiler strips HTML comments in production builds. Outlook conditional markup
*is* an HTML comment, so every Outlook fix in this system would vanish silently.
Version 5 uses PostHTML and preserves them. Do not upgrade without verifying
that conditional comments survive; there is a check for this in
`bin/validate-self-test.mjs`'s sibling, and `pnpm qa` would show the damage.

---

## 2. Layout

| Rule | Why |
|---|---|
| Max content width 600px | The widest column that fits an Outlook reading pane without a horizontal scrollbar. |
| Fluid 100% outer wrapper, `max-width: 600px` inner | The column shrinks if a client strips media queries, instead of forcing a scroll. |
| `role="presentation"` on every layout table | Otherwise screen readers announce structure as a data table, row by row. |
| Structural spacing through `<td>` padding only | Word's engine treats margins on `div` and `p` inconsistently. |
| Never Flexbox, Grid, absolute positioning, float-based layout | No support in Word's engine. |
| Horizontal padding must be symmetric | Email has no logical properties (`padding-inline-start`), so asymmetric padding cannot mirror for RTL. |
| Source order is reading order | There is no reordering mechanism; what you write is what a screen reader gets. |
| No horizontal scrolling at 320px | Checked mechanically by `pnpm qa`. |

Structure is `tr > td (ground and gutter) > table`, with each child a `tr > td`
carrying its own bottom padding. That keeps every gap a cell padding.

---

## 3. CSS

**Critical presentation CSS is written inline by the components.** Font family,
size, line height, colour, background, width, alignment, padding and borders all
live in the `style` attribute.

**The embedded `<style>` block is deliberately limited** to three things:
client resets, the single responsive breakpoint, and dark-mode enhancements.
Nothing there may carry meaning. Every client is allowed to discard the whole
block and the email must still read correctly.

`css.inline` is **off** in `config.production.js`. Turning it on would drag the
resets and dark-mode rules onto elements, which both bloats the file and defeats
the resets: an inlined reset cannot be overridden by the media query that needs
to override it.

### Required on every text-bearing cell

`mso-line-height-rule: exactly`. Without it Word rounds line-height to whole
points, so a 39px leading renders at 41px and the drift accumulates visibly down
a long email.

### Banned outright

`border-radius` (brand rule, zero radius everywhere), `box-shadow`, gradients,
`@font-face`, JavaScript, iframes, forms, embedded audio and video, CSS-only
interactive controls. All fail the build.

---

## 4. Outlook

**Classic Outlook for Windows** uses Word's rendering engine. **New Outlook and
Outlook.com** use a modern web renderer with its own CSS filtering.

What this system does for classic Outlook:

- `<o:PixelsPerInch>96</o:PixelsPerInch>`, because Word renders at 120dpi and
  would otherwise scale a 600px column to 750px and clip it.
- A conditional `<table width="600">` wrapper, because Outlook ignores
  `max-width`.
- `mso-table-lspace` and `mso-table-rspace` zeroed, killing Word's phantom
  1.5pt table spacing.
- Hairlines drawn as 1px-tall filled cells rather than borders, because Word
  renders sub-pixel borders inconsistently.
- `font-size: 0; line-height: 1px` on spacer and hairline cells, or they inflate
  to a full text line.

**No VML anywhere, and no rounded-corner workaround.** The brand's zero-radius
rule removes the single most common reason email CTAs need Outlook-specific
code. Keep it that way.

**Never nest an HTML comment inside a conditional comment.** The first close
sequence terminates the conditional early and dumps raw markup as visible text
in every non-Outlook client. This has happened once already in this codebase.

---

## 5. Typography

**Georgia and Arial are the design baseline, not the fallback.** Gmail on every
platform, both Outlooks for Windows, Outlook.com and Yahoo strip web fonts, so
most opens never see Playfair Display or Libre Franklin. Every size in
`lib/tokens.mjs` was chosen against the fallback metrics.

| Role | Size / leading | Mobile |
|---|---|---|
| Display (h1) | 34 / 39 | 28 / 33 |
| h2 | 24 / 29 | 22 / 27 |
| h3 | 19 / 25 | — |
| Lead | 18 / 29 | 17 / 27 |
| Body | 16 / 26 | — |
| UI | 14 / 21 | — |
| Legal | 13 / 21 | — |
| Overline | 11 / 11 | — |

Body 16px, legal floor 13px. Font stacks are **unquoted** (`Playfair Display,
Georgia, serif`): quoting emits `&#039;` into every style attribute, costing six
bytes instead of one and relying on the client decoding entities before parsing
CSS, which Word does not reliably do.

Full brand translation table, including what does not survive: [02-brand-rules.md](02-brand-rules.md).

---

## 6. Buttons and links

- Table with a padded cell. Word ignores padding on inline elements, so a padded
  anchor collapses to bare text in classic Outlook.
- Live text only. Never an image of a button.
- 52px tall (16 + 20 + 16), clearing the 44px minimum. Full width on phones.
- Solid fill, never outline-only, so it survives colour transformation.
- **Links underlined at rest.** Email has no hover, so colour alone would be the
  only signal (WCAG 1.4.1). The site's hover vocabulary does not translate.
- Absolute HTTPS destinations. No relative paths; email has no base URL.
- Write a plain `&` in template hrefs. Writing `&amp;` produces `&amp;amp;` in
  the output, which ships a literal `&amp;` in the query string and silently
  breaks every UTM parameter after the first.

---

## 7. Images

| Rule | Detail |
|---|---|
| Formats | JPG for photography, PNG for logos and transparency, GIF if animated. Never SVG, WebP, AVIF, Base64 or `cid:` attachments. |
| Hosting: brand chrome | Static under `web/static/email/`, generated by `bin/build-assets.mjs`, served from the brand domain. |
| Hosting: campaign imagery | Sanity CDN via `buildEmailImageUrl()`. |
| **Format must be pinned** | Use `fm=jpg`, never `auto=format`. The site's helper negotiates AVIF/WebP, which classic Outlook cannot render. This is the single most likely mistake and the validator fails on it. |
| Sizing | Serve at 2x the display slot, constrain with CSS, carry `width`/`height` attributes describing the *display* slot. |
| Quality | q78 progressive JPEG. Budget ~600KB of imagery per campaign. |
| Alt text | Required on every image. `alt=""` for decorative. Styled inline so blocked images degrade to readable brand text, not small blue Times New Roman. |
| Alt colour | Charcoal on the stone placeholder. Muted grey measures 3.96:1 there and fails AA in exactly the moment alt text has a job. |
| No essential copy or CTA inside an image | By review. |

The logo is a **flattened** PNG, not transparent. A transparent PNG with light
ink lands on a light ground the moment a client inverts the surface behind it,
and the wordmark disappears.

---

## 8. Dark mode

Five client behaviours have to be survivable: no change, honours
`prefers-color-scheme`, ignores it, partial inversion, full inversion.

**The strategy is green bookends.** The masthead and footer sit on `#1f3d34` in
both modes. A dark ground is what inverting clients leave alone, so the logo and
the entire required footer render consistently everywhere. The white editorial
body between them is the exposed surface, which is why every text node carries
an explicit inline `color` and never relies on an inherited default.

Dark rules live in `src/css/main.css` under `@media (prefers-color-scheme: dark)`
plus `[data-ogsc]` / `[data-ogsb]` hooks for Outlook.com, wrapped in
`@media screen` so inlining preserves them. All carry `!important`, because by
then the light values are inline styles.

The green band gains a **gold hairline edge**: `#1f3d34` against the dark body
`#1c231e` is 1.35:1, so without an edge the heaviest device in the kit vanishes
in dark mode. The CTA gains a sage border for the same reason, which is WCAG
2.2 non-text contrast (1.4.11) doing real work rather than decoration.

Full guidance: [02-brand-rules.md](02-brand-rules.md#dark-mode).

---

## 9. Accessibility

Target WCAG 2.2 AA.

| Requirement | How |
|---|---|
| 4.5:1 normal text, 3:1 large | Measured by the validator against resolved backgrounds. |
| Logical heading hierarchy | Exactly one h1, no skipped levels. Enforced. |
| Logical reading order | Source order is reading order by construction. |
| Descriptive link text | By review. No "click here". |
| Alt text | Enforced. |
| `role="presentation"` on layout tables | Enforced. |
| No essential images of text | By review. |
| Touch targets | 52px CTA height, full width on mobile. |
| Usable when enlarged | Checked at 200% by `pnpm qa`. |
| Language attribute | `lang` and `dir` from the locale. Enforced. |
| No meaning from colour alone | Links underlined at rest. Enforced as a warning. |
| Screen-reader compatibility | `role="article"` + `aria-roledescription="email"` landmark. |

Beyond the automated checks, each release needs a screen-reader pass and a
colour-blindness simulation. See [04-qa-plan.md](04-qa-plan.md).

---

## 10. Size

Gmail clips delivered HTML at roughly 102KB, and **the footer is what gets cut**,
so unsubscribe disappears.

- Working target: **60KB compiled**, not the 85–90KB in the original brief.
  Mailchimp rewrites every href into a tracking URL (~150 bytes each) and injects
  footer markup *after* we hand the file over, so compiled size systematically
  understates delivered size.
- Hard ceiling: 102KB delivered.
- Current reference email: **14.4KB**, 14% of the threshold.

Measuring the delivered file is a separate procedure:
[04-qa-plan.md](04-qa-plan.md#gmail-source-size-validation).

---

## 11. Multi-lingual

One campaign is one locale. Mailchimp sends to a language segment, so a
translated campaign is a separate template file and a separate campaign, not a
switch inside one email.

`locales/*.json` carries the locked system strings and `dir`. `en`, `es`, `pt`
and `ar` are seeded; Arabic is not hypothetical, since
[`docs/uae-expansion-plan.md`](../../docs/uae-expansion-plan.md) puts Dubai next.

RTL works because **every component is horizontally symmetric**. Right-to-left
reduces to the `dir` attribute, the alignment keyword, and the arrow glyph. There
is no parallel stylesheet. Letter-spacing is dropped for RTL locales, because
Arabic is cursive and tracking forces gaps between glyphs that must join.

Adding a locale: add `locales/<code>.json`, add a template with
`locale: <code>` in front matter, build. Nothing else changes.

Outstanding: Arabic type sizes have not been reviewed by a native reader. The
11px overline in particular is likely too small for comfortable Arabic. Raise
before the first UAE campaign.
