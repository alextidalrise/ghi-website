/**
 * Where analytics is allowed to run.
 *
 * This is the whole gating algorithm, kept pure and free of `$app`/`$env` imports so
 * the decision table can be unit tested exhaustively. The caller (`server.ts`) supplies
 * the environment; this module only decides.
 *
 * The decision is made server-side because the bootstrap script is written into the
 * HTML before hydration — a client-side host check would come far too late.
 */

export type AnalyticsMode = 'off' | 'live' | 'debug';

export type AnalyticsConfig = {
	mode: AnalyticsMode;
	gtmId: string | null;
	/** Why analytics is off. Surfaced as an HTML comment so QA can see the reason. */
	reason: string;
};

export type AnalyticsConfigInput = {
	/** PUBLIC_ANALYTICS_ENABLED — must be the exact string 'true' to count. */
	enabledFlag: string | undefined;
	/** PUBLIC_GTM_ID. */
	gtmId: string | undefined;
	/** `url.hostname` of the incoming request. */
	hostname: string;
	/** Vite dev server / `building` — never send production data from a dev process. */
	isDev: boolean;
	/** Sanity draft preview session (`locals.preview`). */
	isPreview: boolean;
	/** `route.id` of the matched route, or null for a 404. */
	routeId: string | null;
	/** The debug token was presented, or its cookie is still valid. */
	debugGranted: boolean;
};

/**
 * The only hosts permitted to send production analytics. Gating on hostname rather
 * than VERCEL_ENV means a preview promoted to production starts working automatically,
 * and a production build served from any other domain stays silent.
 */
export const PRODUCTION_HOSTS: readonly string[] = [
	'golfhomesinternational.com',
	'www.golfhomesinternational.com'
];

/**
 * Routes that are never measured.
 *
 * `/internal` is tooling. `/soon` is the pre-launch holding page: while LAUNCH_MODE is on
 * it absorbs the entire site's traffic, which would swamp the property with page views
 * that say nothing about how the real site is used.
 */
export function isExcludedRoute(routeId: string | null): boolean {
	if (!routeId) return false;
	return routeId.startsWith('/internal') || routeId === '/soon';
}

/**
 * Query parameter that opts a single request into the deferred GTM container.
 *
 * The eager container is the default and stays the default: GA4 only sees a visit once
 * the container has loaded, so holding it back trades away the arrivals that leave
 * early — exactly the traffic bounce rate is about.
 *
 * This override exists so that trade can be *measured* rather than argued about. Both
 * arms then run against the same deploy, the same CDN and the same page, which two
 * sequential deploys cannot promise. Nothing but measurement reads it; removing it is
 * safe once the question is settled.
 */
export const GTM_DEFER_PARAM = 'ghi_gtm';

export function resolveGtmDeferral(raw: string | null | undefined): boolean {
	return raw?.trim() === 'defer';
}

/**
 * Resolve whether — and how — analytics runs for this request. First match wins.
 *
 * Note the ordering of the debug check: it sits *after* the excluded-route and Sanity
 * preview guards but *before* the enabled flag and host check. That is what lets QA
 * exercise GTM Preview on a Vercel preview URL without touching a production
 * environment variable, while guaranteeing that no debug token can ever switch
 * analytics on inside the design system, the holding page, or a draft preview session.
 */
export function resolveAnalyticsConfig(input: AnalyticsConfigInput): AnalyticsConfig {
	const gtmId = input.gtmId?.trim() || null;

	if (!gtmId) {
		return { mode: 'off', gtmId: null, reason: 'no PUBLIC_GTM_ID' };
	}

	if (isExcludedRoute(input.routeId)) {
		return { mode: 'off', gtmId, reason: 'excluded route' };
	}

	if (input.isPreview) {
		return { mode: 'off', gtmId, reason: 'sanity draft preview' };
	}

	if (input.debugGranted) {
		return { mode: 'debug', gtmId, reason: 'debug token' };
	}

	if (input.enabledFlag?.trim() !== 'true') {
		return { mode: 'off', gtmId, reason: 'PUBLIC_ANALYTICS_ENABLED not true' };
	}

	if (input.isDev) {
		return { mode: 'off', gtmId, reason: 'dev server' };
	}

	if (!PRODUCTION_HOSTS.includes(input.hostname)) {
		return { mode: 'off', gtmId, reason: `non-production host: ${input.hostname}` };
	}

	return { mode: 'live', gtmId, reason: 'production' };
}
