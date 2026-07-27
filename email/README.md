# GHI email

The HTML email foundation for Golf Homes International: brand tokens translated
to email-safe values, a component vocabulary, a deterministic build, a validator
that enforces the brand rules, and a QA harness.

This phase deliberately does **not** define template types, individual template
designs, a component inventory, or campaign content structures. It makes those
decisions cheap to execute later.

---

## Quick start

```bash
pnpm install
pnpm --filter email assets     # generate logo PNGs and the reference photo
pnpm --filter email check      # self-test, build, validate, plaintext, screenshots
open email/qa/screens/index.html
```

## Commands

| Command | What it does |
|---|---|
| `pnpm build` | Compile to `build_production/` and generate plain text |
| `pnpm build:local` | Readable, unminified build to `build_local/` |
| `pnpm dev` | Maizzle dev server with live reload |
| `pnpm assets` | Regenerate logo PNGs and the reference photograph from source |
| `pnpm validate` | All checks against the compiled output |
| `pnpm validate:links` | Resolve every campaign link over HTTP (run before a send) |
| `pnpm validate:self-test` | Prove the validator's 26 checks still fire |
| `pnpm plaintext` | Generate `.txt` alternatives |
| `pnpm qa` | Screenshot every template across 8 scenarios |
| `pnpm check` | Everything except live links. This is what CI runs. |

Validating what Mailchimp actually delivered, which is the run that matters for
size and links:

```bash
node bin/validate.mjs --delivered ~/Downloads/delivered.html
```

---

## Documentation

| | |
|---|---|
| [01-technical-standard.md](docs/01-technical-standard.md) | Architecture, layout, CSS, Outlook, typography, images, dark mode, accessibility, size, multi-lingual |
| [02-brand-rules.md](docs/02-brand-rules.md) | Brand translation, what does not survive, measured contrast, the Emphasis Ladder in email, component vocabulary |
| [03-mailchimp.md](docs/03-mailchimp.md) | Template vs Code Your Own, editable regions, merge tags, Mailchimp's limitations, send checklist |
| [04-qa-plan.md](docs/04-qa-plan.md) | Four QA layers, the client matrix (both budget paths), link validation, size validation, plain-text review |
| [05-release-process.md](docs/05-release-process.md) | Campaign vs system releases, CI, rollback, decisions log |
| [06-handover-marketers.md](docs/06-handover-marketers.md) | For whoever writes and sends. No code required. |
| [07-agent-integration.md](docs/07-agent-integration.md) | What the foundation guarantees for programmatic campaign creation, and the sharp edges |
| [08-known-limitations.md](docs/08-known-limitations.md) | Accepted degradation, real limitations, open questions |
| [09-qa-report.md](docs/09-qa-report.md) | What was tested, what was fixed, what remains untested |

---

## The five things most likely to trip you up

1. **Write a plain `&` in hrefs, never `&amp;`.** PostHTML escapes it again, so
   the delivered URL gets a literal `&amp;` and the UTM parameters break.
2. **Every component prop needs a default in `config.js`.** A comparison against
   an undefined prop throws inside posthtml-expressions and silently renders the
   whole expression as an empty string, producing `color:;` with no build error.
3. **Numeric attributes are `JSON.parse`d.** `level="1"` arrives as the number
   `1`, so comparisons use `==`; `gap="0"` arrives falsy, so components check
   `prop === ''` rather than truthiness.
4. **Never nest an HTML comment inside a conditional comment.** The close
   sequence terminates the conditional early and dumps raw markup into every
   non-Outlook client.
5. **Pin the image format.** `buildEmailImageUrl()`, not the site's
   `buildPublicImageUrl()`, which negotiates AVIF/WebP that classic Outlook
   cannot render.

## The two design rules the build enforces

- **One green band in the body**, and never immediately above the footer. The
  masthead already spends the brand's green-punctuation budget and the footer is
  green too; a third merges into one slab.
- **One overline per email.** One reads as a brand mark. One above every section
  reads as a template.

---

## Reference emails

`src/templates/reference.html` (English) and `reference-ar.html` (Arabic, RTL)
are the proving fixtures, not campaign templates. They exercise every primitive
and every edge case the QA plan tests, so a system change shows up somewhere
visible. Rebuild and read all 16 screenshots after any change to `lib/`,
`src/layouts/`, `src/components/`, `src/css/` or `config*.js`.
