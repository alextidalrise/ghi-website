import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Cookies, Handle, RequestEvent } from '@sveltejs/kit';
import {
	GTM_DEFER_PARAM,
	resolveAnalyticsConfig,
	resolveGtmDeferral,
	type AnalyticsConfig
} from './config';
import { CONSENT_COOKIE, parseConsent } from './consentCookie';
import { buildBootstrapScript, buildDisabledComment } from './snippet';
import type { StoredConsent } from './types';

/**
 * Server-side analytics wiring.
 *
 * The gate is resolved here, not in the browser, because the bootstrap script has to be
 * written into the HTML before hydration. That also means the visitor's stored consent
 * is known server-side, so the very first script on the page can carry their real
 * decision instead of waiting for a client-side cookie read.
 */

/** Replaced in `app.html`. Must stay in <head>, which SvelteKit emits in the first chunk. */
const PLACEHOLDER = '%ghi.analytics%';

const DEBUG_COOKIE = 'ghi_analytics_debug';
const DEBUG_PARAM = 'ghi_debug';

/** Deliberately short: a debug session should expire on its own, not linger. */
const DEBUG_MAX_AGE = 60 * 60 * 2;

/** Read and validate the visitor's stored consent decision. */
export function readConsent(cookies: Cookies): StoredConsent | null {
	return parseConsent(cookies.get(CONSENT_COOKIE));
}

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

	const consent = readConsent(event.cookies);

	const markup =
		config.mode === 'off' || !config.gtmId
			? buildDisabledComment(config.reason)
			: buildBootstrapScript({
					gtmId: config.gtmId,
					consent,
					debug: config.mode === 'debug',
					defer: resolveGtmDeferral(event.url.searchParams.get(GTM_DEFER_PARAM))
				});

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace(PLACEHOLDER, markup)
	});
};
