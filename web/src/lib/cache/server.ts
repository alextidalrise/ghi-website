import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';
import { BROWSER_CACHE_CONTROL, EDGE_CACHE_CONTROL, isCacheable } from './policy';

/**
 * Opt public content responses into Vercel's CDN cache.
 *
 * Must be sequenced **after** `analyticsHandle`, which is what marks debug and preview
 * sessions `private, no-store`. The ordering is load-bearing: this handle reads that
 * header to decide whether to bail, so running it first would let a debug document into a
 * shared cache. See `isCacheable` for the full set of conditions and why each exists.
 */
export const cacheHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	const cacheable = isCacheable({
		method: event.request.method,
		status: response.status,
		routeId: event.route.id,
		hasSetCookie: response.headers.has('set-cookie'),
		existingCacheControl: response.headers.get('cache-control'),
		launchMode: env.LAUNCH_MODE === 'true'
	});

	if (!cacheable) return response;

	response.headers.set('cache-control', BROWSER_CACHE_CONTROL);
	response.headers.set('vercel-cdn-cache-control', EDGE_CACHE_CONTROL);

	return response;
};
