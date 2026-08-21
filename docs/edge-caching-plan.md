# Edge caching plan

> **STATUS: implemented and shipped 2026-07-27 — PR #108, merge `a2a199c8`.**
>
> Read this document with three corrections in mind, each marked inline below:
>
> 1. **The handler ordering in "Implementation → Where" was wrong** and would have published
>    debug sessions and draft previews into a shared cache. Corrected in place.
> 2. **The central premise is over-read.** Server TTFB does gate real-user paint, but PSI
>    mobile's *simulated* throttling makes its lab score structurally insensitive to TTFB in
>    this range. Measured result: no PSI change at n=6 per page. See
>    "Expected result — and what actually happened".
> 3. **The TTFB numbers below are cold starts, not steady state.** Warm production TTFB was
>    42–103 ms before caching was enabled. Repeated `curl` warms the function; the original
>    measurements did not control for that.
>
> The change is worth keeping — a cache hit is 48–73 ms against 1.0–1.7 s on a miss, and
> real users get that even though Lighthouse's simulation cannot show it. But do not use
> this document as evidence that PSI score work should target TTFB.

Written 2026-07-27, to be picked up in a fresh session. Everything here is the result of
measurement rather than reasoning from first principles — the numbers are real and were
taken against production.

## Why this is the next change

Server TTFB is what caps this site's PageSpeed scores. Nothing on the front end is left
to win.

Production TTFB, against a 6–21 ms connect (5–6 samples per page):

| page | TTFB |
|---|---|
| /portugal | 1.46 – 2.99 s |
| /spain | 1.21 – 1.59 s |
| / (home) | 1.50 – 1.84 s |
| /about | 0.43 – 0.99 s |

Nothing paints until the document lands, so this gates FCP, LCP and Speed Index together.
Meanwhile TBT is 20 ms and CLS is 0 on every page measured — both already maxed. The CSS
(10 stylesheets) finishes in under 200 ms and is not the problem. Images download in
single-digit milliseconds.

**A cache hit takes TTFB to roughly 30–80 ms.** That is not an incremental gain, it is a
different regime, and it is the only lever left that attacks the actual constraint.

### The trap to avoid re-falling into

Lighthouse's "Resource load delay" is measured from navigation start, so it *absorbs the
document's own arrival time*. A 1,500 ms load delay on an image looks like a
discovery/priority problem and is not one while TTFB is 1.3 s. PR #103 set
`loading="eager"` + `fetchpriority="high"` on a genuinely-in-viewport LCP image and moved
the score not at all (median 88 → 86.5, n=6, inside an 82–90 noise band). That change was
correct and stays — but it only starts paying once TTFB drops, which is this work.

Lighthouse's `server-response-time` audit is also unreliable here: it reported 10 ms for a
page whose document demonstrably took 1.3 s in both the PSI network trace and real `curl`.
Trust the network trace and `curl`, not that audit.

## What is already done

| PR | What | Status |
|---|---|---|
| #103 | Eager first location tile; country loader collapsed from 3 sequential round trips to 1 | merged |
| #104 | Serverless functions moved `iad1` → `fra1` | merged |
| #106 | **Consent refactor — made the document visitor-invariant** | merged, verified in GTM |

#104 is worth understanding: the Sanity dataset is in GCP europe-west1
(`x-sanity-shard: gcp-eu-w1-01-prod-1015`), so a US function crossed the Atlantic for
every query *and* for the response. Measured effect: /spain 1.406 s → 1.025 s (−27%, with
non-overlapping ranges); /portugal only −51 ms (inconclusive, ranges overlap).

#106 is the precondition for this work. Before it, the HTML varied per visitor — the
consent decision was embedded server-side in the bootstrap script and in the SSR data
payload — so caching it publicly would have served one person's consent state to another.
That is a compliance problem, not a staleness one.

## Preconditions — all verified, do not re-litigate

- **HTML is byte-identical across visitors.** Local preview, same URL, three visitors (no
  cookie / accept-all / reject-all): 167,760 bytes each, `diff` identical, on both the
  analytics-off and analytics-on paths.
- **Consent still applies correctly.** The bootstrap reads `ghi_consent` from
  `document.cookie` synchronously, inline in `<head>`, still ahead of the GTM container —
  so a returning visitor's decision is on the dataLayer before any tag fires. Verified in
  GTM Preview across accept-all, analytics-only, reject and withdraw.
- **No `Set-Cookie` on normal traffic** (`/`, `/spain`, `/about` all checked). This
  matters: Vercel will not cache a response carrying `Set-Cookie`, so any route that sets
  one is excluded automatically.
- **Debug and preview sessions are already excluded.** `analyticsHandle` sets
  `cache-control: private, no-store` when `config.mode === 'debug'` or
  `locals.preview === true`.

## The one open decision

**How fresh must published content be?**

The site is Sanity-driven. An editor publishes and wants to see it live. The trade is
purely between that delay and cache hit rate.

Recommendation: **short `s-maxage`, long `stale-while-revalidate`.**

```
s-maxage=60, stale-while-revalidate=604800
```

The reasoning is specific to this site's traffic level. On a low-traffic site a long
`s-maxage` is not what produces hits — `stale-while-revalidate` is. With a long SWR
window, a visitor arriving after the 60 s TTL still gets an instant stale response while
the edge revalidates in the background, so the *next* visitor gets fresh content. Only the
very first request ever (or one after the whole SWR window lapses) pays full TTFB.

For an editor that means: publish, reload once (may be stale), reload again (fresh).
Acceptable, and easy to explain. If it turns out not to be, the follow-up is a Sanity
webhook that purges on publish — deliberately *not* in scope here, because it adds an
endpoint and a shared secret for a problem we may not have.

Confirm this with Alex before implementing. It is the only judgement call in the plan.

**Decided as recommended, and confirmed on production.** The TTL/SWR split behaves exactly
as the reasoning predicted: at `age=35` a request was a `HIT`; at `age=65`, past the 60 s
TTL, it came back `STALE` **in 94 ms rather than 1.09 s**; the following request was a `HIT`
with `age=1`, i.e. the background revalidation had already landed. So the editor experience
is as described — publish, reload once (may be stale), reload again (fresh) — and the
stale serve costs nothing.

## Implementation

### Where

A new `cacheHandle` in `web/src/hooks.server.ts`, listed **first**:

```ts
export const handle = sequence(cacheHandle, createRequestHandler(), analyticsHandle);
```

> **This was wrong in the first draft of this plan, and the error was live long enough to
> be measured.** The draft said to append `cacheHandle` *after* `analyticsHandle`. That is
> backwards. `sequence()` **nests** its handlers: one listed later runs *nearer the
> render*, so its pre-resolve code runs last but its **post-resolve code runs first**.
>
> `cacheHandle` decides by inspecting the *finished* response's `cache-control`, and
> `analyticsHandle` is what stamps `private, no-store` on debug sessions and Sanity draft
> previews. Listed last, `cacheHandle` resolved innermost and read that header *before it
> had been set* — and duly attached edge-cache headers to a debug document:
>
> ```
> cache-control: private, no-store
> vercel-cdn-cache-control: public, s-maxage=60, stale-while-revalidate=604800
> ```
>
> Since `Vercel-CDN-Cache-Control` outranks `Cache-Control` at Vercel's edge, the
> `no-store` sitting beside it would **not** have saved us: a GTM Preview session, or
> unpublished draft content, could have been served from a shared cache. Exactly the
> compliance failure #106 existed to prevent.
>
> Listed first, `cacheHandle`'s response handling runs last and sees whatever any handler
> marked, whoever marked it. Note also the near-miss in verification: the one debug case
> that *did* behave correctly did so only because it carried a `Set-Cookie`. Testing only
> the token-grant request and not the subsequent cookie-only request would have missed
> this entirely. Test the second request.

Order is load-bearing. `analyticsHandle` sets `private, no-store` for debug and preview
sessions; `cacheHandle` must see that header and **bail out if a `no-store` is already
present**, never overwrite it. `createRequestHandler()` must still precede
`analyticsHandle`, because it populates `locals.preview` before resolving and the gate
reads it.

A single choke point in hooks is preferable to `setHeaders` scattered across load
functions: the rule is a security/compliance boundary and should be readable in one place.

### What to set

Split browser and edge caching explicitly:

```
Cache-Control:             public, max-age=0, must-revalidate
Vercel-CDN-Cache-Control:  public, s-maxage=60, stale-while-revalidate=604800
```

The browser always revalidates (never serves stale HTML from disk, so a visitor cannot get
a stale page from their own cache after we purge). The edge does the caching.
`Vercel-CDN-Cache-Control` is consumed by Vercel and not forwarded to the client.

**Verified against Vercel's docs 2026-07-27, and confirmed on production.**
`Vercel-CDN-Cache-Control` has top priority over `CDN-Cache-Control` and `Cache-Control`,
supports `s-maxage` and `stale-while-revalidate`, and is consumed by Vercel rather than
forwarded — production responses carry no `vercel-cdn-cache-control` header at all, while
`cache-control: public, max-age=0, must-revalidate` reaches the client unchanged.

Two things the docs turned up that the draft did not anticipate:

- **Vercel's CDN caches `404`s** (cacheable statuses are 200, 404, 410, 301, 302, 307,
  308). So the status guard is load-bearing, not defensive — see the error-response section
  below.
- **`stale-if-error` is not supported** for server-side caching, despite appearing in the
  `Cache-Control` reference. Don't reach for it.
- The CDN cache is **segmented by region**, so a hit in one PoP is not a hit everywhere.
  This matters when interpreting PSI runs, which arrive from Google infrastructure and may
  land on a cold PoP.

### Guard conditions — cache only when all hold

- Method is `GET` (or `HEAD`)
- Status is `200`
- Response carries no `Set-Cookie`
- No `no-store` already set by `analyticsHandle`
- `route.id` is in the allowlist below
- `env.LAUNCH_MODE !== 'true'` — while the takeover is on, `+layout.server.ts` redirects
  based on the `launch_bypass` cookie, which makes output cookie-dependent. It is off now,
  but the guard should exist so turning it back on cannot silently poison the cache.

Do **not** set `Vary: Cookie`. It would be technically correct and would destroy the hit
rate entirely; the point of #106 was to make the output cookie-independent so this is not
needed.

### Route allowlist

Cacheable — public, CMS-driven, identical for everyone:

```
/                                                    /about
/[country]                                           /contact
/[country]/[location]                                /partners
/[country]/[location]/[community]                    /front-line-collection
/[country]/[location]/[community]/[slug]             /guides
/[country]/[location]/[community]/[slug]/[unit]      /guides/[slug]
/[country]/[location]/[community]/golf/[slug]        /insights
                                                     /insights/[slug]
                                                     /privacy /terms /cookies
```

Never cache: `/internal/*` (tooling), `/soon` (holding page, cookie-dependent), `/api/*`.

Consider separately, not in the first PR: `/sitemap.xml` and `/robots.txt` — both good
candidates but with different TTLs, and worth their own thought.

Prefer an explicit allowlist to a denylist. A new route should default to uncached and be
opted in deliberately.

### Error responses

404s should not inherit the content TTL. **Decided: cache only status `200`.**

This is load-bearing rather than belt-and-braces. Vercel's CDN caches 404s, and
allowlisted routes throw them — `/[country]` calls `error(404)` for an unknown location
while `event.route.id` is still the matched, allowlisted id. Without the guard a not-found
page gets pinned over a URL that becomes real the moment an editor publishes. Verified on
production: `/no-such-country` and `/spain/no-such-location` stay `MISS` on repeat requests.

Redirects are excluded by the same guard, which incidentally leaves the canonical-path
`301`s on listing URLs uncached. Acceptable: the redirect target is cached, so only the
first hop pays.

## Verification protocol

Run in this order. Do not skip the compliance check.

**Outcome, 2026-07-27.** Steps 1, 3 and 4 passed. Step 2 passed in substance with one part
delegated (below). Step 5 was run and found no change — see "Expected result".

Two limits worth recording for next time:

- **A Vercel preview deployment cannot exercise step 2.** Analytics is host-gated, so
  preview HTML contains `<!-- analytics off: non-production host -->`, zero GTM references
  and no consent bootstrap. A byte-identical check there is the *weak* form of the test —
  the bootstrap isn't even in the document. Step 2 needs a production host. Preview
  deployments are also SSO-gated, so automated access needs a share link or
  `VERCEL_AUTOMATION_BYPASS_SECRET`.
- **`google_tag_data.ics` needs a real browser.** Without browser tooling, the substance was
  verified by extracting the consent bootstrap from the *actual cached production bytes* and
  executing it against properly-shaped cookies: accept-all → `granted`/`granted`,
  reject-all → `denied`/`denied`, analytics-only correctly splitting analytics from ads, and
  a malformed cookie failing safe to all-denied. Note the cookie shape — the bootstrap
  requires `version: 1`, boolean `analytics`/`marketing`, **and** a parseable `timestamp`;
  a cookie missing any of those is ignored, so a naive `{"analytics":true}` test cookie
  silently proves nothing.

1. **Cache is actually working** — `x-vercel-cache` should go `MISS` → `HIT` on a repeat
   request. On a `HIT`, TTFB should be ~30–80 ms.
2. **Compliance — the one that matters.** On a *cached* document (confirm `HIT` first),
   with an accept-all `ghi_consent` cookie, check in the browser console:
   ```js
   [...dataLayer].filter(a => a[0] === 'consent').map(a => [a[1], a[2]])
   google_tag_data.ics.entries
   ```
   The update must reflect *this* visitor's cookie, not whoever populated the cache. Then
   repeat with a reject-all cookie in a different browser profile and confirm the two
   disagree while being served the same cached bytes. This is the whole reason #106 existed.
3. **Debug sessions bypass the cache** — a `?ghi_debug=<token>` session must still show
   `private, no-store` and must not be served from cache.
4. **Sanity publish propagates** within the expected window.
5. **PSI, n=6 per page, spaced ~45–60 s.** PSI caches per URL; immediate repeat calls
   return byte-identical cached results, not independent samples.

   **Baseline with the same n you intend to compare against.** The country-page work was
   baselined on a single reading per page (91 and 88) and then compared to n=6 medians,
   which made a no-op change look like a regression. Single readings land anywhere in an
   ~8-point band.

   Post-#103/#104 medians to compare against: **/portugal 88.5, /spain 86.5** (n=6, ranges
   82–90 and 83–89). Re-baseline after #106 deploys, before turning caching on.

   **Point PSI at `www.`, never the apex.** `golfhomesinternational.com` returns a 308 to
   `www.`, and paying that redirect costs ~9 points: apex scored 81/80 (FCP 2.9–3.0 s, LCP
   4.007 s) against `www.` 89/89/90 (FCP 2.10–2.25 s, LCP 3.227 s). The canonical link and
   every sitemap `<loc>` use `www.`. Measuring the apex mid-session produced a convincing
   fake regression and cost real time.

### Expected result — and what actually happened

The prediction below was **wrong**, and it was wrong in the way the paragraph after it
warned about. Kept verbatim, because the reasoning error is the useful part:

> If TTFB drops from ~1.0–1.6 s to <100 ms, LCP should fall by roughly that delta — from
> ~3.3 s toward ~2 s. That is worth several points on its own, and it is also what finally
> makes #103's eager LCP tile pay off, since load delay will then be governed by discovery
> rather than by document arrival.
>
> Do not promise a specific score. Two prior confident predictions (CSS inlining, then GTM
> deferral) were both wrong, and a third (the eager image) moved nothing.

**Measured 2026-07-27, n=6 per page on `www`, pre and post the same deploy day:**

| page | pre median | post median | Δ | FCP median |
|---|---|---|---|---|
| `/` | 90.0 [82–91] | 91.0 [73–94] | +1 | 2101 → 2101 ms |
| `/portugal` | 90.0 [84–90] | 88.0 [73–91] | −2 | 2101 → 2101 ms |
| `/spain` | 87.0 [79–88] | 87.5 [86–88] | +0.5 | 2101 → 2101 ms |

Every metric's range overlaps. **FCP median did not move by one millisecond on any page.**
LCP median unchanged on `/` and `/spain`; `/portugal` +337 ms. Speed Index and TBT medians
improved (SI −1.27 s on `/`, −1.25 s on `/spain`) but are outlier-driven and overlapping.

The cache itself unambiguously works: `x-vercel-cache` MISS→HIT, hit TTFB 48–73 ms against
1.0–1.7 s on a miss, and SWR confirmed — past the 60 s TTL a stale response returned in
94 ms rather than 1.09 s, with the next request already fresh.

**Why the score didn't move.** Lighthouse mobile uses *simulated* throttling: it replays the
observed server response through a slow-4G model. FCP for a 31 KB h2 document is dominated
by simulated RTT, bandwidth and render; server think time in the tens-to-hundreds of ms is a
small term in that sum. **PSI mobile's lab score is structurally insensitive to server TTFB
in this range** — it is the wrong instrument for TTFB work, and this document's entire
premise over-read it.

Worse, the premise itself was shaky: warm production TTFB measured **42–103 ms** *before*
caching was enabled. The 1.2–3.0 s figures that motivated this plan were almost certainly
cold starts, not steady state. A `curl` that follows repeated requests warms the function
and hides this; the original measurements did not control for it.

**Keep the change regardless.** Real users on real networks get the cold-start elimination
that the simulation cannot show, and it cuts function invocations. The correct instrument is
field data (CrUX), which on 2026-07-27 had **no data at all** for this origin — the site
launched 2026-07-23. Re-check `loadingExperience` in the PSI response around late August
2026.

**The lesson worth carrying.** Across four attempts now — CSS inlining, GTM deferral, the
eager LCP image, and edge caching — PSI mobile's score has moved for none of them. Three
identical-FCP runs scoring 90, 84 and 82 show why: the score's variance is Speed Index and
TBT, which are CPU- and render-bound and largely a function of Google runner load. FCP and
LCP are near-deterministic under simulation. Stop using PSI mobile score as the target
metric; measure the thing you actually changed, and use field data for user-visible effect.

## Rollback

Deleting `cacheHandle` from the `sequence()` call reverts everything. Note that content
already in the edge cache will persist for its TTL — if a bad document is cached, a
redeploy invalidates Vercel's cache, which is the fast way out.

## Related, not in scope

`@sanity/visual-editing` is a **static top-level import** in `+layout.svelte`. It is
correctly runtime-gated (called in `onMount` behind `$isPreviewing`, so it never executes
in production), but a static import still lands in the server module graph, producing
`VisualEditing.js` at 1,741 kB and `renderVisualEditing.js` at 1,286 kB in the server
build. Every cold start pays to load and parse those.

Converting it to a dynamic `await import()` inside the existing `$isPreviewing` branch
would take ~3 MB off the cold path. This is the leading explanation for the portion of
TTFB that the region move did not account for — note /portugal barely improved from the
region change, which fits a cold-start-dominated profile. Caching reduces how *often* a
cold start is paid; this reduces what each one costs. They are complementary.

## Standing constraints

- **GTM must load eagerly.** Deferring it distorts true bounce rate — GA4 only registers a
  visit once the container loads, so holding it back silently drops the visitors who leave
  early, which is precisely the traffic bounce rate measures. This was measured (PR #99,
  reverted in #100) and bought only ~1 point of median score. Do not re-open it as a
  suggestion; bring a measurement, not an idea.
- Analytics is gated to production hosts, so Vercel previews and localhost emit
  `<!-- analytics off -->`. **Local Lighthouse is not predictive** for anything involving
  document size or bandwidth. Measure on production.

## Purge-on-publish (shipped)

The follow-up deferred above was built once a UAE listing published in the CMS but did not
appear on its grid for want of a revalidation. `s-maxage` was raised **60 s → 3600 s** at
the same time: with purge handling freshness, the TTL is now only a safety net, and the
longer window wins more edge hits.

Mechanism — **tag-based invalidation** (Vercel supports it for all responses, not just
Next.js ISR; 128 tags/response, 256 chars/tag, 16 tags per bulk API call):

- **Read side (automatic).** Each cacheable page emits a `Vercel-Cache-Tag` header listing
  the documents it renders. `lib/cache/tagContext.ts` binds an `AsyncLocalStorage` store per
  request in `cacheHandle`; `lib/sanity/queries/fetch.ts` deep-scans every result for `_id`
  and records `doc:<id>`. A handful of loads add structural tags (`grid:loc:*`,
  `grid:country:*`, `rail:frontline*`, `hub:*`, `col:partners`, `nav`, `home`, `country:*`)
  for the "new document" case a `doc:` tag can't cover. Tag names live in `lib/cache/tags.ts`.
- **Write side.** `routes/api/cache-purge/+server.ts` verifies the Sanity webhook HMAC
  (`@sanity/webhook`), maps the changed doc → tags via the pure `lib/cache/purgeTags.ts`, and
  invalidates them with `@vercel/functions` `invalidateByTag` (runs in-context, no Vercel
  token needed). Off Vercel it computes tags without purging.

### Sanity webhook config (manual — set in the Sanity console)

- **URL**: `https://www.golfhomesinternational.com/api/cache-purge`
- **Dataset**: `development` (the one production serves)
- **Trigger**: Create / Update / Delete
- **Filter**: `_type in ["propertyListing","development","unit","unitType","locationTaxonomy","insight","guide","author","partner","partnerCategory","golfCourse","siteSettings","aboutPage","contactPage","guidesHubPage"]`
- **Projection** (computes the structural fields so the endpoint needs no Sanity round-trip,
  and so delete events still carry them):

  ```groq
  {
    _id,
    _type,
    "countrySlug": coalesce(
      location.country->slug.current,
      location.community->parent->parent->slug.current,
      parentDevelopment->location.country->slug.current,
      parentDevelopment->location.community->parent->parent->slug.current,
      country,
      select(_type == "locationTaxonomy" && type == "country" => slug.current),
      select(_type == "locationTaxonomy" && type == "location" => parent->slug.current)
    ),
    "locationId": coalesce(
      location.location._ref,
      location.community->parent->_id,
      parentDevelopment->location.location._ref,
      select(_type == "locationTaxonomy" && type == "location" => _id)
    ),
    "parentDevelopmentId": parentDevelopment._ref,
    "isFrontline": coalesce(golf.golfRelevance, parentDevelopment->golf.golfRelevance) == "frontline_golf",
    "golfCourseIds": golf.linkedGolfCourses[]._ref,
    "taxonomyType": select(_type == "locationTaxonomy" => type),
    "parentLocationId": select(_type == "locationTaxonomy" && type == "community" => parent._ref),
    "partnerCountrySlugs": countries
  }
  ```

- **Secret**: set the same value as `SANITY_WEBHOOK_SECRET` in Vercel env
  (`vercel env add SANITY_WEBHOOK_SECRET production` / `preview`). The endpoint returns 503
  and refuses to purge if it is unset.

Verify on production: publish an edit → `curl -sI https://www.golfhomesinternational.com/<path>`
shows `x-vercel-cache: STALE` then `HIT` with fresh content, unrelated pages untouched.
