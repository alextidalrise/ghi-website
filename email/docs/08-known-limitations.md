# Known limitations and graceful degradation

What is accepted to degrade, and how far. The governing principle from the
brief: **functional and brand consistency, not pixel identity**.

---

## Accepted degradation

These are expected and are not defects.

| Client | Degrades to | Acceptable because |
|---|---|---|
| Gmail (all), Outlook Windows (both), Outlook.com, Yahoo | Georgia and Arial instead of Playfair Display and Libre Franklin | Georgia and Arial are the design baseline; every size was chosen against their metrics. The web font is the bonus. |
| Classic Outlook for Windows | No media queries: desktop layout at whatever width the pane is | The column is fluid to 600px and the desktop rhythm is legible at any width. The max-width form means it shrinks rather than scrolls. |
| Classic Outlook for Windows | Only the CTA's text is clickable, not the whole cell | A mouse client. The button still looks and reads correctly. |
| Gmail Android, some Outlook builds | Forced colour inversion: the white body becomes dark, colours shift | The green bookends carry the logo and the entire required footer and are left alone by inverting clients. |
| Any client | The `#e2ded5` hairline becomes invisible | It is decorative only. Nothing depends on it, ever. |
| Any client | Web fonts absent, `@import` stripped | Progressive enhancement. |
| Any client with images off | Full-bleed photograph becomes styled alt text on a stone ground | The alt text carries the message and is charcoal on stone at 10.54:1. |
| Forwarded and replied messages | Markup materially altered | Reviewed, but not an acceptance requirement. |

---

## Real limitations

Things that are genuinely constrained, not merely degraded.

### The CTA is not fully clickable in classic Outlook

Spacing goes on `<td>` padding, per the brief and because Word ignores padding
on inline elements. The consequence is that in classic Outlook the clickable
region is the text, not the padded cell. Making the whole cell clickable
requires either padding the anchor (which Word ignores) or VML (which the
zero-radius brand otherwise never needs). Not worth the markup for a mouse
client.

### Dark mode is only partly controllable

`prefers-color-scheme` is honoured by Apple Mail and, partially, by Outlook.com
and new Outlook. Gmail on Android performs its own inversion regardless. The
bookend strategy makes this survivable rather than solved: the logo and footer
are stable everywhere, the white body is not.

### The green band nearly disappears in dark mode without its edge

`#1f3d34` against the dark body `#1c231e` is 1.35:1. The gold hairline edges are
what keep the heaviest device in the kit legible as emphasis. Do not remove
them for aesthetic reasons.

### Arabic typography is unreviewed

The strings are translated and RTL works structurally, but no native reader has
reviewed the sizes. The 11px overline in particular is likely too small: Arabic
generally needs more size than Latin at the same optical weight. Raise before
the first UAE campaign.

### The reference photograph is a static asset

Deliberate: a permanent QA fixture that depends on a specific CMS document
existing is a fixture that breaks silently. It means the reference emails do not
exercise the Sanity CDN path. Real campaigns must use `buildEmailImageUrl()`,
and the validator fails `auto=format` URLs, which is the failure mode that
matters.

### Contrast checking is approximate

`bin/validate.mjs` resolves each element's nearest ancestor background by
walking open and close tags. That is correct for the markup this system
generates and could be fooled by unusual hand-written nesting. It measures
inline styles only, so a colour applied by a dark-mode class is checked against
the token table in `lib/tokens.mjs` rather than in situ.

### Local screenshots are not client testing

Chromium is a fair proxy for Apple Mail and Gmail web and no proxy at all for
Word's engine, Gmail's CSS filtering, or forced inversion. See
[04-qa-plan.md](04-qa-plan.md).

---

## Out of scope, by agreement

AMP for Email and other interactive formats. Transactional email.
HubSpot-to-Mailchimp contact sync. Audience migration and consent review.
Campaign scheduling. Template types, individual template designs, a component
inventory, campaign content structures. Building the agent.

---

## Open questions for the client

Carried forward from the brief; none block the foundation, all block a first
send.

1. **Testing-tool budget.** Litmus or Email on Acid, versus Inbox Preview plus
   owned devices. Determines whether the QA report can claim the full client
   matrix or must name classic Outlook for Windows as untested. See
   [04-qa-plan.md](04-qa-plan.md#layers-3-and-4-the-client-matrix).
2. **Audience merge fields.** `lib/merge-tags.mjs` assumes `FNAME`/`LNAME`
   exist. Confirm against the live audience.
3. **Physical address and permission wording.** The footer pulls the address
   from `*|LIST:ADDRESS|*`, so it comes from audience settings; the permission
   reminder is currently our own English/Spanish/Portuguese/Arabic strings in
   `locales/`. Confirm the legal wording.
4. **Audience client usage.** Until the first campaign is sent, testing priority
   is guesswork.
5. **Which languages are actually going out.** All four are seeded; only English
   has been through copy review.
