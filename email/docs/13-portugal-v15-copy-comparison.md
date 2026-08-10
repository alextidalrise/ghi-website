# Portugal v15 versus rebuilt email: full copy and module comparison

**Audit date:** 10 August 2026  
**Canonical source:** `knowledge-base/03-content/campaigns/2026-08-10-portugal-launch/web-preview/index.html`  
**Email source:** `email/src/templates/portugal-v15.html`  
**Compiled HTML:** `email/build_production/portugal-v15.html`  
**Plain text:** `email/build_production/portugal-v15.txt`

## Verdict

Alex's concern is valid: the rebuilt email is **not a literal copy of every visible or hidden string in the v15 web preview**.

The important distinction is:

- **Substantive campaign copy:** retained verbatim. The hero proposition, editorial lead, four destination descriptions, advisory copy, collection introduction, all ten property records, golf introduction, independent-support statement, guide introduction and summaries, and closing enquiry copy match the canonical v15 web preview.
- **Interface, metadata and delivery copy:** adapted. Alex approved the email subject and preheader, the visible partner names and guide CTA labels. The email retains UTM parameters and a compliance footer. It intentionally omits the web table of contents and mobile portfolio controls. The canonical `Portugal collection` masthead label, copy-first hero hierarchy and four `View course →` labels have now been restored.
- **Resolved after audit:** Alex approved Instagram and LinkedIn for the reusable footer. The corrected shell now includes email-safe linked icons, visible fallback labels and plain-text destinations.
- **Design/order adaptation:** the email now retains the canonical copy-first reading order in a dependable stacked layout rather than reproducing the web-only side-by-side composition.

No property name, location, price, availability stage or completion date has been rewritten or dropped.

## Classification key

- **Exact retention:** same words and meaning, with only HTML entity or line-wrapping differences.
- **Technical adaptation:** required or reasonable because email cannot use the web interaction/layout directly.
- **Added email copy:** new inbox, action or compliance wording with no literal v15 counterpart.
- **Omission:** canonical content or link absent from the email.
- **Reordered:** same content, different reading order.
- **Unintended drift:** a difference that should not have been present.

## Module-by-module register

### 1. Web preview status strip

| Canonical v15 | Rebuilt email | Classification |
|---|---|---|
| `Draft web preview · 10 August Portugal campaign · not published` | Absent | Technical adaptation: correct omission. Internal draft wording must not appear in a recipient email. |

### 2. Inbox metadata and document title

| Field | Canonical v15 | Rebuilt email | Classification |
|---|---|---|---|
| Web meta description / email preheader | `Explore Golf Homes International's Portugal portfolio across Vilamoura, Quinta do Lago, Monte Rei and Palmares.` | `Explore Vilamoura, Quinta do Lago, Monte Rei and Palmares, with current developments, golf and independent buyer support.` | Approved email-specific preview text; related meaning rather than exact retention. |
| Document title | `Golf Homes International in Portugal: Golf Property Across the Algarve` | `Golf Homes International in Portugal` | Shortened email metadata. The full canonical title remains the H1. |
| Recipient-visible subject | No web equivalent | `Golf Homes International in Portugal` | Approved email-specific subject. |
| Hidden preheader | No web equivalent | Same as the email preview text above | Added technical/inbox content. It now matches Mailchimp's preview setting exactly. |

### 3. Brand masthead

| Canonical v15 | Rebuilt email | Classification |
|---|---|---|
| GHI logo | GHI logo | Exact brand retention using an email-safe hosted raster asset. |
| `Portugal collection` | `Portugal collection` | Restored exact masthead label. |
| No hero overline | No hero overline | The added `Portugal` overline was removed when the canonical masthead label was restored. |
| Logo is not the primary textual link in the article | Logo links to the GHI homepage with `utm_source=mailchimp&utm_medium=email` | Technical email addition. |

### 4. Hero

| Element | Canonical v15 | Rebuilt email | Classification |
|---|---|---|---|
| H1 | `Golf Homes International in Portugal: Golf Property Across the Algarve` | Exact same wording | Exact retention. |
| Standfirst | `Discover our Portugal collection across Vilamoura, Quinta do Lago, Monte Rei and Palmares, part of our wider golf-property portfolio across Portugal and Spain.` | Exact same wording | Exact retention. |
| Date and taxonomy | `10 August 2026`, `Portugal`, `Golf property`, `Buyer guidance` as separate web items | `10 August 2026 · Portugal · Golf property · Buyer guidance` | Technical formatting adaptation; words and order retained. |
| Hero caption | `Quinta do Lago, the Ria Formosa and Atlantic coast` | Exact same wording | Exact retention. |
| Hero alt text | `Aerial view across Quinta do Lago towards the Ria Formosa and Atlantic coast` | Exact same wording | Exact retention. |
| Reading order | Headline/standfirst/meta precede the image in the canonical DOM; copy and image form one side-by-side composition on desktop | Headline/standfirst/meta precede the image in the HTML and plain-text reading order | Approved stacked email adaptation retaining the canonical copy-first hierarchy. |

### 5. Article navigation

The canonical web preview contains an `In this article` navigation in desktop and mobile forms with six labels:

1. `Golf Homes International in Portugal`
2. `Four Algarve golf-property destinations`
3. `The current Portugal portfolio`
4. `Golf across the Algarve`
5. `Independent buyer support`
6. `Portugal buying guides`

The rebuilt email omits the whole navigation.

**Classification:** technical omission. Sticky navigation, collapsible details and in-page article anchors are web interactions, not dependable inbox interactions. The omission is reasonable, but it is still a visible copy difference.

### 6. Editorial opening

| Canonical v15 | Rebuilt email | Classification |
|---|---|---|
| `The specialist estate agency for golf destinations` | Exact same wording | Exact retention. |
| `Golf Homes International is the specialist estate agency for buyers looking to purchase property in golf destinations. In Portugal, we market homes across Vilamoura, Quinta do Lago and the neighbouring Golden Triangle, Monte Rei and Palmares.` | Exact same wording | Exact retention. |
| `Our current collection includes apartments, serviced residences, houses, villas and plots. Explore the locations and developments below, then contact our Portugal team for current prices, availability, brochures and viewing arrangements.` | Exact same wording | Exact retention. |

No shortening, rewriting or omission was found in this module.

### 7. Destination section

The section heading `Four Algarve golf-property destinations` is retained exactly.

| Destination | Title | Description | Image caption | CTA | Result |
|---|---|---|---|---|---|
| Vilamoura | Exact | Exact, both sentences | Exact | `See Vilamoura properties` exact | Exact copy retention |
| Quinta do Lago | Exact | Exact, both sentences | Exact | `See Quinta do Lago properties` exact | Exact copy retention |
| Monte Rei | Exact | Exact, both sentences | Exact entity text; `&` is encoded as `&amp;` in HTML only | `See Monte Rei properties` exact | Exact copy retention |
| Palmares | Exact | Exact, both sentences | Exact | `See Palmares properties` exact | Exact copy retention |

All four alt texts are also exact.

**Technical image adaptation:** local WebP preview assets were replaced with hosted Sanity sources and explicit classic-format transforms. The destination images are square-cropped in the email rather than using the wider web card proportions. This changes presentation, not copy.

**Palmares identity:** the email now follows the canonical v15 assignment exactly:

- destination feature: canonical `development-ghi00131.webp` identity;
- development card: canonical `location-palmares.webp` identity.

### 8. Mid-email advisory CTA

| Canonical v15 | Rebuilt email | Classification |
|---|---|---|
| `Explore our current Portugal property collection` | Exact | Exact retention. |
| `Tell us which location or property has caught your attention. Our Portugal team will confirm current prices and availability, provide the relevant brochures and floor plans, and help arrange focused property viewings.` | Exact | Exact retention. |
| `Enquire about Portugal property` | Exact | Exact retention. |
| Contact URL | Same GHI contact destination | Same destination plus Mailchimp UTM parameters | Technical tracking adaptation. |

### 9. Property collection introduction and small print

| Canonical v15 | Rebuilt email | Classification |
|---|---|---|
| `Our current Portugal property collection` | Exact | Exact retention. |
| `Our current Portugal collection includes ten developments across four established Algarve golf destinations.` | Exact | Exact retention. |
| `Explore the apartments, residences, houses, villas and plots below, then speak with our Portugal team for the latest availability and property-specific details.` | Exact | Exact retention. |
| `Guide prices and stages were checked against current GHI records on 8 August 2026. Completion dates can vary by phase and should be reconfirmed for the exact property before reservation.` | Exact | Exact retention. |

No approved sentence is combined, shortened or rewritten in HTML. Paragraph separation is retained in plain text.

### 10. Ten development records

All ten records remain in canonical order and retain the canonical facts.

| Development | Location | Price | Stage | Completion | Result |
|---|---|---:|---|---|---|
| Monte Rei Golf & Country Club | Monte Rei · Portugal | From €550,000 | Available now | None shown | Exact |
| Palmares | Palmares · Portugal | From €600,000 | Under construction | Phased completions: Q3 2026 and Q4 2028 | Exact |
| Azuya | Quinta do Lago · Portugal | From €1,750,000 | Off plan | Estimated completion: Q2 2028 | Exact |
| Sutaya | Quinta do Lago · Portugal | From €4,000,000 | Under construction | Estimated completion: Q2 2027 | Exact |
| Zestia | Vilamoura · Portugal | From €560,000 | Off plan | Estimated completion: 2028 | Exact |
| Terracota | Vilamoura · Portugal | From €660,000 | Under construction | Estimated completion: Q4 2027 | Exact |
| Springs at The Els | Vilamoura · Portugal | From €1,290,000 | Under construction | Estimated completion: Q1 2028 | Exact |
| Natura Village | Vilamoura · Portugal | From €790,000 | Available now | None shown | Exact |
| The Uncommon | Vilamoura · Portugal | From €740,000 | Off plan | Estimated completion: July 2028 | Exact |
| Nobilus | Vilamoura · Portugal | From €680,000 | Under construction | Estimated completion: October 2026 | Exact |

Differences:

- Canonical web markup displays location and country as separate fields. Email renders them as one label separated by `·`. **Technical formatting adaptation.**
- The canonical mobile web view has hidden grouping labels (`Monte Rei`, `Palmares`, `Quinta do Lago`, `Vilamoura`) and `See all 10 developments` / `Show fewer developments` controls. Email shows every record and omits those labels and controls. **Technical interaction omission.**
- All development URLs have the same destinations with email UTM parameters added. **Technical tracking adaptation.**
- Development image alt texts match exactly. Hosted and cropped renditions are technical adaptations of the approved asset identities.

### 11. Golf section

| Element | Canonical v15 | Rebuilt email | Classification |
|---|---|---|---|
| Heading | `Golf across our Portugal locations` | Exact | Exact retention. |
| Intro | `These four courses show how Algarve golf settings vary, from mature resort landscapes to quieter inland and coastal environments.` | Exact | Exact retention. |
| Course 1 | The Old Course · Vilamoura | The Old Course · Vilamoura · Portugal | `Portugal` added to the label. |
| Course 2 | South Course · Quinta do Lago | South Course · Quinta do Lago · Portugal | `Portugal` added to the label. |
| Course 3 | Monte Rei Golf & Country Club · Monte Rei | Monte Rei Golf & Country Club · Monte Rei · Portugal | `Portugal` added to the label. |
| Course 4 | Palmares Golf Course · Palmares | Palmares Golf Course · Palmares · Portugal | `Portugal` added to the label. |
| Course action | `View course →` on each web figure | `View course →` on each email card; title and image remain linked | Exact visible label restored with an email-safe redundant destination link. |

Course names, order, destinations, URLs and alt texts are exact apart from added UTM parameters.

### 12. Independent buyer support and partners

| Canonical v15 | Rebuilt email | Classification |
|---|---|---|
| `Independent support around the purchase` | Exact | Exact retention. |
| `Alongside the property search, we can introduce independent specialists for legal, mortgage, currency, wealth, rental and project-management needs. Buyers remain free to choose and appoint their own advisers directly.` | Exact | Exact retention. |

All eight partner identities, roles and order are retained:

1. Fiberpay — Currency exchange
2. TOL Legal Team — Legal and tax
3. Olive Grove Partners — Investment
4. Atlas Bridge Wealth — Wealth management
5. Albany Global Property — Holiday rentals
6. Vorto Group — Currency exchange
7. Apex Attitude — Mortgage
8. Nueva Vida Group — Project management

**Difference:** v15 communicates each partner name primarily through its logo and alt text; the email additionally renders the partner name as visible text. This is an **added accessibility/readability adaptation**, not rewritten partner copy.

All partner links retain the GHI partners destination with UTM parameters added.

### 13. Buying guides

| Element | Canonical v15 | Rebuilt email | Classification |
|---|---|---|---|
| Heading | `Portugal buying guides` | Exact | Exact retention. |
| Intro | `Our separate guides give UK and international buyers a practical introduction to preparation, purchase costs, finance and the legal process. Transaction-specific advice should come from independently appointed specialists.` | Exact | Exact retention. |
| UK label | `For UK buyers` | Exact | Exact retention. |
| UK title | `How to buy property in Portugal as a UK buyer` | Exact | Exact retention. |
| UK summary | `A step-by-step introduction to the NIF, legal process, purchase costs, mortgages, tax and the 90-day rule.` | Exact | Exact retention. |
| International label | `For international buyers` | Exact | Exact retention. |
| International title | `How to buy property in Portugal as an international buyer` | Exact | Exact retention. |
| International summary | `An overview of preparation, the legal process, purchase costs, finance, tax and residency boundaries.` | Exact | Exact retention. |
| UK action | Whole web card is linked; no separate action text | `Read the UK buyer guide` | Added email CTA label. |
| International action | Whole web card is linked; no separate action text | `Read the international guide` | Added email CTA label. |

A plain-text paragraph split found during this audit has been corrected and regression-tested. The international summary is now one intact paragraph rather than being broken after `legal process,`.

### 14. Closing enquiry

| Canonical v15 | Rebuilt email | Classification |
|---|---|---|
| `Enquire about golf property in Portugal` | Exact | Exact retention. |
| `Speak with our Portugal team about current availability, starting prices, brochures, floor plans and viewing arrangements across Vilamoura, Quinta do Lago, Monte Rei and Palmares.` | Exact | Exact retention. |
| `Enquire about Portugal property` | Exact label | Exact retention. Web arrow is not part of the email label. |
| `WhatsApp our Portugal team` | Exact label | Exact retention. Web external-link arrow is not part of the email label. |
| Contact destination | GHI contact page | Same page plus UTM parameters | Technical tracking adaptation. |
| WhatsApp destination | Verified `wa.me` route | Exact verified route | Exact destination retention. |

### 15. Footer

The canonical web footer contains:

- `Draft preview for internal review only. Images remain subject to campaign sign-off. No content has been published.`
- Instagram link
- LinkedIn link

The email at audit time:

- correctly omits the internal draft-preview sentence;
- **omits the Instagram and LinkedIn links entirely**;
- adds the required permission reminder;
- adds Mailchimp list company/address merge tags;
- adds view-in-browser, update-preferences and unsubscribe links;
- adds the copyright line.

Classification:

- draft-preview sentence: **correct technical omission**;
- Instagram and LinkedIn: **unintended omission, subsequently corrected in the reusable footer after Alex's approval**;
- compliance content: **required email-only addition**.

## URL comparison

### Same destination with tracking added

The following destination groups retain the canonical endpoint and add:

`utm_source=mailchimp&utm_medium=email&utm_campaign=portugal-v15`

- four destination pages;
- ten development pages;
- four golf-course pages;
- GHI partners page;
- two buying-guide pages;
- GHI contact page.

This is a technical campaign-tracking adaptation rather than a destination change.

### Different or additional link treatment

- Masthead logo: email-only link to the GHI homepage with Mailchimp source/medium tags.
- WhatsApp: same verified route; no GHI-site UTM is applicable.
- Mailchimp compliance links: email-only merge-tag destinations.
- Instagram and LinkedIn: present in canonical v15 and now restored in the reusable email footer with Mailchimp/email UTM parameters.

## Image and alt-text comparison

- Canonical and compiled email each expose 28 image alt identities, including the GHI logo.
- All 28 alt identities are shared.
- Hero, destination, development, golf and partner assets use hosted email-safe renditions rather than local web-preview files.
- Development, golf and most partner assets were checked against the canonical preview via shared alt identity and perceptual comparison of the rendered source.
- Destination cards use different aspect ratios/crops in email, so pixel-level hashes are not expected to match even when source identity is correct.
- The corrected Palmares assignments now match the literal canonical v15 page.

## Plain-text comparison

The explicit plain-text version:

- retains every substantive campaign paragraph and heading listed above;
- retains all ten property prices, stages and completion strings;
- includes linked URLs after labels/headings;
- includes image alt text and captions so blocked-image meaning is not lost;
- includes partner names as text;
- includes the two added guide CTA labels;
- adds the required compliance footer;
- omits the hidden preheader, as expected for the explicit body alternative;
- follows the approved copy-first hero reading order;
- intentionally omits the web table of contents and mobile interaction labels;
- includes the restored course `View course →` labels and approved reusable social links.

The newly detected international-guide paragraph break has been fixed. No malformed partner/guide joins remain.

## Canonical web preview versus the separate v15 Markdown handover

The Markdown handover is not textually identical to the canonical web preview. The email follows the web preview where the two differ. Examples:

| Markdown handover | Canonical web preview and rebuilt email |
|---|---|
| `Vilamoura: variety within an established resort` | `Vilamoura` |
| `Quinta do Lago and the Golden Triangle: privacy and an established setting` | `Quinta do Lago` |
| `Monte Rei: a quieter eastern Algarve base` | `Monte Rei` |
| `Palmares: coast, golf and the Lagos lifestyle` | `Palmares` |
| `Golf across the Algarve` | `Golf across our Portugal locations` |
| `Independent support for a Portugal purchase` | `Independent support around the purchase` |
| `Golf Homes International's separate Portugal guides give…` | `Our separate guides give…` |
| `Availability and completion timing can vary by phase…` | `Completion dates can vary by phase…` |

This source discrepancy can make the email appear different if it is compared with the Markdown article rather than James's approved rendered v15 preview.

## Required decision before calling the email faithful

The body copy does not need a wholesale rewrite: its substantive paragraphs and commercial records already match the canonical v15 preview.

The decision record is now:

1. **Approved:** email-specific subject and preview text.
2. **Implemented:** restore `Portugal collection` and remove the duplicate hero overline.
3. **Implemented:** restore the canonical copy-first hero hierarchy using a stacked email-safe layout.
4. **Approved/implemented:** continue omitting the web article navigation; restore four `View course →` labels.
5. **Approved:** retain visible partner names and explicit guide CTA labels.

The decisions are resolved in source. The campaign remains a draft and is not authorised for a live audience; any corrected internal proof is a separate review action, not send authority.
