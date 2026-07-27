# Release and change control

Two kinds of change, with different risk and different process:

- **A campaign** adds or edits a file in `src/templates/`. Low risk, contained.
- **A system change** touches `lib/`, `src/layouts/`, `src/components/`,
  `src/css/` or `config*.js`. It changes every future campaign, and every past
  one that gets resent.

---

## Campaign release

1. Branch: `email/campaign-<slug>`.
2. Add `src/templates/<slug>.html` with front matter (`title`, `preheader`,
   `locale`, `subject`). One file per locale.
3. `pnpm --filter email build`
4. `pnpm --filter email check` — must be clean.
5. `pnpm --filter email validate:links` — must be clean.
6. Review `qa/screens/index.html`.
7. Commit **source and compiled output together**. The diff of
   `build_production/<slug>.html` is what a reviewer reads.
8. PR. Reviewer checks the compiled diff, the plain-text file, and the contact
   sheet.
9. Merge, then follow the send checklist in
   [03-mailchimp.md](03-mailchimp.md#send-checklist).

## System release

Everything above, plus:

1. **Rebuild the reference fixtures and read every screenshot.** The reference
   emails exist precisely so that a system change shows up somewhere visible.
   Both `reference` and `reference-ar`, all eight scenarios, all sixteen images.
2. **Run the full client matrix**, not just Inbox Preview. A component change can
   break classic Outlook without touching anything Chromium renders differently.
3. **Screen-reader pass and colour-blindness simulation.**
4. **Update the docs in the same commit.** A rule whose reason is undocumented
   is a rule someone deletes six months later.
5. **Note it in the decisions log below.**

### Changes that need extra care

| Change | Why |
|---|---|
| Upgrading Maizzle | v6 strips HTML comments, which would silently remove every Outlook conditional. Verify they survive. |
| Touching `lib/tokens.mjs` | Every component reads from it. Re-verify contrast with the snippet in [02-brand-rules.md](02-brand-rules.md). |
| Renaming an `mc:edit` region | Breaks existing Mailchimp templates and any automation keyed to it. Coordinate with whoever owns the campaign. |
| Adding a component prop | Needs a default in `config.js`, or a comparison against it throws and renders empty with no build error. |
| Changing the footer | Legal content. The validator enforces presence, not correctness of wording. |
| Adding a locale | Add `locales/<code>.json`, then have a native reader review type sizes, not just strings. |

---

## What runs in CI

```bash
pnpm --filter email check
```

which is, in order:

1. `validate:self-test` — proves the validator's 26 checks still fire
2. `build` — compile + regenerate plain text
3. `validate` — all checks against the compiled output
4. `plaintext --check` — fails if a committed `.txt` is stale
5. `qa` — screenshots, fails on horizontal overflow

`validate:links` is **not** in CI: it makes real network requests, and a
transient outage on a third-party destination should not fail an unrelated
build. Run it manually before a send.

---

## Rollback

Compiled output is committed, so rolling back is `git revert` plus re-uploading
the previous `build_production/<name>.html` to Mailchimp. There is no build step
to reproduce and no risk of a different toolchain version producing different
bytes.

A campaign already sent cannot be rolled back. That is what the send checklist
is for.

---

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-24 | Maizzle 5, not 6 | v6 is a Vite/Vue rewrite whose template compiler strips HTML comments in production. Outlook conditional markup *is* an HTML comment, so every Outlook fix would vanish silently. v5 uses PostHTML and preserves them. |
| 2026-07-24 | Tailwind removed from the pipeline | The responsive and dark-mode blocks are hand-written for auditability, which left Tailwind generating utilities only to be inlined. Writing inline styles directly from token expressions is more explicit, produces smaller output, and matches the brief's own split: critical CSS inline, a limited embedded block for resets/responsive/dark mode. |
| 2026-07-24 | `css.inline` off | Critical CSS is already written inline by the components. Turning juice on would drag resets and dark-mode rules onto elements, bloating the file and defeating the resets, since an inlined reset cannot be overridden by the media query that needs to override it. |
| 2026-07-24 | Green bookends rather than white-default | The site's white-default rule does not survive forced dark-mode inversion: the `#e2ded5` hairline vanishes and a green logo on a transparent PNG disappears. A dark ground is what inverting clients leave alone, so masthead and footer stay green in both modes and carry the logo and the required footer. |
| 2026-07-24 | Green band capped at one, and never adjacent to the footer | Two greens stacked read as one slab. The footer is also green, so a band placed above it merges into a mass ~40% of the email tall. Both enforced by the validator. |
| 2026-07-24 | Body weight 400, not the site's Light 300 | Arial has no light weight, so most recipients see Regular regardless. Designing to a weight most people never receive tunes measure and rhythm for the wrong rendering. |
| 2026-07-24 | Image format pinned, never `auto=format` | The site's Sanity helper negotiates AVIF/WebP per request, which is correct for browsers and ships broken images to classic Outlook. `lib/image-url.mjs` exists solely to make the divergence explicit; the validator fails on `auto=format`. |
| 2026-07-24 | Brand chrome static, campaign imagery via Sanity | The logo must never 404 and changes with the brand, not the campaign; it is generated from the site's own SVGs by `bin/build-assets.mjs`. Campaign imagery needs resize-on-demand and belongs in the CMS. |
| 2026-07-24 | Size target 60KB compiled, not 85–90KB | Mailchimp rewrites every href into a tracking URL and injects footer markup after upload, so compiled size systematically understates delivered size. The headroom is deliberate. |
| 2026-07-24 | Arabic seeded now | `docs/uae-expansion-plan.md` puts Dubai third after Spain and Portugal. Component symmetry makes RTL nearly free today and expensive to retrofit later. |
| 2026-07-24 | Brand rules enforced by the validator | The Emphasis Ladder, the zero-radius rule and the gold-is-not-ink rule are all checkable. A design system that exists only in a document drifts; one that fails the build does not. |
