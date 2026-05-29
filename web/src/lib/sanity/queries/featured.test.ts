import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import {
	COUNTRY_FEATURED_LIMIT,
	FRONTLINE_LISTING_LIMIT,
	HOMEPAGE_FEATURED_LIMIT,
	fetchCountryFeaturedListingCards,
	fetchFrontlineListingCards,
	fetchHomepageFrontlineListingCards,
	fetchHomepageFeaturedListingCards
} from './featured';
import { toPublicPropertyCard, type RawPropertyCard } from '../transforms/propertyCard';

const mockedFetchPublic = vi.mocked(fetchPublic);

beforeEach(() => {
	mockedFetchPublic.mockReset();
});

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
		publicTitle: goldenPropertyRaw.publicTitle!,
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

describe('fetchFrontlineListingCards', () => {
	it('fetches frontline_golf cards with limit and transforms results', async () => {
		const raw = baseCard();

		mockedFetchPublic.mockImplementation(async (_query, options) => {
			expect(options?.params).toMatchObject({
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				golfRelevance: ['frontline_golf'],
				start: 0,
				end: FRONTLINE_LISTING_LIMIT
			});
			return [raw];
		});

		const cards = await fetchFrontlineListingCards({
			scope: {
				type: 'location',
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol'
			}
		});

		expect(cards).toHaveLength(1);
		expect(cards[0]).toEqual(toPublicPropertyCard(raw));
		expect(mockedFetchPublic).toHaveBeenCalledTimes(1);
		const [query] = mockedFetchPublic.mock.calls[0];
		expect(typeof query).toBe('string');
		expect(query).toContain('_createdAt desc');
	});
});

describe('fetchHomepageFrontlineListingCards', () => {
	it('fetches site-wide frontline_golf cards without country scope params', async () => {
		const raw = baseCard();

		mockedFetchPublic.mockImplementation(async (_query, options) => {
			expect(options?.params).toMatchObject({
				golfRelevance: ['frontline_golf'],
				start: 0,
				end: FRONTLINE_LISTING_LIMIT
			});
			expect(options?.params).not.toHaveProperty('countrySlug');
			return [raw];
		});

		const cards = await fetchHomepageFrontlineListingCards();

		expect(cards).toHaveLength(1);
		expect(cards[0]).toEqual(toPublicPropertyCard(raw));
	});
});

describe('fetchHomepageFeaturedListingCards', () => {
	it('fetches ordered featured cards from site settings and filters null refs', async () => {
		const first = baseCard({ _id: 'listing-1', publicTitle: 'First pick' });
		const second = baseCard({ _id: 'listing-2', publicTitle: 'Second pick' });

		mockedFetchPublic.mockImplementation(async (query) => {
			expect(typeof query).toBe('string');
			expect(query).toContain('siteSettings');
			expect(query).toContain('homepageFeaturedListings');
			return { cards: [first, null, second] };
		});

		const cards = await fetchHomepageFeaturedListingCards();

		expect(cards).toHaveLength(2);
		expect(cards[0]).toEqual(toPublicPropertyCard(first));
		expect(cards[1]).toEqual(toPublicPropertyCard(second));
		expect(mockedFetchPublic).toHaveBeenCalledTimes(1);
	});

	it('applies homepage featured limit', async () => {
		const cards = Array.from({ length: HOMEPAGE_FEATURED_LIMIT + 2 }, (_, index) =>
			baseCard({ _id: `listing-${index}`, publicTitle: `Pick ${index}` })
		);

		mockedFetchPublic.mockResolvedValue({ cards });

		const result = await fetchHomepageFeaturedListingCards();

		expect(result).toHaveLength(HOMEPAGE_FEATURED_LIMIT);
	});
});

describe('fetchCountryFeaturedListingCards', () => {
	it('fetches ordered featured cards for a country slug', async () => {
		const raw = baseCard();

		mockedFetchPublic.mockImplementation(async (query, options) => {
			expect(typeof query).toBe('string');
			expect(query).toContain('locationTaxonomy');
			expect(query).toContain('featuredListings');
			expect(options?.params).toEqual({ countrySlug: 'spain' });
			return { cards: [raw] };
		});

		const cards = await fetchCountryFeaturedListingCards({ countrySlug: 'spain' });

		expect(cards).toHaveLength(1);
		expect(cards[0]).toEqual(toPublicPropertyCard(raw));
		expect(mockedFetchPublic).toHaveBeenCalledTimes(1);
	});

	it('applies country featured limit', async () => {
		const cards = Array.from({ length: COUNTRY_FEATURED_LIMIT + 2 }, (_, index) =>
			baseCard({ _id: `country-listing-${index}`, publicTitle: `Country pick ${index}` })
		);

		mockedFetchPublic.mockResolvedValue({ cards });

		const result = await fetchCountryFeaturedListingCards({ countrySlug: 'spain' });

		expect(result).toHaveLength(COUNTRY_FEATURED_LIMIT);
	});
});
