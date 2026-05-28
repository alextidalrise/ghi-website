import { describe, expect, it } from 'vitest';
import { buildRealEstateListingJsonLd } from './seo';
import type { PublicPropertyListing } from '$lib/sanity/transforms';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';

function baseListing(overrides: Partial<PublicPropertyListing> = {}): PublicPropertyListing {
	return {
		publicTitle: 'Test Villa',
		slug: 'test-villa',
		location: {
			country: { name: 'Spain', slug: 'spain' },
			location: { name: 'Costa del Sol', slug: 'costa-del-sol' },
			community: { name: 'Marbella', slug: 'marbella' },
			addressDisplay: 'Marbella Golf Resort',
			map: { level: 'hidden', coordinates: null, label: 'Marbella Golf Resort' }
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

describe('buildRealEstateListingJsonLd', () => {
	it('includes geo only when map level is exact', () => {
		const approximate = buildRealEstateListingJsonLd(
			baseListing({
				location: {
					...baseListing().location!,
					map: {
						level: 'approximate',
						coordinates: { lat: 36.5, lng: -4.9 },
						label: 'Marbella Golf Resort'
					}
				}
			}),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(approximate.geo).toBeUndefined();

		const exact = buildRealEstateListingJsonLd(
			baseListing({
				location: {
					...baseListing().location!,
					map: {
						level: 'exact',
						coordinates: { lat: 36.510123, lng: -4.885456 },
						label: 'Marbella Golf Resort'
					}
				}
			}),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(exact.geo).toEqual({
			'@type': 'GeoCoordinates',
			latitude: 36.510123,
			longitude: -4.885456
		});
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

	it('omits image when hero asset is not public-safe', () => {
		const jsonLd = buildRealEstateListingJsonLd(
			baseListing({
				media: {
					heroImage: {
						asset: { _ref: 'image-rejected' },
						imageRightsStatus: 'rejected',
						publicUseApproved: true
					} as MediaAssetInput
				} as PublicPropertyListing['media']
			}),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(jsonLd.image).toBeUndefined();
	});

	it('includes image when hero asset is approved', () => {
		const jsonLd = buildRealEstateListingJsonLd(
			baseListing({
				media: {
					heroImage: {
						asset: { _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg' },
						imageRightsStatus: 'source_pack_provided',
						assetBrandingType: 'ghi_branded'
					} as MediaAssetInput
				} as PublicPropertyListing['media']
			}),
			'https://example.com/spain/costa-del-sol/marbella/test-villa'
		);

		expect(jsonLd.image).toContain('Tb9Ew8CXIwaY6R1kjMvI0uRR');
	});
});
