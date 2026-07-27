import type { Handle, RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { cacheHandle } from './server';

/**
 * These tests exist for one bug, which unit tests on `isCacheable` cannot see.
 *
 * `sequence()` nests its handlers: one listed later runs *nearer the render*, so its
 * pre-resolve code runs last but its post-resolve code runs FIRST. `cacheHandle` decides by
 * reading the finished response's `cache-control`, and `analyticsHandle` is what stamps
 * `private, no-store` on debug sessions and draft previews. Get the order backwards and
 * `cacheHandle` reads that header before it exists, attaching edge-cache headers to a debug
 * document — publishing one visitor's GTM Preview session, or unpublished content, into a
 * shared cache. Since `Vercel-CDN-Cache-Control` outranks `Cache-Control` at Vercel's edge,
 * the `no-store` sitting alongside it would not have saved us.
 */

/** Stands in for `analyticsHandle`: marks the response no-store *after* resolving. */
const noStoreHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('cache-control', 'private, no-store');
	return response;
};

function eventFor(pathname = '/', method = 'GET'): RequestEvent {
	return {
		request: new Request(`https://golfhomesinternational.com${pathname}`, { method }),
		route: { id: pathname === '/' ? '/' : pathname },
		url: new URL(`https://golfhomesinternational.com${pathname}`)
	} as unknown as RequestEvent;
}

const render = async () => new Response('<html></html>', { status: 200 });

/**
 * Nest two handlers the way `sequence` does — outer's `resolve` runs inner, so outer's
 * post-resolve code runs last. Hand-rolled rather than using `sequence` itself, which in
 * SvelteKit 2.60 requires an async-local request store that does not exist in a unit test.
 */
function nest(outer: Handle, inner: Handle): Handle {
	return ({ event, resolve }) =>
		outer({ event, resolve: (innerEvent) => inner({ event: innerEvent, resolve }) });
}

describe('cacheHandle ordering', () => {
	it('declines to cache when an inner handler marked the response no-store', async () => {
		// Production order: cacheHandle listed FIRST, so its response handling runs LAST.
		const response = await nest(cacheHandle, noStoreHandle)({ event: eventFor(), resolve: render });

		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(response.headers.has('vercel-cdn-cache-control')).toBe(false);
	});

	/* Pins the trap itself, so the ordering in hooks.server.ts has a failing test behind it
	   rather than only a comment. */
	it('is defeated by the reverse order — which is why hooks.server.ts lists it first', async () => {
		const response = await nest(noStoreHandle, cacheHandle)({ event: eventFor(), resolve: render });

		expect(response.headers.get('vercel-cdn-cache-control')).toContain('s-maxage=60');
	});

	it('caches a normal response that nobody opted out', async () => {
		const response = await cacheHandle({ event: eventFor(), resolve: render });

		expect(response.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
		expect(response.headers.get('vercel-cdn-cache-control')).toContain('s-maxage=60');
	});

	it('leaves a non-allowlisted route alone', async () => {
		const event = eventFor('/internal/design-system');
		const response = await cacheHandle({ event, resolve: render });

		expect(response.headers.has('vercel-cdn-cache-control')).toBe(false);
	});

	it('does not cache a response that sets a cookie, whatever the route', async () => {
		const setsCookie = async () =>
			new Response('<html></html>', { status: 200, headers: { 'set-cookie': 'a=b; Path=/' } });
		const response = await cacheHandle({ event: eventFor(), resolve: setsCookie });

		expect(response.headers.has('vercel-cdn-cache-control')).toBe(false);
	});
});
