import { describe, expect, it } from 'vitest';
import { buildCanonicalPath, buildListingHref } from './canonicalPath';

describe('buildCanonicalPath', () => {
	it('returns a 4-segment path when all segments are present', () => {
		expect(
			buildCanonicalPath({
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: 'marbella',
				slug: 'villa-example'
			})
		).toBe('/spain/costa-del-sol/marbella/villa-example');
	});
});

describe('buildListingHref', () => {
	it('returns a 4-segment path from card location slugs + listing slug', () => {
		expect(
			buildListingHref({
				slug: 'villa-example',
				location: {
					country: { slug: 'spain' },
					location: { slug: 'costa-del-sol' },
					community: { slug: 'marbella' }
				}
			})
		).toBe('/spain/costa-del-sol/marbella/villa-example');
	});

	it('returns null when community slug is missing', () => {
		expect(
			buildListingHref({
				slug: 'villa-example',
				location: {
					country: { slug: 'spain' },
					location: { slug: 'costa-del-sol' },
					community: null
				}
			})
		).toBeNull();
	});

	it('returns null when slug is missing', () => {
		expect(
			buildListingHref({
				slug: null,
				location: {
					country: { slug: 'spain' },
					location: { slug: 'costa-del-sol' },
					community: { slug: 'marbella' }
				}
			})
		).toBeNull();
	});

	it('returns null when location is null', () => {
		expect(
			buildListingHref({
				slug: 'villa-example',
				location: null
			})
		).toBeNull();
	});
});
