# Cross-client QA plan

Four layers, cheapest first. Each one is only worth running if the one before it
passed.

| Layer | Cost | Catches | Command |
|---|---|---|---|
| 1. Validator | seconds | Structure, a11y, merge tags, size, brand rules | `pnpm validate` |
| 2. Local screenshots | ~30s | Layout, dark mode, mobile, blocked images, enlargement | `pnpm qa` |
| 3. Inbox Preview | tokens | Real client rendering, top clients only | Mailchimp UI |
| 4. Real devices / testing service | money or time | Everything else, especially classic Outlook | see below |

**A clean layer 1 and 2 means the build is worth testing properly. It never
means it renders correctly.**

---

## Layer 1: the validator

26 checks, each with a self-test proving it fires
(`pnpm validate:self-test`). A validator that only ever passes is worse than no
validator, so the self-test is part of the pipeline.

Covers: required content, copy length, link protocol and shape, alt text, asset
format, merge tags, footer requirements, size, colour contrast, heading order,
unsupported elements, language attributes, brand rules (green-band rationing,
overline cap, underline at rest, zero radius), RTL symmetry, and plain-text
completeness.

---

## Layer 2: local screenshots

`pnpm qa` renders every built template in Chromium across eight scenarios and
writes a contact sheet to `qa/screens/index.html`. It fails the build on
horizontal overflow, which is measurable rather than a matter of opinion.

| Scenario | Question it answers |
|---|---|
| Desktop 600px light | Does the intended design render? |
| Desktop 600px dark | Do the `dm-*` rules apply? Do the bookends hold? |
| Mobile 375px light | Does the media query tighten gutters and step type down? |
| Mobile 375px dark | Anything unreadable where dark and mobile combine? |
| Narrow 320px | Horizontal scrolling? Long words breaking the column? |
| Images blocked | Still understandable? Alt text styled, not raw? |
| Media queries stripped | Readable when a client drops the `<style>` block? |
| 200% text | Overlap or truncation when text doubles? |

**Font substitution matters here.** Chromium on a bare Linux box has neither
Georgia nor Arial and silently falls back to DejaVu, which is wider than Arial
and shorter than Georgia, so every screenshot would misreport where headlines
wrap. Install metric-compatible substitutes first:

```bash
mkdir -p ~/.fonts
curl -sfL -o ~/.fonts/Gelasio.ttf \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/gelasio/Gelasio%5Bwght%5D.ttf"
# then alias Georgia->Gelasio, Arial->Liberation Sans in
# ~/.config/fontconfig/fonts.conf, and run: fc-cache -f
```

### What layer 2 cannot tell you

Chromium is a fair proxy for Apple Mail and Gmail web, and no proxy at all for:

- **classic Outlook for Windows** (Word's engine; no media queries, its own box
  model, and the reason half the markup in this system exists)
- **Gmail's CSS filtering**, which strips rules Chromium honours
- **forced dark-mode inversion** on Gmail Android and Outlook.com, which
  transform colours rather than reading `prefers-color-scheme`

---

## Layers 3 and 4: the client matrix

**The testing-tool budget is not yet decided**, so both paths are specified. Pick
one before the first campaign; the difference is what the QA report can honestly
claim.

### Path A: with a testing service (Litmus or Email on Acid, ~$99+/month)

Full matrix with real screenshots. Every row below is testable.

| Client | Light | Dark |
|---|---|---|
| Gmail web | required | n/a |
| Gmail iPhone | required | required |
| Gmail Android | required | required |
| Classic Outlook for Windows | required | n/a |
| New Outlook for Windows | required | required |
| Outlook.com | required | required |
| Outlook iPhone or Android | required | required |
| Apple Mail macOS | required | required |
| Apple Mail iPhone | required | required |
| Yahoo or Samsung Mail | if audience data indicates | |

### Path B: in-house only (Inbox Preview + owned devices)

Mailchimp Standard includes a limited number of Inbox Preview tokens per month
(~25), which is enough for the highest-volume clients but not the full matrix.

**Named gaps, to be reported as untested rather than passing:**

- Classic Outlook for Windows, unless someone on the team has a Windows machine
  with a perpetual-licence Outlook. This is the biggest gap by risk: it is the
  client most likely to break and the one this system does the most work for.
- Gmail Android dark mode, unless someone has an Android device.
- Samsung Mail.
- Yahoo Mail.

The QA report must list these explicitly. A report asserting coverage nobody
verified is worse than a report with honest holes.

**Identify the audience's real clients first.** Mailchimp reports client usage
per campaign once you have sent one. Until then, testing priority is guesswork;
for an older, affluent UK and northern-European audience, Apple Mail and Gmail
web are the safe assumptions, with Outlook heavier than average among
corporate-client contacts.

---

## Also test, every release

- Images blocked (layer 2 covers it; confirm once in a real client)
- Narrow mobile viewport
- 200% text enlargement
- Screen-reader reading order
- Plain-text format
- Long headings and long names
- Missing personalisation data
- Long CTA labels
- Missing optional images
- Every link and its tracking parameters
- Gmail clipping
- Footer visibility
- Dark-mode logo and CTA visibility
- Slow mobile connection, where practical

**Forwarding and replying** materially alter markup. Review forwarded rendering,
but pixel-perfect forwarded messages are not an acceptance requirement.

---

## Accessibility review

Automated checks cover contrast, heading order, alt text, language and
presentational roles. Two things need a person, each release:

1. **Screen reader.** VoiceOver on macOS (Cmd+F5) reading the email in Apple
   Mail, or NVDA on Windows in Outlook. Check: the message announces as an
   article with a name; headings form a sensible outline; link text makes sense
   out of context; images are described or correctly skipped; no layout table is
   announced as a data table.
2. **Colour-blindness simulation.** Sim Daltonism (macOS) or Chrome DevTools
   → Rendering → Emulate vision deficiencies. Check deuteranopia and
   protanopia: green and gold sit close in hue, and nothing may depend on
   telling them apart.

---

## Link validation

Mailchimp's Link Checker is unavailable for Code Your Own campaigns, and even on
the template route it only confirms a URL resolves. It does not confirm the
destination *accepts* tracking parameters.

```bash
pnpm --filter email validate:links
```

Resolves every `https://` destination with a real GET (not HEAD: plenty of
servers answer HEAD with 405 while the page is fine), follows redirects, and
reports status codes and redirect targets. Merge-tag hrefs are skipped, since
they are not URLs until Mailchimp resolves them.

Separately, for each destination:

1. Open it with `?mc_cid=test&mc_eid=test&utm_source=mailchimp` appended.
2. Confirm it renders, does not redirect the parameters away, and does not
   404 on the trailing slash.

SvelteKit route handling and trailing-slash behaviour are the usual culprits.

---

## Gmail source-size validation

Gmail clips at roughly 102KB **of delivered HTML**, and the footer is what gets
cut, so unsubscribe disappears.

Compiled size is not delivered size. Mailchimp rewrites every href into a
tracking URL and injects footer markup after upload.

**Procedure:**

1. `pnpm --filter email validate` reports compiled size. Target 60KB.
2. Upload, send a test to a Gmail address.
3. In Gmail: **⋮ → Show original → Download original**.
4. Extract the `text/html` part.
5. `node bin/validate.mjs --delivered <file>` — fails over 102KB.
6. In the Gmail web client, scroll to the bottom and confirm there is no
   "[Message clipped] View entire message" link.

Current reference email: **14.4KB compiled**, 14% of the threshold. There is
substantial headroom; the constraint only bites on image-heavy campaigns with
many links.

---

## Plain-text generation and review

Mailchimp generates a plain-text version automatically. It should not be accepted
without review: it strips structure indiscriminately, drops link destinations
into bare URLs with no context, and has no idea which parts were required footer
content.

```bash
pnpm --filter email plaintext          # generate
pnpm --filter email plaintext --check  # fail if stale (runs in CI)
node bin/plaintext.mjs --print reference
```

Generation is deterministic from the same built HTML, so the two can never drift.
The footer is **rebuilt from the locale file** rather than scraped, because its
requirements are legal and a scrape would silently lose one the moment the markup
changed.

**Review checklist:**

- Every heading present and legible as a heading
- Every CTA present with its full URL
- Every inline link rendered as `label (url)`
- Image alt text present for informative images
- Wrapped at 72 characters, no URL split across lines
- Footer complete: permission reminder, address, view in browser, preferences,
  unsubscribe
- Reads as a letter, not as a stripped web page

Paste the reviewed `.txt` into Mailchimp's plain-text tab.

---

## QA report

`pnpm qa` writes `qa/screens/index.html`: a contact sheet of every scenario for
every template, with the question each screenshot answers and any overflow
flagged in red. That is the visual half of the report.

The written half is [09-qa-report.md](09-qa-report.md), which records what was
tested, what passed, what was fixed, and what remains untested.
