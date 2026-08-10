# Portugal v15 QA and Mailchimp readback

**State:** Alex's comparison decisions, light-footer revision and equal-height tablet/desktop card treatment are implemented and read back in the audience-free Mailchimp draft. Both light and original dark-green footers remain available in the reusable component template. These consolidated changes have not been re-proofed. Awaiting human design/content approval. Not authorised for a live audience or schedule.

**Canonical design/content reference:** James's approved v15 preview at `/home/admin/GHI/knowledge-base/03-content/campaigns/2026-08-10-portugal-launch/web-preview/index.html`.

## Source-controlled artefacts

- Campaign source: `src/templates/portugal-v15.html`
- Component showcase: `src/templates/component-library-v1.html`
- Semantic components: `src/components/{editorial-lead,section-intro,destination-feature,advisory-cta,entity-card,card-pair,small-print,partner-cell,partner-grid-row,guide-card,dual-action-enquiry,footer,footer-light}.html`
- Compiled campaign HTML: `build_production/portugal-v15.html`
- Explicit plain text: `build_production/portugal-v15.txt`
- Long-email renderer: `bin/qa-long-email.mjs` (regenerates `qa/segments/`)
- Review-ready stitched previews: `/home/admin/GHI/outputs/email-marketing/portugal-v15-component-rebuild/`

## Local QA

### Automated

- Component-retention contract: PASS.
- Validator self-test: 30/30 checks verified, including lookalike `fm` query-value and LinkedIn bot-block regressions.
- QA output-path self-test: unsafe traversal/path names rejected before any recursive deletion or browser launch.
- Campaign validator: 0 errors.
- Live-link resolution: 26 unique destinations, 0 errors; LinkedIn's automated-checker `999` response is retained as a review warning rather than misreported as a broken link.
- Heading structure: one H1.
- Campaign modules: four destination features, ten development cards, four golf cards, eight partner cells, two guide cards and one final dual-action enquiry block.
- Images: 30, comprising the 28 canonical campaign images plus two reusable social icons.
- Stale failed-build copy `A more useful way to compare the Algarve`: absent.
- Explicit plain text includes headings, entity facts, repeated statuses and link destinations.

### Visual

Rendered and inspected as segmented long-email screenshots at:

- desktop: 700px;
- mobile: 375px;
- narrow mobile: 320px.

The review caught and fixed:

- undersized stacked card imagery on mobile;
- visible double-escaped `&amp;` text;
- omitted Fiberpay and Vorto partner logos;
- long-form screenshot coverage that initially captured only the opening viewport;
- compact-button padding needed to keep the final CTA on one line at 320px.
- the canonical Palmares destination/development image identities, which had been reversed in the first proof;
- malformed semantic-card joins in explicit plain text;
- hidden HTML preheader/Mailchimp preview-text mismatch;
- an unsafe path-traversal route in the segmented QA renderer;
- a query-parsing weakness in the legacy-image-format validator.
- the missing reusable Instagram and LinkedIn footer destinations.
- the image-first hero order, replaced with the approved copy-first hierarchy;
- the omitted `Portugal collection` masthead label and four `View course →` links.
- excessive green at the ending, resolved with the light footer treatment in Portugal while retaining the original green footer in the reusable library;
- the 24px white spacer row between the final CTA and footer, removed only for the flush light-footer treatment.
- unequal visible card shells within the property, golf-course and buying-guide rows at tablet/desktop widths.

No horizontal overflow was recorded. The final 31-character CTA remains one line at 320px in the captured evidence. The light footer was inspected at 700px, 375px and 320px: the green CTA meets the footer through one gold divider with no spacer row, while both linked dark-green icons and visible labels remain aligned, readable and unclipped. The restored masthead label and copy-first hero were inspected at desktop and 320px; the logo/label remained distinct and unclipped. All four location cards use James's captioned side-by-side reference treatment: image and dark-green caption strip on the left, underlined dark-green serif title, retained descriptive paragraph and solid green uppercase CTA on the right. All four golf-course cards now use the corresponding full-width treatment while retaining their course-specific content: square image and location caption on the left, underlined course title and solid green `View course →` CTA on the right. Both component types stack image/caption above copy at 375px and 320px. All ten developments retain the approved full-width treatment. The location, development and golf-course sections were inspected at 700px, 375px and 320px with no clipping, overlap, broken images, grid remnants or horizontal overflow. The two guide cards retain their paired layout.

### Accepted warnings before internal proof

1. Compiled HTML is 98,963 bytes (96.6KB), above the 60KB working target and 3,437 bytes below Gmail's 102KB clipping threshold. Mailchimp's corrected stored HTML readback is 93,735 bytes, leaving 8,665 bytes of stored-content headroom. Tracked links can still expand during delivery, so the final delivered message must be checked for Gmail clipping before live-send approval.
2. `Enquire about Portugal property` exceeds the validator's generic 28-character warning threshold, but the exact approved label was visually verified on one line at 320px.
3. The WhatsApp URL has no UTM parameter. It is a direct `wa.me` action with a prefilled message, not a GHI website destination.

## Mailchimp artefacts

### Component template

- Name: `GHI Email Components v1 – REVIEW BLOCKS`
- ID: `11604907`
- Type: user HTML template
- Active: yes
- Responsive: yes
- Reusable footer variants: labelled light and original dark-green blocks, each retaining compliance content, Instagram and LinkedIn, hosted 72px PNG assets rendered at 36px and visible fallback labels.
- Last edited after the shared white-card revision: `2026-08-10T21:04:16+00:00`.

The approved plan's longer provisional name exceeded Mailchimp's 49-character maximum. The review-status name avoids implying component approval before Alex's visual gate and does not overwrite the existing GHI template.

### Portugal review campaign

- Title: `DO NOT SEND – Portugal v15 approved-preview component rebuild – audience not approved`
- Campaign ID: `f1d8cdbe05`
- Web ID: `14188405`
- Status: `save` (draft)
- Emails sent: `0`
- Audience/list ID: blank
- Recipient count: `0`
- Delivery enabled: `false`
- Send time: blank
- Template ID: `0` (the campaign contains selected compiled modules; it is not bound to the showcase template)
- Subject: `Golf Homes International in Portugal`
- Preview text: `Explore Vilamoura, Quinta do Lago, Monte Rei and Palmares, with current developments, golf and independent buyer support.`
- From name: `Golf Homes International`
- Reply address: `hello@news.golfhomesinternational.com`
- Archive readback: `https://us17.campaign-archive.com/?u=29c8f4436bf0d21837847298b&id=f1d8cdbe05`

### Stored-content readback

- Corrected source HTML SHA-256 before Mailchimp: `1643b311cc2d42d1367a7419acf6f27045532ae4e27145e460637c9e3e99a445`
- Corrected Mailchimp-stored HTML SHA-256: `f87dcb46a4cc4ece111ff6896f1daf0201762dca47d2f5c1434ad83814e415af`
- Difference: controlled Mailchimp normalisation plus in-place replacement of the two old golf-course grid rows. Structural readback retained four captioned location cards, ten full-width development cards, four full-width golf-course cards, six partner cells, two guide cards, ten explicit `View development →` actions, four course actions, the partner-introduction CTA, the green/white outlined WhatsApp button, one light footer and no CTA/footer spacer. Each course retained its title, location, CTA, canonical link and Sanity asset identity; no old paired golf-course entity cards remained. Locations and developments retained their previously verified content and structure. Olive Grove Partners and Nueva Vida Group were absent from both stored HTML and plain text.
- Audited explicit plain-text SHA-256: `c14976fe540b71db19168e00c00df85da4fdac36e3c738cbb49824aef7d59428`
- Mailchimp-stored plain text matches the current source-controlled plain text exactly.
- Mailchimp archive readback exposed the full destination, development, golf, partner, guide and enquiry hierarchy.

## Internal proof

The first proof is superseded because independent review identified a Palmares image-identity mismatch. After correction and authoritative Mailchimp readback, one corrected HTML proof action was accepted for the same approved internal allowlist:

- `james@golfhomesinternational.com`
- `alex@golfhomesinternational.com`

Mailchimp returned `Action executed successfully`. It did not expose a separate test-action identifier.

After the proof action, Mailchimp regenerated the plain-text part. The source-controlled plain text was immediately restored and read back with exact SHA-256 equality. The campaign remained an audience-free draft with zero live delivery.

The reusable social footers, Alex's accepted comparison changes, the light-footer/gap revision, equal-height tablet/desktop card treatment and James's partner/CTA revisions were added after that proof. Mailchimp content readback confirms the restored masthead label, copy-first hero, ten development actions, four course actions, six retained partners, partner-introduction CTA, green/white WhatsApp button, light campaign footer, absence of the CTA/footer spacer row, both social icons, equal-height card markers and exact plain-text destinations. No further proof action was taken during implementation.

API acceptance is not evidence of inbox receipt. Alex and James must each confirm receipt of this same proof.

The full canonical-v15 copy and module register is in `docs/13-portugal-v15-copy-comparison.md`. It records exact body-copy retention separately from metadata, interface, tracking, footer and reading-order adaptations.

## Remaining human gates

Before any live-send approval:

1. Alex approves the all-components desktop/mobile showcase.
2. Alex and James confirm receipt and reviewability of the proof.
3. James confirms the recipient-visible subject, preview text, from name and reply address.
4. Image usage rights and time-sensitive property facts are re-confirmed for the intended send date.
5. The exact Mailchimp audience/segment ID, live count and segment text are approved.
6. The exact send date/time is approved; the masthead date is updated to the actual send day.
7. Mailchimp content, plain text, checklist, audience state and timing are read back again after any proof, scheduling or content change.

No live send or production schedule is authorised by this document.
