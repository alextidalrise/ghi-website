import { describe, expect, it } from 'vitest';
import {
	buildGolfCoursePreviewPath,
	buildListingPreviewPath,
	buildTaxonomyPreviewPath
} from './previewPaths';

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

	it('returns a 3-segment path when community is catch-all', () => {
		expect(
			buildListingPreviewPath({
				countrySlug: 'spain',
				locationSlug: 'nueva-andalucia',
				communitySlug: 'nueva-andalucia',
				slug: 'villa-example',
				isCatchAll: true
			})
		).toBe('/spain/nueva-andalucia/villa-example');
	});
});

describe('buildGolfCoursePreviewPath', () => {
	it('builds a golf course preview path', () => {
		expect(
			buildGolfCoursePreviewPath({
				countrySlug: 'spain',
				locationSlug: 'marbella',
				communitySlug: 'nueva-andalucia',
				slug: 'aloha-golf'
			})
		).toBe('/spain/marbella/nueva-andalucia/golf/aloha-golf');
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
