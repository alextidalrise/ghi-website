# Portugal v15 QA and Mailchimp readback

**State:** Alex's comparison decisions, James's dark-green-footer revision and equal-height tablet/desktop card treatment are implemented and read back in the audience-free Mailchimp draft. Both light and dark-green footers remain available in the reusable component template. These consolidated changes have not been re-proofed. Awaiting human design/content approval. Not authorised for a live audience or schedule.

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
- the former compact `Portugal collection` masthead, superseded by James's date-led editorial masthead, and four omitted `View course →` links.
- footer continuity at the ending, resolved by applying the same dark-green surface to the complete compliance/social footer while retaining the light variant in the reusable library;
- the 24px white spacer row between the final CTA and footer, removed for the flush footer treatment.
- unequal visible card shells within the property, golf-course and buying-guide rows at tablet/desktop widths.

No horizontal overflow was recorded. The final 31-character CTA remains one line at 320px in the captured evidence. The dark-green footer was inspected at 700px, 375px and 320px: the closing CTA meets the footer through one gold divider with no spacer row; all non-link compliance copy, merge tags, separators and copyright are explicitly forced to white, all five required-action and social text links are explicitly white, zero gold text links remain, and both light social icons remain aligned, readable and unclipped. James's new masthead was inspected at 700px, 375px and 320px: the centred week/date, inset green logo panel, white `The Home of Golf Property` strapline and centred specialist descriptor remained aligned and unclipped. The separate `10 August 2026 · Portugal · Golf property · Buyer guidance` row shown in the removal reference is absent from HTML and plain text. A second approved `WhatsApp our Portugal team` action appears directly below the specialist-estate-agency introduction. All four location cards use James's captioned side-by-side reference treatment and all ten developments retain the approved full-width treatment. The location copy columns are top-aligned with consistent 20px padding, 26px headings, 15px/23px body copy and 14px internal gaps. Their former full-column CTA bars were replaced with compact content-width buttons using 10px text and 7px × 10px padding. To match James's approved Palmares balance, the image depths are now card-specific: Vilamoura 272px, Quinta do Lago 296px, Monte Rei 258px and Palmares 236px at desktop. Every image/caption column now ends with a consistent 13–14px inset above its card boundary instead of leaving unequal blank areas. The campaign's green-box system was reduced consistently after James's review. The introductory WhatsApp button uses 11px text with 14px × 20px padding; four destination captions use 10px text with 7px × 9px padding; four destination CTA boxes use 10px text with 7px × 10px padding; ten development status boxes use 10px text with 8px × 11px padding; and the partner-introduction action uses 11px text with 10px × 14px padding. The four golf-course cards retain James's supplied image-overlay treatment in a two-by-two desktop grid: 300px image fields, 88%-width lower-left panels, 16px serif titles, 8px uppercase location lines and 9px `VIEW COURSE →` links. Course-panel padding is 10px × 13px so substantially more of each image remains visible. Their image derivatives were reduced from 944×944 to 640×640 while retaining the same Sanity asset identities. At 375px and 320px the course cards stack individually in source order; all titles, labels and actions remain readable with no clipping or overflow. The partner-introduction panel uses a white surface while retaining its heading, copy, link and dark-green button. The two buyer-guide cards sit in separate full-width rows rather than side by side. James's supporting descriptions were removed from both HTML and explicit plain text. Each guide card now uses a 536×220 desktop footprint, 22px internal padding, a restrained 22px linked serif title and a 10px uppercase guide action with arrow. The audience label remains above each title. At 375px and 320px the fixed height resets and each card uses its natural content height. All revised sections were inspected at 700px, 375px and 320px with no clipping, overlap, broken content or horizontal overflow.

### Accepted warnings before internal proof

1. Compiled source HTML is 103,378 bytes, 978 bytes above Gmail's 102,400-byte clipping threshold because the campaign retains four Outlook VML course-background fallbacks and now includes the expanded editorial masthead. Mailchimp's authoritative normalised stored HTML readback is 98,008 bytes, leaving 4,392 bytes of stored-content headroom before delivery-time tracking expansion. The final delivered message must therefore still be checked for Gmail clipping before live-send approval.
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

- Corrected source HTML SHA-256 before Mailchimp: `821b33813cdf69b306ca1a5b52b85532c50ae9c643c6061955fd859f9ec8fd82`
- Corrected Mailchimp-stored HTML SHA-256: `f3bd33076326580e500288f054ef820e4cade74935d8a6a0c512a8ad60f7e301`
- Difference: controlled Mailchimp normalisation, James's editorial masthead and removed metadata row, paired image-overlay course rows, top-aligned destination cards with Palmares-matched image-column balance, campaign-wide reduction of green-box treatments, and the dark-green compliance/social footer with all five text links forced to white. Structural readback retained four captioned location cards, ten full-width development cards, four course cards across two paired rows, six partner cells, two compact guide cards in two rows, two WhatsApp actions, ten explicit `View development →` actions, four course actions, the partner-introduction CTA, one dark-green footer and no CTA/footer spacer. Each course retained its title, location, underlying Sanity asset identity, alt text, canonical tracked link and `VIEW COURSE →` action. Stored course backgrounds read back at 640×640, 300px display height with 88%-width information panels and four Outlook VML fallbacks. The partner panel, guide cards, locations and developments retained their previously verified content and structure. Olive Grove Partners and Nueva Vida Group were absent from both stored HTML and plain text.
- Audited Mailchimp-stored explicit plain-text SHA-256: `8097ccaaffba3297dacc16c52c4009e860925eff4fef0302a9aad8b1a658c31e`
- Mailchimp-stored plain text matches the current source-controlled plain text after standard trailing-newline normalisation.
- Mailchimp archive readback exposed the full destination, development, golf, partner, guide and enquiry hierarchy.

## Internal proof

The first proof is superseded because independent review identified a Palmares image-identity mismatch. After correction and authoritative Mailchimp readback, one corrected HTML proof action was accepted for the same approved internal allowlist:

- `james@golfhomesinternational.com`
- `alex@golfhomesinternational.com`

Mailchimp returned `Action executed successfully`. It did not expose a separate test-action identifier.

After the proof action, Mailchimp regenerated the plain-text part. The source-controlled plain text was immediately restored and read back with exact SHA-256 equality. The campaign remained an audience-free draft with zero live delivery.

The reusable social footers, Alex's accepted comparison changes, the flush dark-green-footer revision, equal-height tablet/desktop card treatment and James's partner/CTA revisions were added after that proof. Mailchimp content readback confirms the date-led editorial masthead, removal of the former date/topic metadata row and copy-first hero, ten development actions, four course actions, six retained partners, partner-introduction CTA, green/white WhatsApp button, dark-green campaign footer, absence of the CTA/footer spacer row, both social icons, equal-height card markers and exact plain-text destinations. No further proof action was taken during implementation.

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
