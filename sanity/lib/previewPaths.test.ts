import { describe, expect, it } from 'vitest';
import { buildListingPreviewPath, buildTaxonomyPreviewPath } from './previewPaths';

describe('buildListingPreviewPath', () => {
	it('returns a 4-segment path when all segments are present', () => {
		expect(
			buildListingPreviewPath({
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: 'marbella',
				slug: 'villa-example'
			})
		).toBe('/spain/costa-del-sol/marbella/villa-example');
	});

	it('returns null when community slug is missing', () => {
		expect(
			buildListingPreviewPath({
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: null,
				slug: 'villa-example'
			})
		).toBeNull();
	});
});

describe('buildTaxonomyPreviewPath', () => {
	it('builds country path', () => {
		expect(buildTaxonomyPreviewPath({ type: 'country', slug: 'spain' })).toBe('/spain');
	});

	it('builds location path', () => {
		expect(
			buildTaxonomyPreviewPath({ type: 'location', slug: 'costa-del-sol', parentSlug: 'spain' })
		).toBe('/spain/costa-del-sol');
	});

	it('builds community path as a filtered location URL', () => {
		expect(
			buildTaxonomyPreviewPath({
				type: 'community',
				slug: 'marbella',
				parentSlug: 'costa-del-sol',
				grandparentSlug: 'spain'
			})
		).toBe('/spain/costa-del-sol?community=marbella');
	});

	it('returns null for incomplete community hierarchy', () => {
		expect(
			buildTaxonomyPreviewPath({
				type: 'community',
				slug: 'marbella',
				parentSlug: 'costa-del-sol'
			})
		).toBeNull();
	});
});
