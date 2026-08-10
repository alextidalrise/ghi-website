# Portugal v15 QA and Mailchimp readback

**State:** internally proofed; awaiting human inbox confirmation and design/content approval. Not authorised for a live audience or schedule.

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
- Validator self-test: 28/28 checks verified.
- Campaign validator: 0 errors.
- Live-link resolution: 24 unique destinations, 0 errors.
- Heading structure: one H1.
- Campaign modules: four destination features, ten development cards, four golf cards, eight partner cells, two guide cards and one final dual-action enquiry block.
- Images: 28.
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

No horizontal overflow was recorded. The final 31-character CTA remains one line at 320px in the captured evidence.

### Accepted warnings before internal proof

1. Compiled HTML is 84.8KB, above the 60KB working target but below Gmail's 102KB clipping threshold. Mailchimp's stored HTML readback is 86,052 bytes.
2. `Enquire about Portugal property` exceeds the validator's generic 28-character warning threshold, but the exact approved label was visually verified on one line at 320px.
3. The WhatsApp URL has no UTM parameter. It is a direct `wa.me` action with a prefilled message, not a GHI website destination.

## Mailchimp artefacts

### Component template

- Name: `GHI Email Components v1 – APPROVED BLOCKS`
- ID: `11604907`
- Type: user HTML template
- Active: yes
- Responsive: yes

The approved plan's longer provisional name exceeded Mailchimp's 49-character maximum and was shortened without overwriting the existing GHI template.

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

- Source HTML SHA-256 before Mailchimp: `39c1e1537b9af051307c69201ec386f1da79da5f9eb672e20adc57c19d15e1db`
- Mailchimp-stored HTML SHA-256: `cb756f899c540f4902f33e5a3420deab96c37446955a18a43fdfd0647c4cdefe`
- Difference: Mailchimp normalisation; structural readback retained one H1, 28 images, 61 linked elements and all required sections/entities.
- Explicit plain-text SHA-256: `f77a9b33bf64509fc06bb4002aef7f681044a3cb519b8a29d99333208a6e14c9`
- Mailchimp-stored plain text matches the current source-controlled plain text exactly.
- Mailchimp archive readback exposed the full destination, development, golf, partner, guide and enquiry hierarchy.

## Internal proof

A single HTML proof action was accepted by Mailchimp for the approved internal allowlist:

- `james@golfhomesinternational.com`
- `alex@golfhomesinternational.com`

Mailchimp returned `Action executed successfully`. It did not expose a separate test-action identifier.

After the proof action, Mailchimp regenerated the plain-text part. The source-controlled plain text was immediately restored and read back with exact SHA-256 equality. The campaign remained an audience-free draft with zero live delivery.

API acceptance is not evidence of inbox receipt. Alex and James must each confirm receipt of this same proof.

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
