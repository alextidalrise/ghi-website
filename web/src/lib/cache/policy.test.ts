import { describe, expect, it } from 'vitest';
import {
	BROWSER_CACHE_CONTROL,
	CACHEABLE_ROUTE_IDS,
	EDGE_CACHE_CONTROL,
	isCacheable,
	type CachePolicyInput
} from './policy';

/** A plain public page view, which should cache; each test perturbs one field. */
function cacheableInput(overrides: Partial<CachePolicyInput> = {}): CachePolicyInput {
	return {
		method: 'GET',
		status: 200,
		routeId: '/[country]',
		hasSetCookie: false,
		existingCacheControl: null,
		launchMode: false,
		...overrides
	};
}

describe('isCacheable', () => {
	it('caches a public content page', () => {
		expect(isCacheable(cacheableInput())).toBe(true);
	});

	it('caches HEAD as well as GET', () => {
		expect(isCacheable(cacheableInput({ method: 'HEAD' }))).toBe(true);
	});

	it('does not cache a form POST', () => {
		expect(isCacheable(cacheableInput({ method: 'POST', routeId: '/contact' }))).toBe(false);
	});

	/* The compliance case the whole consent refactor existed for: a debug session's HTML
	   carries GTM Preview markers, and a draft preview carries unpublished content. Both are
	   marked no-store upstream and must survive this handle untouched. */
	it('never overrides an upstream no-store', () => {
		expect(isCacheable(cacheableInput({ existingCacheControl: 'private, no-store' }))).toBe(false);
	});

	it('respects no-cache and private as opt-outs too', () => {
		expect(isCacheable(cacheableInput({ existingCacheControl: 'no-cache' }))).toBe(false);
		expect(isCacheable(cacheableInput({ existingCacheControl: 'private, max-age=0' }))).toBe(false);
	});

	it('ignores a cache-control that does not opt out', () => {
		expect(isCacheable(cacheableInput({ existingCacheControl: 'public, max-age=0' }))).toBe(true);
	});

	/* Vercel caches 404s, and an allowlisted route can throw one: `/[country]` calls
	   error(404) for an unknown location with route.id still set to the allowlisted id. */
	it('does not cache a 404 thrown by an allowlisted route', () => {
		expect(isCacheable(cacheableInput({ status: 404 }))).toBe(false);
	});

	it('does not cache redirects or errors', () => {
		for (const status of [301, 307, 410, 500]) {
			expect(isCacheable(cacheableInput({ status }))).toBe(false);
		}
	});

	it('does not cache a response that sets a cookie', () => {
		expect(isCacheable(cacheableInput({ hasSetCookie: true }))).toBe(false);
	});

	/* With the takeover on, +layout.server.ts redirects based on the launch_bypass cookie,
	   so output becomes cookie-dependent for every route at once. */
	it('caches nothing while the launch takeover is active', () => {
		expect(isCacheable(cacheableInput({ launchMode: true }))).toBe(false);
		expect(isCacheable(cacheableInput({ launchMode: true, routeId: '/' }))).toBe(false);
	});

	it('does not cache an unmatched URL', () => {
		expect(isCacheable(cacheableInput({ routeId: null }))).toBe(false);
	});

	it('does not cache internal tooling, the holding page, or the API', () => {
		for (const routeId of ['/internal/design-system', '/soon', '/api/newsletter']) {
			expect(isCacheable(cacheableInput({ routeId }))).toBe(false);
		}
	});

	it('does not cache short-link redirect routes', () => {
		for (const routeId of ['/d/[ghiId]', '/p/[ghiId]', '/u/[ghiId]']) {
			expect(isCacheable(cacheableInput({ routeId }))).toBe(false);
		}
	});

	// Deliberately deferred to their own change; asserted so nobody adds them by accident.
	it('does not yet cache sitemap or robots', () => {
		for (const routeId of ['/sitemap.xml', '/robots.txt']) {
			expect(isCacheable(cacheableInput({ routeId }))).toBe(false);
		}
	});

	it('caches every allowlisted route', () => {
		for (const routeId of CACHEABLE_ROUTE_IDS) {
			expect(isCacheable(cacheableInput({ routeId })), routeId).toBe(true);
		}
	});
});

describe('header values', () => {
	/* The browser must always revalidate, so a purge at the edge is immediately effective
	   and nobody can serve a stale document from their own disk. */
	it('tells the browser never to serve stale', () => {
		expect(BROWSER_CACHE_CONTROL).toContain('max-age=0');
		expect(BROWSER_CACHE_CONTROL).toContain('must-revalidate');
		expect(BROWSER_CACHE_CONTROL).not.toContain('s-maxage');
	});

	/* Vercel requires s-maxage to cache a function response at all, and SWR is what
	   actually produces hits at this traffic level. */
	it('gives the edge a short TTL and a long stale window', () => {
		expect(EDGE_CACHE_CONTROL).toContain('s-maxage=60');
		expect(EDGE_CACHE_CONTROL).toContain('stale-while-revalidate=604800');
	});
});
