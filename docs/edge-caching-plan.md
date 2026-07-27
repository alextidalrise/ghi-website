# Edge caching plan

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

## Implementation

### Where

A new `cacheHandle` in `web/src/hooks.server.ts`, appended **after** `analyticsHandle`:

```ts
export const handle = sequence(createRequestHandler(), analyticsHandle, cacheHandle);
```

Order is load-bearing. `analyticsHandle` sets `private, no-store` for debug and preview
sessions; `cacheHandle` must run after it and **bail out if a `no-store` is already
present**, never overwrite it.

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

**Verify this header's exact semantics against current Vercel docs before relying on it** —
Vercel supports `Cache-Control`, `CDN-Cache-Control` and `Vercel-CDN-Cache-Control` with
different scopes, and the precedence rules are the sort of thing that changes. If in doubt,
the simpler single `Cache-Control: public, s-maxage=..., stale-while-revalidate=...` also
works and is easier to reason about; the only cost is browsers may also cache.

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

404s should not inherit the content TTL. Either leave them uncached or give them a short,
separate one. Decide explicitly rather than letting them fall through.

## Verification protocol

Run in this order. Do not skip the compliance check.

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

### Expected result

If TTFB drops from ~1.0–1.6 s to <100 ms, LCP should fall by roughly that delta — from
~3.3 s toward ~2 s. That is worth several points on its own, and it is also what finally
makes #103's eager LCP tile pay off, since load delay will then be governed by discovery
rather than by document arrival.

Do not promise a specific score. Two prior confident predictions (CSS inlining, then GTM
deferral) were both wrong, and a third (the eager image) moved nothing.

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
