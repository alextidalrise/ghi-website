# Portugal v15 to GHI email component gap matrix

**Status:** implementation baseline

**Authoritative target:** `/home/admin/GHI/knowledge-base/03-content/campaigns/2026-08-10-portugal-launch/web-preview/index.html`

**Failure evidence only:** `/home/admin/GHI/outputs/email-marketing/portugal-launch-approved-design-v2/email-mailchimp-approved-v2.html`

The failed email is not a design source or acceptable starting point. Every component and campaign render must be compared directly with the approved version-15 preview. Genuine email-client constraints must be documented rather than silently approximated.

## Baseline comparison

| Measure | Approved v15 | Failed email |
|---|---:|---:|
| H1-H3 headings | 19 | 4 |
| Links | 53 | 24 |
| Images | 28 | 12 |

## Content and component audit

| V15 job | Failed email | Foundation support | Implementation decision |
|---|---|---|---|
| Fixed GHI masthead, preview text and compliance footer | Present but inherited from a separate hand-built email | Supported by locked Maizzle shell | Retain locked shell; campaign title/preheader must come from front matter and be validated |
| Full-width Portugal hero | Present | `x-figure` | Retain, using the approved v15 hero and caption |
| Campaign title and standfirst | Partially retained | `x-heading`, `x-text`, `x-overline` | Retain exact approved hierarchy in an `editorial-lead` composition |
| Specialist-estate-agency opening | Replaced with older copy | Primitive support only | Retain approved v15 copy and add `editorial-lead` semantic wrapper |
| Four destination features | Omitted | Unsupported as a coherent repeated job | Add `destination-feature` with image, caption, heading, body and contextual CTA |
| Advisory prompt after destinations | Omitted | Generic section/button only | Add `advisory-cta` with stone ground and one action |
| Development introduction and qualification | Omitted/flattened | Primitive support only | Add `section-intro` and `small-print` |
| Ten grouped development cards | Present but isolated from article context | No reusable entity-card component | Add `entity-card` and `card-pair`; preserve grouping, exact facts and source order |
| Four golf-course cards | Omitted | Unsupported | Reuse `entity-card` in `course` mode through a two-card layout |
| Independent-partner explanation | Omitted | Primitive support only | Retain approved prose and disclosure |
| Eight partner/service cells | Omitted | Unsupported | Add `partner-cell` and `partner-grid-row`; use logo/name fallback and live text service labels |
| Two buying-guide cards | Omitted | Unsupported | Add `guide-card` and paired layout |
| Portugal-specific closing enquiry | Reduced to one generic action | One generic green band/button | Add `dual-action-enquiry`; exactly one primary shortlist action and one subordinate WhatsApp action |
| Ruled editorial rhythm | Partly reproduced | `x-rule` only | Use `section-intro ruled` and deliberate hairlines between major jobs |
| Explicit plain text for retained modules | Missing because major sections were absent | Deterministic generator exists | Extend component tests so every heading/link survives into `.txt` |

## Fidelity rules

1. Preserve the approved v15 section sequence.
2. Preserve approved copy, image identity, captions, CTA wording and URLs unless an explicit campaign review changes them.
3. Do not reintroduce `A more useful way to compare the Algarve`.
4. Do not turn image-led entity cards into text-only rows.
5. Do not omit destination, golf, partner or guide jobs because a component is missing; implement the component.
6. Keep source order as mobile and screen-reader order.
7. Use tables and inline styles only for critical layout; no flexbox, grid, absolute positioning or raw custom CSS fields.
8. Pin Sanity image formats to JPG/PNG for Outlook.
9. Any unavoidable difference from v15 must appear in the review register with a reason and Alex’s approval state.

## Accepted email-medium adaptations

These are implementation adaptations, not permission to redesign:

- the article’s wide desktop canvas becomes the approved 600px email column;
- multi-column groups stack in source order on small screens;
- hover-only treatments become visible static links/focus-independent cues;
- disclosure/expand interactions are not used because many email clients strip them;
- all content remains visible without CSS media queries;
- the production GHI email masthead/footer replace standalone-preview chrome.

## Blocking faults

- any major v15 section missing without an explicit approved omission;
- substitute or older copy presented as approved v15 copy;
- wrong image/entity/link pairing;
- unsupported commercial claim or stale price/status/completion wording;
- partner section without buyer-choice/independence wording;
- inaccessible image-of-text substitution where live text is possible;
- HTML/plain-text mismatch;
- Gmail clipping risk, horizontal overflow or broken Outlook fallback;
- treating a browser preview or accepted test-send API call as inbox receipt.
