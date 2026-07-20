# Analytics, GTM and consent

How measurement works on this site, what it deliberately does not measure, and what has to
be done in the Google consoles rather than in this repository.

- GA4 property: `G-KVB1ZMSGZV`
- GTM container: `GTM-5KWMLHJP`

The GA4 measurement ID appears nowhere in this codebase on purpose. It lives in the GTM
container's Google Tag, so the property can be changed without a deploy.

---

## 1. How it fits together

```
hooks.server.ts
  └─ analyticsHandle                  resolves the gate, reads the consent cookie,
       └─ transformPageChunk          and injects the bootstrap into <head>
            └─ %ghi.analytics%        placeholder in app.html

+layout.svelte
  ├─ configureAnalytics(mode)         gate, from server data
  ├─ initConsent(consent)             decision, from server data
  └─ afterNavigate → trackPageView    exactly one page view per navigation

components → $lib/analytics (events.ts) → sanitize.ts → window.dataLayer → GTM → GA4
```

Components never touch `window.dataLayer`. They call typed functions from `$lib/analytics`,
so every payload passes the sanitizer. A test in `sanitize.test.ts` greps the source tree
and fails if `dataLayer` appears outside `src/lib/analytics/`.

The consent defaults are injected as a **server-rendered inline script**, not from a client
module. That is the only way to guarantee they execute before the container loads. It also
means a returning visitor's stored decision is applied in the same synchronous block,
before GTM — so `wait_for_update` only ever matters for a first-time visitor.

---

## 2. Environment gating

Analytics runs only when every one of these holds. First match wins, and the reason is
emitted as an HTML comment (`<!-- analytics off: … -->`) so you can view-source any
environment and see why it is silent.

| # | Condition | Result |
|---|---|---|
| 1 | `PUBLIC_GTM_ID` missing | off |
| 2 | route under `/internal` | off |
| 3 | Sanity draft preview session | off |
| 4 | valid debug token | **debug** |
| 5 | `PUBLIC_ANALYTICS_ENABLED` is not exactly `"true"` | off |
| 6 | dev server | off |
| 7 | host is not `golfhomesinternational.com` or `www.` | off |
| 8 | otherwise | **live** |

Gating on hostname rather than `VERCEL_ENV` means a preview promoted to production starts
reporting automatically, and a production build served anywhere else stays silent.

Note the debug check sits *after* the internal-route and preview guards: no token can
switch tracking on inside the design system or a draft session.

### Debug sessions

To use GTM Preview or Tag Assistant against a Vercel preview deployment:

1. Set `ANALYTICS_DEBUG_TOKEN` on that deployment.
2. Visit any URL with `?ghi_debug=<token>`. This sets a 2-hour httpOnly cookie.
3. End it with `?ghi_debug=off`.

In debug mode the page pushes `ghi_environment: 'debug'` before the container loads.
**The container must use that to block production GA4 tags** — see §6.

---

## 3. Consent

Google Consent Mode v2, advanced implementation: GTM loads before a decision is made, with
everything denied, so Google may record a cookieless ping but can set no cookies.

| Visitor choice | Google signals granted |
|---|---|
| (no decision) | `security_storage` only |
| Analytics | `+ analytics_storage` |
| Marketing | `+ ad_storage`, `ad_user_data`, `ad_personalization`, `personalization_storage` |

`ads_data_redaction` is on until marketing is accepted.

### The consent UI is not built yet

This repository ships the consent *logic* only; the banner and preference panel are a
separate piece of work. **Until they ship, nobody can grant consent**, so production will
sit permanently in the denied state and GA4 reports will be sparse. That is the correct
legal position, not a bug.

The UI drives `$lib/analytics`:

```ts
consent.needsPrompt      // show the banner
consent.preferencesOpen  // show the preference panel
consent.analytics / consent.marketing / consent.decided / consent.ready

acceptAll() / rejectAll() / saveConsent({ analytics, marketing })
withdrawConsent({ reload })     // reloads by default
openPreferences() / closePreferences()
onConsentChange(fn)
```

`initConsent()` is already called by the root layout with the server-read cookie, so the
banner can render correctly in the first paint with no flash for a returning visitor.

Withdrawing consent deletes the Google cookies **and reloads**. The reload is deliberate:
deleting `_ga` does not clear the client id the loaded gtag holds in memory, which would
simply rewrite the cookie on the next hit. Granting consent never reloads.

Bumping `CONSENT_VERSION` in `consentCookie.ts` invalidates every stored decision, so a
material policy change re-asks everyone with no other code change.

---

## 4. Event dictionary

All events are named `ghi_*` and are vendor-neutral — the container maps them to GA4, so
renaming a GA4 event never requires a code change here.

| Data-layer event | GA4 event | Fires when | Emitted by |
|---|---|---|---|
| `ghi_virtual_page_view` | `page_view` | Every completed navigation, incl. first load | `+layout.svelte` |
| `ghi_search_submitted` | `search` | Filters applied (debounced 600ms) or discovery bar submitted | `ListingFilters`, `DiscoveryBar` |
| `ghi_listing_list_viewed` | `view_item_list` | A listing collection scrolls into view (30%) | `ListingGrid`, `ListingRail` |
| `ghi_listing_selected` | `select_item` | A listing card is clicked | `PropertyCard`, `DevelopmentCard`, `SpotlightCard` |
| `ghi_listing_viewed` | `view_item` | A listing detail page is viewed | `pageView.ts`, from page data |
| `ghi_gallery_opened` | `gallery_open` | The lightbox opens | `property/Gallery.svelte` |
| `ghi_gallery_image_viewed` | `gallery_image_viewed` | Deliberate image navigation | `property/Gallery.svelte` |
| `ghi_floorplan_request_started` | `floorplan_request_started` | Floorplan CTA opens the form | `PropertyDetail.svelte` |
| `ghi_contact_clicked` | `contact_click` | WhatsApp, phone or email CTA chosen | `EnquiryRail`, `/contact`, `TalkToUsBand` |
| `ghi_lead_submitted` | `generate_lead` | **HubSpot accepted a submission** | `EnquiryRail`, `/contact` |

### Parameters

**Page view** — `page_location` (query string filtered to known-safe keys), `page_path`,
`page_title`, `page_type`, `listing_kind`.

`page_type` is one of: `home`, `country`, `location`, `community`, `listing`, `unit`,
`golf_course`, `collection`, `guide_index`, `guide`, `insight_index`, `insight`, `about`,
`contact`, `partners`, `legal`, `holding`, `internal`, `not_found`.

`listing` covers property, development and catch-all detail pages alike; `listing_kind`
carries the distinction, because the route id cannot.

**Search** — `search_placement` (`results_filters` | `discovery_bar`), `country`,
`location`, `community`, `property_type`, `price_band`, `min_beds`, `sort`,
`selected_features` (max 10), `golf_relevance`, `result_count`.

There is **no `search_term`**. The site has no free-text search box — every filter draws on
a closed vocabulary — so there is nothing to send.

**Items** — `item_id` (the GHI id), `item_name`, `item_brand`, `item_category` (listing
kind), `item_category2` (property type), `item_category3` (country slug), `item_category4`
(location slug), `price`, `currency`, `item_list_id`, `item_list_name`, `index`.

Categories use slugs rather than display names: stable across CMS copy edits, already
lowercase, and incapable of carrying an address fragment.

**A listing with no GHI id is never reported.** We do not fall back to the Sanity `_id`,
which is internal data.

**Price on application sends no price at all**, never a zero. Four cases collapse to "no
price": no pricing object, `priceDisplay === 'POA'`, an `enquiry_led` development, and any
non-positive amount. `currency` is only ever sent alongside a price.

**Engagement** — `listing_id`, `image_position`, `image_count`, `gallery_surface`,
`navigation_method` (`arrow` | `thumbnail` | `swipe` | `keyboard`), `contact_method`
(`whatsapp` | `phone` | `email`), `placement`.

**Leads** — `lead_type` (`listing_enquiry` | `contact_enquiry` | `floorplan_request`),
`form_location`, `listing_id`.

### Lists

| `list_id` | `list_name` |
|---|---|
| `featured` | Featured listings |
| `frontline` | Front-line collection |
| `similar` | (the rail's heading) |
| `search_results` | (the results heading) |

Golf course rails are excluded: a course is not a listing, has no GHI id or price, and
course impressions are not a commercial metric.

### What is deliberately not measured

- **Newsletter and buyer-guide signups.** `/api/newsletter` is a stub that returns `ok`
  without contacting HubSpot. Reporting a conversion for a subscription that was never
  delivered would be worse than reporting nothing. `buyer_guide_request` is absent from
  `LeadType` for the same reason. See the TODO in that file for what to add when it is
  wired up — `sign_up`, not `generate_lead`.
- **The `/soon` holding page.**
- **Anything on `/internal`.**

---

## 5. Prohibited data

Never send: names, email addresses, telephone numbers, enquiry message text, exact property
addresses, IP addresses, HubSpot contact ids, Sanity document ids or internal notes, or any
URL parameter that might carry personal data.

`sanitize.ts` enforces this on every payload, in four layers:

1. **Allowlist** of every key the typed builders can produce. Anything else is dropped.
   This is viable because we construct every payload ourselves.
2. **Blocklist patterns** as a second net, with explicit exceptions for keys that
   legitimately contain a blocked word (`item_name`, `page_location`).
3. **Value heuristics** — email-shaped, phone-shaped, or over 120 characters of prose.
4. **Empty stripping** — `undefined`, `null`, `''` and empty arrays never reach GTM.

In development a violation **throws**, so a leak breaks the page at the call site. In
production the offending key is dropped and the rest of the event is sent: losing a
dimension is a much smaller loss than losing a conversion count.

`page_location` is rebuilt with only known-safe query parameters, so a campaign link
carrying `?email=` cannot leak an address into GA4 by way of the page URL.

---

## 6. What must be configured in the consoles

These cannot be done from this repository.

### GTM container

- [ ] Google Tag: set **`send_page_view: false`**. Without this every navigation is counted
      twice — once by the tag, once by `ghi_virtual_page_view`.
- [ ] GA4 admin: disable enhanced measurement's **"page changes based on browser history
      events"**, for the same reason.
- [ ] Create custom event triggers for each `ghi_*` event and map them per §4.
- [ ] Add a blocking exception on all production GA4 tags for
      `ghi_environment equals debug`, so debug sessions cannot pollute real reporting.
- [ ] Do not add a `<noscript>` container snippet. It cannot respect consent state, and the
      site deliberately ships without one.
- [ ] Give every published version a meaningful name and description.

Suggested naming:

```
Tag - GA4 - Google tag              Trigger - Custom event - ghi_virtual_page_view
Tag - GA4 - Page view               Trigger - Custom event - ghi_search_submitted
Tag - GA4 - Search                  Trigger - Custom event - ghi_listing_viewed
Tag - GA4 - View item list          …
Tag - GA4 - Select item             Variable - DLV - listing_id
Tag - GA4 - View item               Variable - DLV - lead_type
Tag - GA4 - Generate lead
Tag - GA4 - Contact click
```

### GA4 property

- [ ] Register event-scoped custom dimensions: `page_type`, `listing_id`, `listing_kind`,
      `country`, `location`, `community`, `property_type`, `price_band`, `lead_type`,
      `form_location`, `contact_method`, `search_placement`, `navigation_method`,
      `gallery_surface`, `result_count`.
- [ ] Mark **`generate_lead`** as a key event.
- [ ] Leave `contact_click`, `floorplan_request_started`, `gallery_open` and `search` as
      supporting events, **not** key events.
- [ ] **Do not enable Google Signals, advertising personalisation, or Google Ads data
      sharing** until the marketing-consent path has been reviewed. Confirm who owns this.

---

## 7. Cookie inventory

| Cookie | Set by | Purpose | Lifetime | httpOnly |
|---|---|---|---|---|
| `ghi_consent` | This app | The visitor's consent decision: two booleans, a version and a timestamp. Nothing identifying. | 180 days | **No** — the consent UI must read it |
| `ghi_analytics_debug` | This app | Marks an internal GTM Preview session. | 2 hours | Yes |
| `launch_bypass` | This app | Pre-launch team access. | 30 days | Yes |
| `_ga`, `_ga_*` | Google Analytics | Client and session identity. **Only after analytics consent.** | Up to 2 years | No |
| `_gcl_au` | Google | Advertising click attribution. **Only after marketing consent.** | 90 days | No |

`_ga` is set on the registrable domain, so deletion targets the host *and* the dotted
parent scope — see `cookieDomainScopes()`.

The visitor-facing version of this table is `/cookies`.

---

## 8. Rollback

Three levels, fastest first:

1. **Pause the container in GTM.** No deploy, no repo change; takes effect immediately.
2. **Set `PUBLIC_ANALYTICS_ENABLED=false`** in Vercel and redeploy. No code change; the
   bootstrap becomes an HTML comment and no Google code loads.
3. **Revert the commit.** The `%ghi.analytics%` placeholder is inert without the hook, and
   the revert removes it anyway.

---

## 9. QA checklist

Unit tests cover the pure logic (`pnpm --filter web test`). These are the things only a
browser can confirm — run them in GTM Preview on a preview deployment via `?ghi_debug=`.

**Environment**
- [ ] `pnpm dev`: no GTM script, no `dataLayer`, no Google cookies
- [ ] Preview deployment without a token: silent
- [ ] Preview deployment with `?ghi_debug=<token>`: GTM Preview connects
- [ ] `/internal/design-system` stays silent even with a valid token
- [ ] A Sanity draft preview session stays silent

**Consent**
- [ ] Network waterfall: `gtag('consent','default')` executes **before** `gtm.js`
- [ ] First visit, no decision: **no `_ga` cookie exists**
- [ ] Hand-write a valid `ghi_consent` cookie, reload: `analytics_storage` is granted in
      Tag Assistant and `_ga` appears
- [ ] `withdrawConsent()` from the console: `_ga`, `_ga_*`, `_gcl_au` deleted, page reloads denied
- [ ] Corrupt or truncate the cookie: treated as no decision, nothing granted
- [ ] Bump `CONSENT_VERSION`: previous decisions are ignored

**Page views**
- [ ] Home → country → location → listing → unit: exactly **one** page view each
- [ ] Browser back and forward: one page view each, no duplicates
- [ ] `page_type` and `page_title` correct on each (title must not lag one page behind)
- [ ] Applying a filter produces one page view, not one per control

**Events**
- [ ] Scroll to a rail: `view_item_list` fires on visibility, not on page load
- [ ] Paginate: fires again with the new listings
- [ ] Scroll away and back: does **not** fire again
- [ ] Card click: `select_item` with the same `index` as the impression
- [ ] A POA listing carries **no `price` key at all**
- [ ] Gallery: open, arrows, thumbnails, swipe and keyboard all report the right method

**Leads — the ones that matter**
- [ ] Successful listing enquiry: exactly one `generate_lead`, **after** the HubSpot round-trip
- [ ] Navigate away and back to the success state: does **not** fire again
- [ ] Client-side validation failure: no event
- [ ] Break `HUBSPOT_ENQUIRY_FORM_GUID` to force a 502: **no event**
- [ ] Floorplan request reports `lead_type: floorplan_request`
- [ ] Newsletter and buyer-guide submissions report **nothing**

**Privacy**
- [ ] Visit a page with `?email=someone@example.com`: it does not appear in `page_location`
- [ ] Read every DebugView payload and confirm no prohibited field appears

**Presentation**
- [ ] Desktop, tablet and mobile
- [ ] Keyboard only
- [ ] Reduced motion

---

## 10. Still to do before launch

- **The consent UI.** Until it ships, no visitor can grant consent (§3).
- **Legal review.** `/privacy`, `/terms` and `/cookies` are placeholders written in brand
  voice, marked `noindex` and flagged on-page as drafts. They need solicitor-reviewed copy.
  The `draft` prop on `LegalPage.svelte` controls both the notice and the `noindex`.
- **Confirm the cookie policy wording** matches §7 once the banner's categories are final.
- Worth stating in the privacy policy that, before a decision is made, Google may receive a
  cookieless record that a page was viewed.
- `/preview/enable` and `/preview/disable` are referenced by the layout and the Sanity
  config but do not exist. Unrelated to analytics, but they are dead links — worth a ticket.
