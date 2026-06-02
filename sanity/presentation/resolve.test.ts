import { describe, expect, it } from 'vitest';
import { resolveListingLocation, resolveTaxonomyLocationState } from './resolve';

describe('resolveListingLocation', () => {
	it('returns a caution message when community or slug is missing', () => {
		expect(
			resolveListingLocation({
				title: 'Villa',
				slug: 'villa',
				countrySlug: null,
				locationSlug: null,
				communitySlug: null
			})
		).toEqual({
			message: 'Select a community and add a slug to preview.',
			tone: 'caution'
		});
	});

	it('builds a preview path from community taxonomy slugs only', () => {
		expect(
			resolveListingLocation({
				title: 'Villa Example',
				slug: 'villa-example',
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: 'marbella'
			})
		).toEqual({
			locations: [{ title: 'Villa Example', href: '/spain/costa-del-sol/marbella/villa-example' }]
		});
	});
});

describe('resolveTaxonomyLocationState', () => {
	it('returns a caution message when slug is missing', () => {
		expect(
			resolveTaxonomyLocationState({
				name: 'Spain',
				type: 'country',
				slug: null
			})
		).toEqual({
			message: 'Complete slug and parent hierarchy to preview this location page.',
			tone: 'caution'
		});
	});

	it('returns a preview location for a complete country', () => {
		expect(
			resolveTaxonomyLocationState({
				name: 'Spain',
				type: 'country',
				slug: 'spain'
			})
		).toEqual({
			locations: [{ title: 'Spain', href: '/spain' }]
		});
	});

	it('returns a preview location for a complete location', () => {
		expect(
			resolveTaxonomyLocationState({
				name: 'Marbella',
				type: 'location',
				slug: 'marbella',
				parentSlug: 'spain'
			})
		).toEqual({
			locations: [{ title: 'Marbella', href: '/spain/marbella' }]
		});
	});
});
