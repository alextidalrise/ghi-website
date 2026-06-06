import { describe, expect, it } from 'vitest';
import { buildFilteredLocationSeo, buildLocationSeo, buildRealEstateListingJsonLd } from './seo';
import type { PublicPropertyListing } from '$lib/sanity/transforms';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';

function baseListing(overrides: Partial<PublicPropertyListing> = {}): PublicPropertyListing {
	return {
		title: 'Test Villa',
		slug: 'test-villa',
		location: {
			country: { name: 'Spain', slug: 'spain' },
			location: { name: 'Costa del Sol', slug: 'costa-del-sol' },
			community: { name: 'Marbella', slug: 'marbella' },
			addressDisplay: 'Marbella Golf Resort',
			map: { level: 'none', coordinates: null, label: 'Marbella Golf Resort' }
		},
		pricing: {
			price: 1_250_000,
			currency: 'EUR',
			availabilityStatus: 'available'
		},
		specs: { bedrooms: 4, builtArea: 320, builtAreaUnit: 'sqm' },
		media: null,
		seo: null,
		ctas: null,
		golf: null,
		content: { shortDescription: 'Golf-front villa with sea views.' },
		...overrides
	} as PublicPropertyListing;
}

describe('buildFilteredLocationSeo', () => {
	it('uses community-aware title and noindex while canonical stays on the location page', () => {
		const seo = buildFilteredLocationSeo(
			{ name: 'Marbella', seoTitle: null, metaDescription: null, tagline: null },
			{ name: 'La Quinta', seoTitle: null, metaDescription: null, publicDescription: null },
			'https://example.com/spain/marbella'
		);

		expect(seo.title).toBe('La Quinta — Marbella');
		expect(seo.canonicalUrl).toBe('https://example.com/spain/marbella');
		expect(seo.noindex).toBe(true);
	});

	it('buildLocationSeo leaves location pages indexable', () => {
		const seo = buildLocationSeo(
			{ name: 'Marbella', seoTitle: null, metaDescription: null, tagline: null },
			'https://example.com/spain/marbella'
		);

		expect(seo.noindex).toBe(false);
	});

	it('falls back to the short tagline (not the long overview) for the SEO description', () => {
		const seo = buildLocationSeo(
			{ name: 'Marbella', seoTitle: null, metaDescription: null, tagline: 'Golf Valley flagship' },
			'https://example.com/spain/marbella'
		);

		expect(seo.description).toBe('Golf Valley flagship');
		expect(seo.openGraphDescription).toBe('Golf Valley flagship');
	});
});

describe('buildRealEstateListingJsonLd', () => {
	it('omits geo for community area map (no exact listing coordinates)', () => {
		const withCommunityMap = buildRealEstateListingJsonLd(
			baseListing({
				location: {
					...baseListing().location!,
					map: {
						level: 'area_only',
						coordinates: { lat: 36.5, lng: -4.9 },
						label: 'Marbella Golf Resort'
					}
				}
			}),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(withCommunityMap.geo).toBeUndefined();

		const withoutMap = buildRealEstateListingJsonLd(
			baseListing(),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(withoutMap.geo).toBeUndefined();
	});

	it('omits offers when price is unavailable (POA)', () => {
		const jsonLd = buildRealEstateListingJsonLd(
			baseListing({
				pricing: {
					priceDisplay: 'POA',
					currency: 'EUR',
					availabilityStatus: 'available'
				}
			}),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(jsonLd.offers).toBeUndefined();
	});

	it('omits image when gallery has no uploaded file', () => {
		const jsonLd = buildRealEstateListingJsonLd(
			baseListing({
				media: {
					gallery: [
						{
							altText: 'Gallery placeholder without file'
						} as MediaAssetInput
					]
				} as PublicPropertyListing['media']
			}),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(jsonLd.image).toBeUndefined();
	});

	it('includes image when first gallery item has an uploaded file', () => {
		const jsonLd = buildRealEstateListingJsonLd(
			baseListing({
				media: {
					gallery: [
						{
							asset: { _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg' }
						} as MediaAssetInput
					]
				} as PublicPropertyListing['media']
			}),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(jsonLd.image).toContain('Tb9Ew8CXIwaY6R1kjMvI0uRR');
	});
});
