import { describe, expect, it } from 'vitest';
import { analyticsCookieNames, cookieDomainScopes } from './browserCookies';

describe('analyticsCookieNames', () => {
	it('finds the cookies Google sets', () => {
		const header = '_ga=GA1.1.123; _ga_KVB1ZMSGZV=GS1.1.456; _gcl_au=1.1.789; _gid=GA1.2.1';
		expect(analyticsCookieNames(header)).toEqual(['_ga', '_ga_KVB1ZMSGZV', '_gcl_au', '_gid']);
	});

	it('leaves our own cookies alone', () => {
		const header = 'ghi_consent=%7B%7D; launch_bypass=secret; ghi_analytics_debug=t';
		expect(analyticsCookieNames(header)).toEqual([]);
	});

	it('does not match a name that merely starts with the same letters', () => {
		// `_gallery` must not be mistaken for a `_ga` cookie.
		expect(analyticsCookieNames('_gallery=1; _garden=2')).toEqual([]);
	});

	it('picks Google cookies out of a mixed header', () => {
		expect(analyticsCookieNames('ghi_consent=x; _ga=1; other=2')).toEqual(['_ga']);
	});

	it('handles an empty or malformed header', () => {
		expect(analyticsCookieNames('')).toEqual([]);
		expect(analyticsCookieNames(';;')).toEqual([]);
		expect(analyticsCookieNames('novalue')).toEqual([]);
	});
});

describe('cookieDomainScopes', () => {
	it('covers the host and the registrable domain for a www host', () => {
		// GA sets _ga on the registrable domain, so deleting it from www requires the
		// dotted parent scope as well as the host itself.
		expect(cookieDomainScopes('www.golfhomesinternational.com')).toEqual([
			undefined,
			'www.golfhomesinternational.com',
			'.golfhomesinternational.com'
		]);
	});

	it('covers the apex domain', () => {
		expect(cookieDomainScopes('golfhomesinternational.com')).toEqual([
			undefined,
			'golfhomesinternational.com'
		]);
	});

	it('handles localhost without inventing a parent scope', () => {
		expect(cookieDomainScopes('localhost')).toEqual([undefined, 'localhost']);
	});

	it('walks every level of a deep preview hostname', () => {
		expect(cookieDomainScopes('a.b.example.com')).toEqual([
			undefined,
			'a.b.example.com',
			'.b.example.com',
			'.example.com'
		]);
	});
});
