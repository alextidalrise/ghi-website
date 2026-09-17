# GHI weekly editorial master v1

## State

Source candidate. It is locally built and QA-ready, but it is not yet a released Mailchimp master and has not been approved for production use.

The component registry it depends on is still marked `awaiting-human-approval`. The release sequence remains: independent review, source commit, pull request and merge, versioned Mailchimp upload, stored-content and editor readback, desktop/mobile archive QA, then Alex's design approval.

## Purpose

This recipe gives GHI a consistent weekly email structure for:

- a timely lead story;
- one or two new listings;
- one new development;
- one new partner or partner story;
- one or two relevant existing opportunities;
- one primary enquiry journey with WhatsApp as the secondary action.

A weekly edition should still have one audience, one principal commercial job and one primary CTA. The master is not permission to fill every section every week. Remove a section when there is no useful, verified content for it.

## Build route

The authoritative route is the source-controlled Maizzle recipe. The paths below are relative to the repository's `email/` directory:

- source: `src/templates/weekly-editorial-master-v1.html`
- component manifest: `src/manifests/weekly-editorial-master-v1.json`
- compiled HTML: `build_production/weekly-editorial-master-v1.html`
- explicit plain text: `build_production/weekly-editorial-master-v1.txt`

For production campaigns, the preferred route is compiled standalone HTML assembled only from the approved component library. Mailchimp may report `template_id: 0` for those campaign drafts. A separately named saved Mailchimp master may be created after the release gates pass, but it must not replace the source recipe or renderer.

## Editorial hierarchy

1. Date-led GHI masthead.
2. One full-width lead image.
3. One lead headline, concise framing and one principal story link.
4. New listings pair.
5. One full-width development feature.
6. One partner feature with a clear buyer benefit and independence wording.
7. Selected existing opportunities.
8. Primary enquiry CTA and secondary WhatsApp route.
9. Linked social and compliance footer.

## Weekly operating rules

Before rendering a real edition:

1. Copy the master source to a campaign-specific template and create a matching campaign-specific manifest.
2. Update the template filename, manifest filename, `campaignId`, source path and every provenance URI together.
3. Set the masthead to the actual intended send day.
4. Replace the generic subject, preview text and HTML title together.
5. Select one lead story and one principal CTA.
6. Verify every property and development title, location, price, status, completion, image, GHI reference and canonical URL from current approved sources.
7. Verify the partner's approved name, logo, service scope, destination and wording. Partners are independent and buyers may appoint their own advisers.
8. Remove modules that do not earn their place. Remove each omitted top-level module from both the source and the manifest so order and instance coverage remain exact.
9. Treat the partner and existing-opportunity sections as opt-in unless they directly support the week's lead. Do not create a catalogue simply because the master demonstrates every available section.
10. Create a fresh campaign UTM value and distinct `utm_content` values.
11. Generate explicit plain text and run the complete validation and responsive QA suite.
12. Write only to a Mailchimp draft, read it back and provide a clickable Mailchimp archive for review.
13. Keep content approval, exact recipient approval and timing approval as separate release gates.

## JamesEdition reference adaptation

The supplied JamesEdition screenshots were treated as editorial inspiration, not as a source to copy.

### Retained ideas

- prominent publication masthead and dated edition line;
- one large lead image followed by a decisive headline;
- strong white-space rhythm;
- concise bordered CTAs;
- two-column listing modules that stack on mobile;
- full-width editorial or development feature between card groups;
- clear section labels and restrained visual treatment.

### Deliberate GHI differences

- GHI logo, green, ivory, gold and approved typography replace JamesEdition branding;
- the footer retains GHI social, permission and compliance content;
- listing and development modules require source-verified GHI fields;
- the partner section states the service boundary and adviser independence;
- the close prioritises a qualified GHI enquiry rather than a generic content click;
- the structure uses the versioned GHI component library rather than bespoke screenshot recreation.

## Current QA evidence

The source candidate compiles to 39,319 bytes, approximately 38.4 KiB, before Mailchimp normalisation. This is below the 60 KB working target and the Gmail clipping threshold.

Local responsive renders exist for desktop light/dark, 375 px light/dark, 320 px, images blocked, media queries stripped and 200% text. The 320 px render stacks the paired cards with natural height and shows no visible horizontal overflow or CTA clipping.

Validator warnings that remain for this source candidate:

- WhatsApp has no UTM parameters. This is expected for the direct `wa.me` route.
- LinkedIn returns HTTP 999 to the automated checker. It requires a normal-browser check.
- Several card and image links rely on colour or the image rather than underlining. These come from the current reusable component implementation and must be considered in Alex's design review.
- The uppercase-label warning counts component metadata such as locations and statuses as overlines. The visible lead uses one editorial overline; the remaining labels are component fields, not added editorial scaffolding.
- When images are blocked, the full-width development image reserves a large blank area before its alt text and copy. Content remains understandable, but this should be reviewed as a component-system improvement before promotion.

## Approval questions for Alex

- Does the overall hierarchy feel like a suitable GHI weekly edition rather than a property catalogue?
- Should the default edition always include all four commercial sections, or should partner and existing-opportunity modules be opt-in?
- Is the full-width development feature the right prominence for a normal week?
- Should the final Mailchimp deliverable be a saved editable master, or should weekly campaigns be generated from this controlled recipe as standalone compiled HTML?
