import { describe, expect, it } from 'vitest';
import { buildCanonicalPath, buildListingHref, resolveCommunitySlug } from './canonicalPath';

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

	it('derives community slug from places-community _id when slug is missing', () => {
		expect(
			buildListingHref({
				slug: 'las-encinas-la-quinta-benahavis',
				location: {
					country: { slug: 'spain' },
					location: { slug: 'benahavis' },
					community: { _id: 'places-community-la-quinta', slug: null }
				}
			})
		).toBe('/spain/benahavis/la-quinta/las-encinas-la-quinta-benahavis');
	});

	it('prefers pre-resolved communitySlug from card queries', () => {
		expect(
			buildListingHref({
				slug: 'villa-example',
				countrySlug: 'spain',
				locationSlug: 'benahavis',
				communitySlug: 'la-quinta',
				location: {
					country: { slug: 'spain' },
					location: { slug: 'benahavis' },
					community: { slug: null }
				}
			})
		).toBe('/spain/benahavis/la-quinta/villa-example');
	});
});

describe('resolveCommunitySlug', () => {
	it('returns slug.current when set', () => {
		expect(resolveCommunitySlug({ _id: 'places-community-la-quinta', slug: 'la-quinta' })).toBe(
			'la-quinta'
		);
	});

	it('derives from places-community _id prefix', () => {
		expect(resolveCommunitySlug({ _id: 'places-community-la-quinta', slug: null })).toBe('la-quinta');
	});

	it('derives from location.community _id prefix', () => {
		expect(
			resolveCommunitySlug({ _id: 'location.community.andalucia-del-mar', slug: null })
		).toBe('andalucia-del-mar');
	});
});
