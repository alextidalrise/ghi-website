/**
 * Edge-cache policy for public content routes.
 *
 * Server TTFB is what caps this site's PageSpeed scores: production measured 1.0–1.6 s
 * against a 6–21 ms connect, and nothing paints until the document lands, so FCP, LCP and
 * Speed Index are gated together. A CDN hit takes TTFB to ~30–80 ms, which is a different
 * regime rather than an incremental gain. Every front-end lever (image priority, CSS
 * inlining, script deferral) has been measured and is either exhausted or inert.
 *
 * This is only safe because the document is visitor-invariant: the consent decision is
 * read from `document.cookie` by the inline bootstrap rather than baked into the HTML
 * server-side. Verified byte-identical across no-cookie / accept-all / reject-all
 * visitors. If that ever stops being true, caching publicly would serve one visitor's
 * consent state to another — a compliance problem, not a staleness one.
 *
 * The decision lives in this pure function rather than in `setHeaders` calls scattered
 * across load functions because it is a compliance boundary and should be readable, and
 * testable, in one place.
 */

/**
 * Public, CMS-driven routes whose rendered HTML is the same for every visitor.
 *
 * An allowlist rather than a denylist, deliberately: a newly added route defaults to
 * uncached and has to be opted in by someone who has thought about whether its output
 * varies per visitor.
 *
 * Deliberately absent:
 * - `/soon` — the launch holding page, whose output depends on the `launch_bypass` cookie.
 * - `/internal/*` — team tooling, not public.
 * - `/api/*` — not documents; `/api/newsletter` and `/api/guide` are POST form targets.
 * - `/d/[ghiId]`, `/p/[ghiId]`, `/u/[ghiId]` — short-link redirects. Vercel will cache a
 *   301/302/307, but these are cheap already and a wrongly-cached redirect is annoying to
 *   flush, so they stay out until someone wants them in.
 * - `/robots.txt` — a good candidate, but it wants its own thought. Separate change.
 *
 * `/sitemap.xml` is cached here (opted in): it is a public, visitor-invariant GET, and it
 * carries the `sitemap` structural tag so a Sanity publish purges it precisely rather than
 * leaving it stale until the TTL lapses (see routes/sitemap.xml/+server.ts and purgeTags.ts).
 */
export const CACHEABLE_ROUTE_IDS: ReadonlySet<string> = new Set([
	'/sitemap.xml',
	'/',
	'/[country]',
	'/[country]/[location]',
	'/[country]/[location]/[community]',
	'/[country]/[location]/[community]/[slug]',
	'/[country]/[location]/[community]/[slug]/[unit]',
	'/[country]/[location]/[community]/golf/[slug]',
	'/about',
	'/contact',
	'/partners',
	'/front-line-collection',
	'/guides',
	'/guides/[slug]',
	'/insights',
	'/insights/[slug]',
	'/privacy',
	'/terms',
	'/cookies'
]);

/**
 * What the browser is told. `max-age=0, must-revalidate` means a visitor never serves a
 * stale document from their own disk cache, so a purge at the edge is immediately
 * effective for everyone — we give up return-visitor browser caching to keep that
 * property. This is also Vercel's own default value, so the client-facing contract is
 * unchanged by this work.
 */
export const BROWSER_CACHE_CONTROL = 'public, max-age=0, must-revalidate';

/**
 * What Vercel's CDN is told. `Vercel-CDN-Cache-Control` has top priority over
 * `CDN-Cache-Control` and `Cache-Control`, and Vercel consumes it rather than forwarding
 * it, so the browser-facing header above survives untouched.
 *
 * Freshness now comes from **purge-on-publish**: a Sanity webhook invalidates the
 * `Vercel-Cache-Tag`s a page carries the moment its content changes (see `tagContext.ts`,
 * `purgeTags.ts`, and `routes/api/cache-purge`). So `s-maxage` no longer has to be short
 * to keep content current — a longer TTL just wins more edge hits and lower TTFB. It was
 * raised from 60 s to 3600 s (1 hour) once purge existed; the hour is now only a safety
 * net for a webhook that never fired, and `stale-while-revalidate` (7 days) still serves an
 * instant stale response while the edge revalidates behind the reader.
 */
export const EDGE_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=604800';

/**
 * Vercel caps a response at 128 cache tags (256 chars each). Structural tags (grids,
 * rails, hubs, nav) are few and load-bearing for the "new document" case, so they are
 * kept first; `doc:` tags fill the remaining budget. If a page ever renders more than the
 * budget of documents, the dropped `doc:` tags still self-heal within `s-maxage`, and any
 * grid/hub page keeps its structural backstop tag regardless.
 */
export const MAX_CACHE_TAGS = 128;

/** Build the comma-joined `Vercel-Cache-Tag` header value, honouring the 128-tag cap. */
export function buildCacheTagHeader(tags: Iterable<string>): string {
	const all = [...tags];
	if (all.length <= MAX_CACHE_TAGS) return all.join(',');

	const structural = all.filter((t) => !t.startsWith('doc:'));
	const docs = all.filter((t) => t.startsWith('doc:'));
	const kept = [...structural, ...docs].slice(0, MAX_CACHE_TAGS);
	return kept.join(',');
}

export interface CachePolicyInput {
	/** HTTP method of the request. */
	method: string;
	/** Status of the rendered response. */
	status: number;
	/** SvelteKit `event.route.id`; null for an unmatched URL. */
	routeId: string | null;
	/** Whether the response already carries a `set-cookie`. */
	hasSetCookie: boolean;
	/** Any `cache-control` an earlier handle already set, or null. */
	existingCacheControl: string | null;
	/** Whether the launch takeover is active (`LAUNCH_MODE === 'true'`). */
	launchMode: boolean;
}

/** Directives that mean an earlier handle has deliberately marked this uncacheable. */
const OPT_OUT = ['no-store', 'no-cache', 'private'];

/**
 * Whether this response may be cached at the edge. Every condition must hold; the
 * default is not to cache.
 */
export function isCacheable(input: CachePolicyInput): boolean {
	const { method, status, routeId, hasSetCookie, existingCacheControl, launchMode } = input;

	/* While the takeover is on, `+layout.server.ts` redirects based on the `launch_bypass`
	   cookie, which makes output cookie-dependent. It is off in production now, but the
	   guard exists so that turning it back on cannot silently poison a shared cache. */
	if (launchMode) return false;

	// Vercel only caches GET and HEAD. A POST to a form action must never be cached.
	if (method !== 'GET' && method !== 'HEAD') return false;

	/* 200 only. This is load-bearing rather than belt-and-braces: Vercel's CDN will happily
	   cache a 404, and allowlisted routes do throw them — `/[country]` calls `error(404)`
	   for an unknown location while `event.route.id` is still the matched, allowlisted id.
	   Letting those inherit the content TTL would pin a not-found page over a URL that is
	   about to become real the moment an editor publishes. */
	if (status !== 200) return false;

	/* Vercel refuses to cache a response carrying `set-cookie` anyway, so this is
	   defence in depth — but it also documents the invariant, and it keeps the local
	   decision honest rather than relying on the CDN to save us. A `set-cookie` here means
	   the response is about one specific visitor (a debug or bypass grant). */
	if (hasSetCookie) return false;

	/* `analyticsHandle` marks debug sessions and Sanity draft previews `private, no-store`.
	   Never overwrite that — this handle only ever adds caching to responses nobody has
	   opted out. */
	if (existingCacheControl && OPT_OUT.some((d) => existingCacheControl.includes(d))) return false;

	if (!routeId || !CACHEABLE_ROUTE_IDS.has(routeId)) return false;

	return true;
}
