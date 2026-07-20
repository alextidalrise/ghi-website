import { describe, expect, it } from 'vitest';
import { pageViewKey, safePageLocation } from './pageView';

describe('safePageLocation', () => {
	it('keeps the listing search parameters we put in the URL ourselves', () => {
		const url = new URL(
			'https://golfhomesinternational.com/spain/marbella?propertyType=villa&minPrice=500000&page=2'
		);
		const safe = new URL(safePageLocation(url));
		expect(safe.searchParams.get('propertyType')).toBe('villa');
		expect(safe.searchParams.get('minPrice')).toBe('500000');
		expect(safe.searchParams.get('page')).toBe('2');
	});

	it('drops an allowed parameter whose value is not one we would have written', () => {
		// Filtering names alone is not enough: anyone can craft a link putting prose or
		// an address inside a key that is on the allowlist.
		const url = new URL(
			'https://golfhomesinternational.com/spain/marbella' +
				'?community=someone@example.com&features=Call+me+on+07700+900123&propertyType=villa'
		);
		const safe = safePageLocation(url);
		expect(safe).not.toContain('someone');
		expect(safe).not.toContain('900123');
		// The legitimate filter beside them survives.
		expect(safe).toContain('propertyType=villa');
	});

	it('rejects a non-numeric value in a numeric parameter', () => {
		const url = new URL('https://golfhomesinternational.com/spain?page=2&minPrice=ring+me');
		const safe = safePageLocation(url);
		expect(safe).toContain('page=2');
		expect(safe).not.toContain('minPrice');
	});

	it('keeps a comma-joined slug list but rejects one containing prose', () => {
		const ok = safePageLocation(
			new URL('https://golfhomesinternational.com/spain?features=sea-view,pool')
		);
		expect(ok).toContain('sea-view');

		const bad = safePageLocation(
			new URL('https://golfhomesinternational.com/spain?features=sea-view,my+home+address')
		);
		expect(bad).not.toContain('features');
	});

	it('drops the whole parameter when any repeated value fails', () => {
		const url = new URL(
			'https://golfhomesinternational.com/spain?golfCourse=valderrama&golfCourse=hello%20there'
		);
		expect(safePageLocation(url)).not.toContain('golfCourse');
	});

	it('drops parameters we did not put there, which may carry personal data', () => {
		const url = new URL(
			'https://golfhomesinternational.com/contact?email=buyer@example.com&ref=abc&utm_source=x'
		);
		const safe = safePageLocation(url);
		expect(safe).not.toContain('buyer@example.com');
		expect(safe).not.toContain('email');
		expect(safe).not.toContain('ref');
		expect(safe).not.toContain('utm_source');
	});

	it('drops the launch bypass and analytics debug tokens', () => {
		const url = new URL('https://golfhomesinternational.com/?preview=secret&ghi_debug=token');
		const safe = safePageLocation(url);
		expect(safe).not.toContain('secret');
		expect(safe).not.toContain('token');
	});

	it('strips the fragment', () => {
		const url = new URL('https://golfhomesinternational.com/about#team');
		expect(safePageLocation(url)).toBe('https://golfhomesinternational.com/about');
	});

	it('leaves a plain URL untouched', () => {
		const url = new URL('https://golfhomesinternational.com/spain/marbella');
		expect(safePageLocation(url)).toBe('https://golfhomesinternational.com/spain/marbella');
	});
});

describe('pageViewKey', () => {
	it('distinguishes paths and query strings', () => {
		expect(pageViewKey(new URL('https://x.com/a'))).not.toBe(pageViewKey(new URL('https://x.com/b')));
		expect(pageViewKey(new URL('https://x.com/a?page=1'))).not.toBe(
			pageViewKey(new URL('https://x.com/a?page=2'))
		);
	});

	it('treats a hash-only change as the same page, so it does not double-count', () => {
		expect(pageViewKey(new URL('https://x.com/a#top'))).toBe(
			pageViewKey(new URL('https://x.com/a#bottom'))
		);
	});
});
