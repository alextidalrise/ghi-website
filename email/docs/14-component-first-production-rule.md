# Component-first production rule

## Release state

`component-library/v1/registry.json` is the canonical source-controlled registry for library version `1.0.0`. Its IDs and variant names are stable contracts. The registry status remains `awaiting-human-approval`: source validation and rendering can pass without granting production or Mailchimp approval.

The compiled `build_production/component-library-v1.html` is the all-components Mailchimp master source. It is a source artefact only until it is uploaded to a separately named Mailchimp template, read back, visually reviewed, and approved by Alex. Never overwrite an older approved template during review.

## Mandatory campaign manifest

Every campaign template in `src/templates/`, except the all-components master, must have a matching `src/manifests/<template>.json` containing:

- manifest schema version;
- stable campaign ID and source path;
- exact component-library ID and version;
- authoritative data sources, using either an absolute `https://` URL or the strict repository URI `repository://email/src/templates/<campaign>.html` when the checked-in campaign source itself is the only truthful evidence;
- every top-level component instance in reading order;
- stable component ID, approved variant, unique instance ID, and data source for each instance.

Each top-level source component carries the matching `manifest-id`. `npm run validate:manifests` fails closed on missing manifests, unknown IDs, unapproved variants, duplicate instance IDs, component-ID/tag mismatches, order drift, raw layout tables/containers, or inline campaign CSS.

Campaign source may provide copy, image URLs, links, tracking values, ordering, facts, and approved variant selection. Layout HTML and CSS belong only in `src/components/`, `src/layouts/`, and `src/css/`.

## Missing-component gate

When a campaign need cannot be mapped to the registry:

1. stop campaign assembly;
2. specify a reusable class-level component, not campaign-specific markup;
3. write a failing registry/renderer/plain-text test;
4. implement the component with a stable versioned ID and only named approved variants;
5. add explicit recipient-readable plain-text requirements to the registry;
6. add a representative instance to the all-components master with stable visible `mc:edit` and, where repeatable, `mc:repeatable` names;
7. build and run validators plus desktop, 375px, and 320px renders;
8. obtain Alex's design approval and record the approved source commit;
9. only then add the component to a campaign manifest.

A bespoke exception requires explicit Alex approval and must still be back-ported as a reusable component before release is complete.

## Stable Mailchimp editing surface

Treat every `mc:edit` and `mc:repeatable` value as a public API. Renaming or moving one is a breaking change and requires a new registry version or documented migration. Repeatable names identify whole reusable rows, not fragments inside a card. The shell, masthead, compliance structure, and responsive CSS remain locked.

The v1 master exposes the Albany-derived families as:

- `partner_article_hero_copy` and `partner_article_hero_media`;
- `founder_profile_panel`;
- `service_row_three`;
- `rental_card_pair`, with named left/right card content regions;
- `availability_notice`;
- `partner_to_ghi_transition`;
- `ghi_property_pair`, with a heading and named left/right card regions.

## Plain-text contract

The registry defines required plain-text content for every approved component. Structural components explicitly declare when they produce only ordering or spacing and no visible text. `build_production/*.txt` is generated from compiled HTML, committed beside it, and checked byte-for-byte by `node bin/plaintext.mjs --check`. For every visible component, review the text as a recipient: headings, descriptions, alt/caption context, facts, caveats, and labelled destinations must remain in source order.

## Known validator warnings

Warnings are not silently ignored. For the all-components master, high component/overline counts and larger size are expected because it is a proving master, not a sendable campaign. The second footer heading is intentionally outside the first footer boundary in the plain-text extractor because two mutually exclusive footer variants are demonstrated. Button/image-card links may be reported as not underlined where a separate visible underlined action is present. These warnings remain review evidence and must not be used to waive the same warning in a production campaign.

For Portugal v15, the existing long-email size, overline-count, selected CTA-length, WhatsApp-UTM, and image-card underline warnings remain campaign review items. They do not permit errors, stale plain text, clipping, overflow, or unapproved sending.

## Release gate

A library release requires all of the following:

- clean registry, manifest, validator, build, plain-text, and responsive QA checks;
- no source validation errors;
- desktop, 375px, and 320px master renders inspected;
- Mailchimp master created under a new versioned name;
- template metadata/default editable content read back;
- stored Mailchimp render checked at the same widths;
- Alex's explicit approval of the component library/master.

Local success proves a release candidate only. It does not prove Mailchimp storage, inbox rendering, or human approval.
