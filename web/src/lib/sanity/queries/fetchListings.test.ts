import { describe, expect, it, vi } from 'vitest';
import { goldenPropertyRaw } from '../verification/fixture-payloads';
import { isPublicMediaAsset, type MediaAssetInput } from '../transforms/mediaFilter';

vi.mock('../image', () => ({
	buildPublicImageUrl: vi.fn((asset: MediaAssetInput | null | undefined) => {
		if (!isPublicMediaAsset(asset)) {
			return null;
		}

		const ref =
			(asset?.asset as { asset?: { _ref?: string } } | undefined)?.asset?._ref ?? 'unknown';
		return `https://cdn.sanity.io/images/test/production/${ref}?w=600&h=400`;
	})
}));

vi.mock('./fetch', () => ({
	fetchPublic: vi.fn()
}));

import { fetchPublic } from './fetch';
import { fetchListingCards } from './fetchListings';
import { toPublicPropertyCard, type RawPropertyCard } from '../transforms/propertyCard';

const mockedFetchPublic = vi.mocked(fetchPublic);

function cardLocationFromFixture() {
	const location = goldenPropertyRaw.location!;
	return {
		country: { name: location.country!.name!, slug: location.country!.slug! },
		location: { name: location.location!.name!, slug: location.location!.slug! },
		community: {
			name: location.community!.name!,
			slug: location.community!.slug!
		},
		addressDisplay: location.addressDisplay!
	};
}

function baseCard(overrides: Partial<RawPropertyCard> = {}): RawPropertyCard {
	return {
		_id: goldenPropertyRaw._id!,
		ghiListingId: goldenPropertyRaw.ghiListingId!,
		title: goldenPropertyRaw.title!,
		slug: goldenPropertyRaw.slug!,
		listingKind: 'property',
		propertyType: 'villa',
		transactionType: 'sale',
		location: cardLocationFromFixture(),
		pricing: goldenPropertyRaw.pricing as RawPropertyCard['pricing'],
		specs: goldenPropertyRaw.specs as RawPropertyCard['specs'],
		media: goldenPropertyRaw.media as RawPropertyCard['media'],
		...overrides
	};
}

describe('fetchListingCards', () => {
	it('transforms raw card rows before returning page data', async () => {
		const raw = baseCard({
			pricing: {
				...goldenPropertyRaw.pricing,
				priceSourceStatus: 'folder_hint_only'
			} as RawPropertyCard['pricing']
		});

		mockedFetchPublic.mockImplementation(async (query) => {
			if (typeof query === 'string' && query.includes('| order(')) {
				return [raw];
			}
			return 1;
		});

		const result = await fetchListingCards({
			scope: {
				type: 'community',
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: 'marbella'
			},
			params: {
				page: 1,
				sort: 'title',
				propertyType: null,
				minPrice: null,
				maxPrice: null,
				minBeds: null,
				community: null,
				golfRelevance: []
			}
		});

		expect(result.total).toBe(1);
		expect(result.cards).toHaveLength(1);
		expect(result.cards[0]).toEqual(toPublicPropertyCard(raw));
		expect(JSON.stringify(result.cards[0])).not.toContain('priceSourceStatus');
	});
});
