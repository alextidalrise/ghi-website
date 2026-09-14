# Component library v1 release-candidate QA

**Candidate:** `ghi-email-components@1.0.0`  
**State:** source validated; Mailchimp readback and Alex approval outstanding

## Automated verification

The release candidate was rebuilt and checked after rebasing the feature branch onto current `origin/main`.

- `npm run check`: PASS
  - validator self-tests: 32/32
  - QA path self-tests: 10/10
  - mandatory campaign manifests: 3/3
  - Maizzle production build: 4 templates
  - component registry and manifest contract: PASS
  - existing component-library/Portugal contract: PASS
  - source validation: 0 errors across 4 templates
  - explicit plain-text byte check: PASS for 4 templates
  - screenshot renderer: 32 scenarios
- `npm run validate:links`: PASS with 0 live-link errors
- `npm run qa:long -- component-library-v1`: PASS
  - desktop: 700px, 6 segments, zero horizontal overflow
  - mobile: 375px, 8 segments, zero horizontal overflow
  - narrow: 320px, 8 segments, zero horizontal overflow

The regenerated long renders and full screenshots were visually inspected after the final source fixes. The new partner/article hero, founder profile, three-service row, rental cards, availability notice, partner-to-GHI transition, compact GHI property pair, primitive variants and both footer variants show no broken images, horizontal overflow, clipping, collisions or malformed mobile stacking at the checked widths.

## Mailchimp edit surface

Compiled master source: `build_production/component-library-v1.html`

- 41 `mc:edit` regions, all unique
- 8 `mc:repeatable` regions, all unique
- the stable property-pair CTA regions survive compilation and remain distinct from the pair headings and card bodies

The source is not yet a Mailchimp-verified master. Template upload, default-content readback and stored-render QA remain required.

## Warning disposition

The source validator reports 44 warnings across the four templates; live-link validation reports 48 warnings after adding redirect and automated-checker observations. Neither command reports an error. No warning is hidden or represented as an unconditional production pass.

### All-components proving master

Accepted for the **review master only**, not for a production campaign:

- size above the 60KB working target, because the fixture intentionally contains every component;
- three green demonstration bands, because the fixture contains mutually exclusive approved variants; the scoped validator exception is tested and remains an error for campaign templates;
- multiple overlines, because the fixture demonstrates component labels and is not campaign copy;
- non-underlined linked card images/titles where a separate visible underlined action is present;
- the second footer-heading plain-text warning, because the fixture demonstrates two mutually exclusive footer variants and explicit plain text deliberately emits one legal footer.

These exceptions must not be inherited by a production campaign.

### Portugal v15 retained review items

The long-email size, overline count, selected CTA-length, WhatsApp UTM and image-link underline warnings predate this release-candidate reconciliation and remain documented campaign review items. They do not waive any error, content drift, clipping, overflow or send gate.

### Live-link observations

- All checked first-party destinations resolved without an error.
- Multi-parameter links were fetched after HTML-entity decoding; the checker now validates the same query semantics a browser follows.
- WhatsApp links redirected to the expected WhatsApp API route.
- Instagram redirected to its login route for the automated checker.
- LinkedIn returned its known automated-checker block (`999`) and still requires ordinary-browser confirmation before a live campaign.

## Outstanding release gates

1. Independent code review and a verified source commit.
2. Push and normal pull-request review/merge.
3. Upload the compiled master under a new versioned Mailchimp template name.
4. Read back template metadata and default editable content.
5. Inspect the stored Mailchimp render at desktop, 375px and 320px.
6. Record Alex's explicit approval of the component library/master.

Until all six gates are complete, the registry remains `awaiting-human-approval` and this is a release candidate rather than the production source.
