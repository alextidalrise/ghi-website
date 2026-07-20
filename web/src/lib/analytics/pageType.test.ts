import { describe, expect, it } from 'vitest';
import { KNOWN_ROUTE_IDS, pageTypeFor } from './pageType';

describe('pageTypeFor', () => {
	it('classifies every renderable route', () => {
		expect(pageTypeFor('/')).toBe('home');
		expect(pageTypeFor('/about')).toBe('about');
		expect(pageTypeFor('/contact')).toBe('contact');
		expect(pageTypeFor('/partners')).toBe('partners');
		expect(pageTypeFor('/front-line-collection')).toBe('collection');
		expect(pageTypeFor('/guides')).toBe('guide_index');
		expect(pageTypeFor('/guides/[slug]')).toBe('guide');
		expect(pageTypeFor('/insights')).toBe('insight_index');
		expect(pageTypeFor('/insights/[slug]')).toBe('insight');
		expect(pageTypeFor('/soon')).toBe('holding');
		expect(pageTypeFor('/[country]')).toBe('country');
		expect(pageTypeFor('/[country]/[location]')).toBe('location');
		expect(pageTypeFor('/[country]/[location]/[community]')).toBe('community');
		expect(pageTypeFor('/internal/design-system')).toBe('internal');
	});

	it('groups the legal pages under one type', () => {
		expect(pageTypeFor('/privacy')).toBe('legal');
		expect(pageTypeFor('/terms')).toBe('legal');
		expect(pageTypeFor('/cookies')).toBe('legal');
	});

	it('separates listing, unit and golf-course pages under the same prefix', () => {
		expect(pageTypeFor('/[country]/[location]/[community]/[slug]')).toBe('listing');
		expect(pageTypeFor('/[country]/[location]/[community]/[slug]/[unit]')).toBe('unit');
		// The golf route shares the [community] prefix and must not fall into 'listing'.
		expect(pageTypeFor('/[country]/[location]/[community]/golf/[slug]')).toBe('golf_course');
	});

	it('reports not_found for an unmatched route', () => {
		expect(pageTypeFor(null)).toBe('not_found');
		expect(pageTypeFor(undefined)).toBe('not_found');
		expect(pageTypeFor('')).toBe('not_found');
	});

	it('reports not_found for a route that has not been classified yet', () => {
		// This is the intended failure mode: a new route shows up as not_found in GA4
		// rather than being silently mis-bucketed into an existing page type.
		expect(pageTypeFor('/careers')).toBe('not_found');
	});

	it('never classifies the id-permalink redirects, which do not render', () => {
		for (const id of ['/p/[ghiId]', '/d/[ghiId]', '/u/[ghiId]']) {
			expect(KNOWN_ROUTE_IDS).not.toContain(id);
		}
	});
});
