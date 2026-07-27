# QA report

**Date:** 2026-07-24
**Build:** foundation phase, initial
**Templates:** `reference` (en, LTR), `reference-ar` (ar, RTL)

Read alongside the visual contact sheet at `qa/screens/index.html`, which holds
all 16 screenshots.

---

## Summary

| | |
|---|---|
| Validator | **0 errors, 0 warnings** across both templates |
| Validator self-test | **26/26 checks verified as firing** |
| Local render scenarios | **8 per template, 16 total, no horizontal overflow at any width** |
| Compiled size | 14.4KB (en), 14.7KB (ar) — **14% of the ~102KB clipping threshold** |
| Embedded `<style>` block | 2.3KB |
| Image weight | 130KB hero + 11KB logo = **141KB**, against a 600KB budget |
| Plain-text | Generated, deterministic, complete; committed and checked in CI |
| Real client testing | **Not performed.** See gaps below. |

---

## What was tested

Chromium via Playwright, with Georgia and Arial substituted by metric-compatible
fonts (Gelasio, Liberation Sans) so wrap points are accurate rather than
approximate.

| Scenario | en | ar | Result |
|---|---|---|---|
| Desktop 600px, light | ✓ | ✓ | Pass |
| Desktop 600px, dark | ✓ | ✓ | Pass |
| Mobile 375px, light | ✓ | ✓ | Pass |
| Mobile 375px, dark | ✓ | ✓ | Pass |
| Narrow 320px | ✓ | ✓ | Pass, no overflow |
| Images blocked | ✓ | ✓ | Pass, alt text legible |
| Media queries stripped | ✓ | ✓ | Pass, falls back to desktop layout |
| 200% text enlargement | ✓ | ✓ | Pass, no overlap or truncation |

Automated checks: contrast against resolved backgrounds, heading order, alt text,
merge-tag validity and balance, footer requirements, asset protocol and format,
size, unsupported elements, language attributes, RTL padding symmetry, and the
brand rules (green-band rationing, overline cap, underline at rest, zero radius).

---

## Defects found and fixed during this build

Every one of these was caught by the tooling built alongside the system, which
is the point of building it.

| # | Defect | Found by | Severity |
|---|---|---|---|
| 1 | **Double-escaped ampersand.** `&amp;` in a template href compiled to `&amp;amp;`, shipping a literal `&amp;` in the query string. Every UTM parameter after the first would have merged into the previous value, reporting the campaign as untagged traffic. | Plain-text review | **Shipping defect** |
| 2 | **Comment leak.** A literal `-->` inside a layout comment closed it early, dumping raw markup as visible text at the top of every render. The comment was warning against exactly this. | Screenshot | **Shipping defect** |
| 3 | **Alt text failed contrast.** Blocked-image alt text was muted grey on the stone placeholder: 3.96:1, below AA. It failed in precisely the moment alt text has a job. | Validator | **Accessibility** |
| 4 | **Masthead alt text clipped.** A fixed CSS height on the logo cut "Golf Homes International" to "Golf Homes" when images were blocked, so the brand name was wrong exactly when the alt text was all there was. | Screenshot | **Accessibility** |
| 5 | **Green band merged with the footer.** The band sat directly above the green footer, forming one continuous slab roughly 40% of the email tall, defeating the bookend structure. | Screenshot | Design |
| 6 | **Band invisible in dark mode.** `#1f3d34` against the dark body is 1.35:1, so the heaviest device in the kit vanished. Fixed by adding the gold hairline edges DESIGN.md specifies for tier-4 bands. | Screenshot | Design |
| 7 | **Letter-spacing broke Arabic.** Tracking on the overline and CTA forced gaps between cursive glyphs that must join. Now dropped for RTL locales. | RTL screenshot | i18n |
| 8 | **Component props rendered empty.** A comparison against an unpassed prop throws inside posthtml-expressions and swallows the whole expression, producing `color:;` and `bgcolor=""` with no build error. Every prop now has a default. | Build output inspection | **Systemic** |
| 9 | **`level="1"` never matched.** posthtml-component `JSON.parse`s attributes, so `"1"` became `1` and `=== '1'` silently failed: every heading rendered as `h2`. | Build output inspection | Accessibility |
| 10 | **`gap="0"` restored the default.** The same coercion made zero falsy, so `{{ gap \|\| 24 }}` turned a deliberate zero into 24px. | Build output inspection | Systemic |
| 11 | **Plain text lost every heading and CTA.** A flat regex alternation matched the enclosing `<td>` before the `<h1>` inside it and consumed it. | Validator | Content |
| 12 | **Plain text duplicated the permission reminder** and omitted the hero image description. | Validator | Content |

### Validator defects found by the self-test

Building deliberately broken fixtures exposed four false positives that would
have trained everyone to ignore the tool:

- The contrast walker never popped its background stack, so the stone image
  background leaked into later siblings and reported confident, precise, wrong
  failures.
- The preheader length check matched `mso-hide: all` inside the `<style>` block
  and measured half the document, permanently reporting a 113-character
  preheader as 409.
- The green-band count included CTA buttons, since those are green-filled cells
  too, reporting a correct email as having twice the bands it had.
- The band-above-footer check compared the footer against itself and failed
  every correct email.

Hidden text is now excluded from contrast checking entirely: the preheader is
deliberately white-on-white at 1px.

---

## Gaps: what has NOT been tested

This is the honest part. A clean local run means the build is worth testing
properly, not that it renders correctly.

| Client | Status | Risk |
|---|---|---|
| **Classic Outlook for Windows** | **Untested** | **Highest.** Word's engine, no media queries, its own box model. Half the markup in this system exists for it. |
| Gmail web | Untested in situ | Medium. Chromium proxies the renderer but not Gmail's CSS filtering. |
| Gmail iOS / Android, light and dark | Untested | High for dark mode: Gmail Android forces its own inversion. |
| New Outlook for Windows | Untested | Medium. |
| Outlook.com | Untested | Medium. The `[data-ogsc]` hooks are written but unverified. |
| Outlook iOS / Android | Untested | Medium. |
| Apple Mail macOS / iOS | Untested in situ | Lower. Chromium is a reasonable proxy and this is the one client that honours the web fonts. |
| Yahoo / Samsung Mail | Untested | Unknown until audience data exists. |

Also outstanding:

- **Screen-reader pass.** Not performed. The structural requirements are met
  (`role="article"`, landmark labelling, one h1, no skipped levels,
  presentational tables, descriptive links), but nobody has listened to it.
- **Colour-blindness simulation.** Not performed. Green and gold sit close in
  hue; nothing should depend on telling them apart, and that needs confirming.
- **Live link resolution.** `validate:links` has not been run against production
  URLs, and two destinations in the reference email
  (`/guides/reading-a-frontline-listing`, `/spain/andalucia`) may not exist yet.
- **Delivered-source validation.** Requires a Mailchimp account and an upload.
  The `--delivered` mode is built and untested against real Mailchimp output.
- **Arabic copy and type review** by a native reader.

---

## Recommendation

The foundation is ready for the client-matrix phase. The next actions, in order:

1. Decide the testing-tool budget ([04-qa-plan.md](04-qa-plan.md), paths A and B).
2. Upload the reference email to Mailchimp as a template and run the full send
   checklist against it, including `--delivered`. Doing this with the reference
   fixture rather than a real campaign means the first real send is not also the
   first upload.
3. Confirm the audience's actual merge fields.
4. Screen-reader and colour-blindness passes.
5. Then, and only then, brief the template and component design phase.
