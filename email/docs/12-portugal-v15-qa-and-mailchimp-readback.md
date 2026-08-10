# Portugal v15 QA and Mailchimp readback

**State:** corrected internal proof accepted by Mailchimp after independent code/fidelity review; reusable Instagram/LinkedIn footer added afterward and not yet re-proofed. Awaiting human design/content approval. Not authorised for a live audience or schedule.

**Canonical design/content reference:** James's approved v15 preview at `/home/admin/GHI/knowledge-base/03-content/campaigns/2026-08-10-portugal-launch/web-preview/index.html`.

## Source-controlled artefacts

- Campaign source: `src/templates/portugal-v15.html`
- Component showcase: `src/templates/component-library-v1.html`
- Semantic components: `src/components/{editorial-lead,section-intro,destination-feature,advisory-cta,entity-card,card-pair,small-print,partner-cell,partner-grid-row,guide-card,dual-action-enquiry}.html`
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

No horizontal overflow was recorded. The final 31-character CTA remains one line at 320px in the captured evidence. The corrected social row was visually inspected at 700px, 375px and 320px: both linked icons and their visible fallback labels remained aligned, readable and unclipped.

### Accepted warnings before internal proof

1. Compiled HTML is 88,917 bytes (86.8KB), above the 60KB working target but below Gmail's 102KB clipping threshold. Mailchimp's corrected stored HTML readback is 88,092 bytes. Final delivered HTML must still be inspected before live-send approval because tracking rewrites reduce this headroom.
2. `Enquire about Portugal property` exceeds the validator's generic 28-character warning threshold, but the exact approved label was visually verified on one line at 320px.
3. The WhatsApp URL has no UTM parameter. It is a direct `wa.me` action with a prefilled message, not a GHI website destination.

## Mailchimp artefacts

### Component template

- Name: `GHI Email Components v1 – REVIEW BLOCKS`
- ID: `11604907`
- Type: user HTML template
- Active: yes
- Responsive: yes
- Reusable social destinations: Instagram and LinkedIn, with hosted 72px PNG assets rendered at 36px and visible fallback labels.
- Last edited after the footer correction: `2026-08-10T16:02:13+00:00`.

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

- Corrected source HTML SHA-256 before Mailchimp: `c0eb034363fa16d6bab9b1ade9af4ac857034aa6ae7b1b1d576c3435f033a6ab`
- Corrected Mailchimp-stored HTML SHA-256: `db22a28745ef585861af18fa4b90a3143630612b7d1abc0375e75b89295eaec5`
- Difference: Mailchimp normalisation; structural readback retained one H1, 30 images, 65 linked elements, one instance of each social icon and all required sections/entities.
- Audited explicit plain-text SHA-256: `d2bd9d5f442e45ef5a30ff5b6686e107ce4fd933a16423f30e1d53657848108d`
- Mailchimp-stored plain text matches the current source-controlled plain text exactly.
- Mailchimp archive readback exposed the full destination, development, golf, partner, guide and enquiry hierarchy.

## Internal proof

The first proof is superseded because independent review identified a Palmares image-identity mismatch. After correction and authoritative Mailchimp readback, one corrected HTML proof action was accepted for the same approved internal allowlist:

- `james@golfhomesinternational.com`
- `alex@golfhomesinternational.com`

Mailchimp returned `Action executed successfully`. It did not expose a separate test-action identifier.

After the proof action, Mailchimp regenerated the plain-text part. The source-controlled plain text was immediately restored and read back with exact SHA-256 equality. The campaign remained an audience-free draft with zero live delivery.

The reusable social footer was added after that proof. Mailchimp content readback confirms both social icons and exact plain-text destinations, but no further proof action was taken while the remaining comparison decisions are under review.

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
