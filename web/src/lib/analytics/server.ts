import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Cookies, Handle, RequestEvent } from '@sveltejs/kit';
import { resolveAnalyticsConfig, type AnalyticsConfig } from './config';
import { buildBootstrapScript, buildDisabledComment } from './snippet';

/**
 * Server-side analytics wiring.
 *
 * The gate is resolved here, not in the browser, because the bootstrap script has to be
 * written into the HTML before hydration.
 *
 * The visitor's stored consent is deliberately NOT read here. It used to be, which let
 * the first script carry their decision directly — but it also made every response
 * per-visitor and so uncacheable, and server TTFB is what caps this site's PageSpeed
 * scores. The bootstrap now reads the cookie itself, synchronously and still ahead of
 * the GTM container, so the ordering guarantee survives while the document becomes
 * identical for everyone. See `buildStoredConsentReader` in `snippet.ts`.
 */

/** Replaced in `app.html`. Must stay in <head>, which SvelteKit emits in the first chunk. */
const PLACEHOLDER = '%ghi.analytics%';

const DEBUG_COOKIE = 'ghi_analytics_debug';
const DEBUG_PARAM = 'ghi_debug';

/** Deliberately short: a debug session should expire on its own, not linger. */
const DEBUG_MAX_AGE = 60 * 60 * 2;

/**
 * Decide whether this request may run analytics in debug mode.
 *
 * Mirrors the existing `launch_bypass` idiom in `+layout.server.ts`: a shared secret in
 * a private env var is exchanged once for a cookie. Storing the token itself as the
 * cookie value means rotating `ANALYTICS_DEBUG_TOKEN` revokes every outstanding debug
 * session at once. With no token configured the override cannot be enabled at all.
 */
export function resolveDebugGrant(url: URL, cookies: Cookies, rawToken: string | undefined): boolean {
	// Env UIs and shells routinely leave quotes or newlines on a value, which would
	// silently break an otherwise-correct token.
	const token = rawToken?.trim();
	const provided = url.searchParams.get(DEBUG_PARAM)?.trim();

	if (provided === 'off') {
		cookies.delete(DEBUG_COOKIE, { path: '/' });
		return false;
	}

	if (!token) return false;

	if (provided === token) {
		cookies.set(DEBUG_COOKIE, token, {
			path: '/',
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'lax',
			maxAge: DEBUG_MAX_AGE
		});
		return true;
	}

	return cookies.get(DEBUG_COOKIE)?.trim() === token;
}

/** Resolve the gate for a request and stash it for `+layout.server.ts` to reuse. */
function configFor(event: RequestEvent): AnalyticsConfig {
	const debugGranted = resolveDebugGrant(
		event.url,
		event.cookies,
		privateEnv.ANALYTICS_DEBUG_TOKEN
	);

	return resolveAnalyticsConfig({
		enabledFlag: publicEnv.PUBLIC_ANALYTICS_ENABLED,
		gtmId: publicEnv.PUBLIC_GTM_ID,
		hostname: event.url.hostname,
		isDev: dev,
		// Set by @sanity/svelte-loader's handler, which must run before this one.
		isPreview: event.locals.preview === true,
		routeId: event.route.id,
		debugGranted
	});
}

/**
 * Inject the consent + GTM bootstrap into <head>.
 *
 * Always replaces the placeholder — when analytics is off it becomes an HTML comment
 * naming the reason, so the literal can never leak into a response and QA can see at a
 * glance why a given environment is silent.
 */
export const analyticsHandle: Handle = async ({ event, resolve }) => {
	const config = configFor(event);
	event.locals.analytics = config;

	const markup =
		config.mode === 'off' || !config.gtmId
			? buildDisabledComment(config.reason)
			: buildBootstrapScript({
					gtmId: config.gtmId,
					debug: config.mode === 'debug'
				});

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace(PLACEHOLDER, markup)
	});

	/* The two cases whose HTML is legitimately not the same as everyone else's: a QA debug
	   session (extra GTM Preview markers) and a Sanity draft preview (unpublished content).
	   Marking them here — rather than in whatever later sets the cache headers — keeps the
	   rule next to the code that creates the variance, so enabling edge caching cannot
	   accidentally publish a draft or pin a debug document into a shared cache. */
	if (config.mode === 'debug' || event.locals.preview === true) {
		response.headers.set('cache-control', 'private, no-store');
	}

	return response;
};
