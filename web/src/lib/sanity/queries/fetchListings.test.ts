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
			_id: location.community!._id ?? 'places-community-test',
			name: location.community!.name!,
			slug: location.community!.slug!,
			isCatchAll: location.community!.isCatchAll ?? null
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
		countrySlug: goldenPropertyRaw.location?.country?.slug ?? null,
		locationSlug: goldenPropertyRaw.location?.location?.slug ?? null,
		communitySlug: goldenPropertyRaw.location?.community?.slug ?? null,
		isCatchAll: goldenPropertyRaw.location?.community?.isCatchAll ?? false,
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
			pricing: { ...goldenPropertyRaw.pricing } as RawPropertyCard['pricing']
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
				golfRelevance: [],
				golfCourse: []
			}
		});

		expect(result.total).toBe(1);
		expect(result.cards).toHaveLength(1);
		expect(result.cards[0]).toEqual({ kind: 'property', card: toPublicPropertyCard(raw) });
		expect(JSON.stringify(result.cards[0])).not.toContain('priceConfirmed');
	});

	it('discriminates a development row into a development card with aggregated inventory', async () => {
		const devRow = {
			_id: 'dev-1',
			_type: 'development',
			listingKind: 'development',
			title: 'Epic Sample',
			slug: 'epic-sample',
			developmentDisplayMode: 'flat_listing',
			countrySlug: 'spain',
			locationSlug: 'costa-del-sol',
			communitySlug: 'marbella',
			isCatchAll: false,
			location: cardLocationFromFixture(),
			pricing: { priceFrom: 525000, priceTo: 1950000, currency: 'EUR' },
			unitsAvailable: 5,
			bedroomsFrom: 1,
			bedroomsTo: 3,
			media: null
		};

		mockedFetchPublic.mockImplementation(async (query) => {
			if (typeof query === 'string' && query.includes('| order(')) {
				return [devRow];
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
				golfRelevance: [],
				golfCourse: []
			}
		});

		expect(result.cards).toHaveLength(1);
		const entry = result.cards[0];
		expect(entry.kind).toBe('development');
		if (entry.kind === 'development') {
			expect(entry.card.unitsAvailable).toBe(5);
			expect(entry.card.bedroomsFrom).toBe(1);
			expect(entry.card.bedroomsTo).toBe(3);
			expect(entry.card.communitySlug).toBe('marbella');
		}
	});
});
