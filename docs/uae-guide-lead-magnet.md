# UAE buying guide: lead magnet

The landing page at **`/uae-buying-guide`** offers the PDF *How to Buy Property in the UAE as
an International Buyer* in exchange for an email address. The page adds the visitor to the
Mailchimp audience, and Mailchimp emails them the download link.

## How it works

1. The visitor submits their email in either form on the page (under the headline, or at
   the end). Both post to the page's `?/request` action.
2. The action adds them to the Mailchimp audience as `subscribed`: single opt-in, the same
   helper and consent evidence as `/newsletter`. The tags are:
   - `Source: UAE guide page`
   - `Market: uae`
   - `Guide: UAE buying guide`, **the delivery trigger**
   - `Campaign: <utm_campaign>`, when the link carried one
3. A Mailchimp **Customer Journey** that starts on the tag `Guide: UAE buying guide` sends
   the delivery email (`email/src/templates/uae-guide-delivery.html`) with the PDF link.
4. The page tells the visitor to check their inbox, and GA4 records `sign_up` with
   `method: uae_guide`. The GTM mapping for `sign_up` already exists, so no GTM change is
   needed.

The site never sends email or serves the PDF from the action. If the journey is off, the
page still says "Check your inbox" and nothing arrives. **Switch the journey on before the
page is linked anywhere.**

A returning member gets the guide tag removed and re-added, so a second request starts the
journey again. For that to send a second email, the journey must allow re-entry (step 3
below).

## Before launch

1. **Legal sign-off, for the guide and for the page.** Done for the guide: the final,
   approved PDF arrived on 2026-10-06 (7 pages, issued October 2026, no draft marks). The
   page repeats some of the guide's claims, so its copy needs the same review: a passport is
   enough to buy, about AED 188,000 of costs on a AED 3m villa, the transfer fee usually paid
   in full by the buyer, property frozen without a UAE will, AED 2m for Golden Residency (in
   your own name), and not having to fly out to complete (someone attends under a power of
   attorney, usually not your lawyer, and a document signed abroad needs more steps first).
   They live in `PREVIEWS` and the hero copy in `web/src/routes/uae-buying-guide/+page.svelte`.
   If the PDF changes page count, update `GUIDE_PAGES` there.
   **The legal partner is no longer named.** The final guide says "an established UAE-based
   law firm" instead of naming Stevenson Bernard Law Associates. The page and the delivery
   email follow it, so don't name the firm in copy without checking with legal first.
2. **Publish the final PDF.** Done: it's at `web/static/downloads/ghi-uae-buying-guide.pdf`,
   which is served as `https://www.golfhomesinternational.com/downloads/ghi-uae-buying-guide.pdf`.
   `vercel.json` sends `X-Robots-Tag: noindex` for `/downloads/*`, so search engines never
   give the PDF away without the sign-up. To publish a revised guide, replace that file;
   the URL stays the same, so the email never needs to change. Never publish a draft.
3. **Build the journey in Mailchimp** (Automations → Customer Journeys → Build from
   scratch):
   - First create the tag `Guide: UAE buying guide` under Audience → Tags, spelled
     exactly like that, so the starting point can select it. (The site also creates it on
     first use.)
   - Starting point: **Tag added**, `Guide: UAE buying guide`. In the starting point's
     settings, allow contacts to **re-enter** the journey.
   - Action: **Send email**. Paste `email/build_production/uae-guide-delivery.html` as a
     template (see `email/docs/03-mailchimp.md`), with the subject *Your UAE buying guide*
     and the reviewed `.txt` as the plain-text version. Leave Mailchimp's Google Analytics
     option off, since the links carry their own UTMs.
   - Turn the journey on.
4. **Check the links:** `pnpm --filter email validate:links`. It fails until the PDF from
   step 2 is live, and that failure is the gate.
5. **Test end to end** with a real address on the deployed site: the member appears with
   the three tags, the email arrives within minutes, the PDF opens, and GA4 DebugView shows
   one `sign_up` with `method: uae_guide`. Then request again with the same address, and a
   second email should arrive.
6. **Link to it with UTMs**, e.g. `/uae-buying-guide?utm_source=instagram&utm_medium=social&utm_campaign=uae-guide`.
   The campaign becomes a Mailchimp tag as well.

## Known gaps

- **An unsubscribed address gets nothing.** Mailchimp won't email someone who
  unsubscribed, and the page still shows "Check your inbox" (it never reveals list status).
  They can re-subscribe through Mailchimp's own form or ask us directly.
- **Consent.** The request also subscribes the visitor to the newsletter, and the consent
  line under both buttons says so. Keep that line if the copy changes.
- **Not indexed.** The page is `noindex` and out of the sitemap, like `/newsletter`: it is
  a campaign destination. Revisit this with the sitemap trim (see the indexing notes) if it
  should rank for UAE buying searches.
- The Spain and Portugal guide requests from the old homepage cards go to HubSpot
  (`/api/guide`). This one goes to Mailchimp, so the two now use different systems.
