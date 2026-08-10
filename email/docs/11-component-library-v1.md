# GHI approved email component library v1

**Status:** implementation contract

This library extends the existing locked GHI shell and primitive components. It exists to reproduce the approved Portugal v15 content/design jobs safely in email and to support future destination, collection and editorial campaigns.

## Architecture

- `src/layouts/main.html`: locked shell.
- Existing primitives: section, figure, heading, text, link, button, band, rule, spacer.
- New semantic components below: controlled combinations with stable props and email-safe rendering.
- `src/templates/component-library-v1.html`: all-components proving fixture.
- `src/templates/portugal-v15.html`: campaign render using only approved components.
- Compiled HTML and explicit plain text are committed and reviewed together.

The all-components fixture is a review master. Production campaigns include only selected blocks; unused modules must not be hidden inside campaign HTML.

## Component contracts

### `editorial-lead`

**Job:** preserve the approved opening hierarchy.

**Fields:** optional overline, one H1 or H2 heading, lead copy and supporting body copy supplied as live text children.

**Rules:** one H1 per email; no personalised greeting unless the campaign brief requests one; no image of essential text.

### `section-intro`

**Job:** open a major editorial job with optional ruled top edge.

**Fields:** heading level, title, lead/body children, `ruled` boolean.

**Rules:** rules are 1px table cells; spacing uses cell padding; source order is reading order.

### `destination-feature`

**Job:** reproduce one v15 destination image/text/CTA unit.

**Required:** `src`, `alt`, `href`, `title`, `location`, image dimensions; body and CTA label as live children/props.

**Desktop:** balanced image/copy cells.

**Mobile:** image, caption/location, heading, body, CTA in that order.

**Limits:** normally 2-6 per destination campaign; whole image and visible text action link to the same canonical destination.

### `advisory-cta`

**Job:** quiet mid-email action on a stone ground.

**Required:** heading, body, one CTA href/label.

**Rules:** subordinate to the campaign’s final primary CTA; not a second green band.

### `entity-card`

**Job:** reusable live-text card for a development or golf course.

**Required:** `src`, `alt`, `href`, `title`, location line.

**Optional development fields:** price, status, completion.

**Rules:** image/title/action share one canonical entity destination; price/status/completion are live text; no overlay copy baked into imagery; empty optional facts collapse cleanly.

### `card-pair`

**Job:** two equal desktop cells that stack on mobile.

**Rules:** child source order is mobile order; 24px gutter; no CSS grid/flexbox; one child is valid and must not leave a broken blank cell.

### `small-print`

**Job:** commercial-data qualification or source note.

**Rules:** 13px minimum, muted but AA-compliant, explicit in plain text.

### `partner-cell`

**Job:** compact partner identity/service cell.

**Required:** partner name and service label.

**Optional:** PNG/JPG logo and public GHI partner-hub href.

**Rules:** typeset-name fallback; meaningful logo alt; never project internal referral URLs; service and buyer-choice meaning remain live text.

### `partner-grid-row`

**Job:** two partner cells on desktop, stacked on mobile.

**Rules:** ruled cells, equal optical logo area, source-order stacking.

### `guide-card`

**Job:** dark-green live-text buying-guide card.

**Required:** audience label, title, summary, canonical href and action label.

**Rules:** no baked text artwork; one card is one coherent link destination; sufficient contrast; normally used as a pair.

### `dual-action-enquiry`

**Job:** final Portugal-style enquiry panel.

**Required:** heading, body, primary CTA and secondary WhatsApp CTA.

**Rules:** exactly one visually dominant primary action; WhatsApp is subordinate and uses the canonical configured route; no third default action; closes onto a white section before the green compliance footer.

## Cross-component requirements

- absolute HTTPS URLs;
- campaign-specific UTMs on campaign links;
- pinned JPG/PNG Sanity image formats;
- descriptive alt text;
- no unresolved placeholders;
- deterministic plain text containing all H1/H2 headings and destinations;
- no more than one body-level green band;
- one overline per campaign unless explicitly approved;
- no horizontal overflow at 320px;
- readable with images blocked, media queries removed and text enlarged 200%;
- no unsupported elements or CSS;
- no stale sample copy in campaign templates.

## Mailchimp editable-region contract

The component-library fixture may expose named regions for review, but a production campaign should use stable section names scoped to its structured plan. Locked shell content remains uneditable. Renaming an `mc:edit` key is a breaking API change and requires documentation and migration.
