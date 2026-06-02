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
	SIMILAR_LISTING_LIMIT,
	fetchSimilarListingCards
} from './similar';
import {
	toPublicDevelopmentCard,
	toSimilarListingCard,
	type RawDevelopmentCard
} from '../transforms/similarListingCard';
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

function basePropertyCard(overrides: Partial<RawPropertyCard> = {}): RawPropertyCard {
	return {
		_id: 'similar-property-1',
		ghiListingId: 'GHI00002',
		title: 'Similar villa',
		slug: 'similar-villa',
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

function baseDevelopmentCard(overrides: Partial<RawDevelopmentCard> = {}): RawDevelopmentCard {
	return {
		_id: 'similar-development-1',
		ghiListingId: 'GHI00003',
		title: 'Similar development',
		slug: 'similar-development',
		listingKind: 'development',
		developmentDisplayMode: 'unit_types',
		developmentStatus: 'under_construction',
		location: cardLocationFromFixture(),
		pricing: goldenPropertyRaw.pricing as RawDevelopmentCard['pricing'],
		media: goldenPropertyRaw.media as RawDevelopmentCard['media'],
		...overrides
	};
}

const baseInput = {
	listingId: goldenPropertyRaw._id!,
	propertyType: 'villa',
	location: cardLocationFromFixture()
};

describe('fetchSimilarListingCards', () => {
	it('returns empty array when mode is disabled', async () => {
		const cards = await fetchSimilarListingCards({
			...baseInput,
			mode: 'disabled'
		});

		expect(cards).toEqual([]);
		expect(mockedFetchPublic).not.toHaveBeenCalled();
	});

	it('fetches automatic similar cards with community and property type filters', async () => {
		const raw = basePropertyCard();

		mockedFetchPublic.mockImplementation(async (_query, options) => {
			expect(options?.params).toMatchObject({
				excludeId: goldenPropertyRaw._id,
				propertyType: 'villa',
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol-verification',
				communitySlug: 'verification-community',
				limit: SIMILAR_LISTING_LIMIT
			});
			return [raw];
		});

		const cards = await fetchSimilarListingCards({
			...baseInput,
			mode: 'automatic'
		});

		expect(cards).toHaveLength(1);
		expect(cards[0]).toEqual({ kind: 'property', card: toPublicPropertyCard(raw) });
		const [query] = mockedFetchPublic.mock.calls[0];
		expect(query).toContain('_createdAt desc');
	});

	it('defaults to automatic when mode is null', async () => {
		mockedFetchPublic.mockResolvedValue([]);

		await fetchSimilarListingCards({
			...baseInput,
			mode: null
		});

		expect(mockedFetchPublic).toHaveBeenCalledTimes(1);
		const [query] = mockedFetchPublic.mock.calls[0];
		expect(query).toContain('propertyType == $propertyType');
	});

	it('returns empty array for tags mode when tags are empty', async () => {
		mockedFetchPublic.mockResolvedValue({ tags: [] });

		const cards = await fetchSimilarListingCards({
			...baseInput,
			mode: 'tags'
		});

		expect(cards).toEqual([]);
		expect(mockedFetchPublic).toHaveBeenCalledTimes(1);
	});

	it('fetches tag overlap cards when tags are configured', async () => {
		const raw = basePropertyCard();

		mockedFetchPublic
			.mockResolvedValueOnce({ tags: ['golf-frontline', 'marina'] })
			.mockResolvedValueOnce([raw]);

		const cards = await fetchSimilarListingCards({
			...baseInput,
			mode: 'tags'
		});

		expect(cards).toHaveLength(1);
		expect(cards[0]).toEqual({ kind: 'property', card: toPublicPropertyCard(raw) });
		expect(mockedFetchPublic).toHaveBeenCalledTimes(2);

		const [, tagsCall] = mockedFetchPublic.mock.calls;
		expect(tagsCall[1]?.params).toMatchObject({
			excludeId: goldenPropertyRaw._id,
			tags: ['golf-frontline', 'marina'],
			limit: SIMILAR_LISTING_LIMIT
		});
		const [tagsQuery] = tagsCall;
		expect(tagsQuery).toContain('similarityTags');
	});

	it('fetches manual picks preserving order and mapping developments', async () => {
		const property = basePropertyCard({ _id: 'manual-property' });
		const development = baseDevelopmentCard({ _id: 'manual-development' });

		mockedFetchPublic.mockResolvedValue({
			items: [property, null, development]
		});

		const cards = await fetchSimilarListingCards({
			...baseInput,
			mode: 'manual'
		});

		expect(cards).toHaveLength(2);
		expect(cards[0]).toEqual({ kind: 'property', card: toPublicPropertyCard(property) });
		expect(cards[1]).toEqual({
			kind: 'development',
			card: toPublicDevelopmentCard(development)
		});

		const [query] = mockedFetchPublic.mock.calls[0];
		expect(query).toContain('manualSimilarProperties');
	});

	it('excludes current listing and applies limit for manual mode', async () => {
		const items = Array.from({ length: SIMILAR_LISTING_LIMIT + 2 }, (_, index) =>
			basePropertyCard({ _id: `manual-${index}`, title: `Pick ${index}` })
		);

		mockedFetchPublic.mockResolvedValue({ items });

		const cards = await fetchSimilarListingCards({
			...baseInput,
			mode: 'manual'
		});

		expect(cards).toHaveLength(SIMILAR_LISTING_LIMIT);
	});

	it('maps enquiry_led developments without price on the card transform', () => {
		const development = baseDevelopmentCard({ developmentDisplayMode: 'enquiry_led' });
		const card = toSimilarListingCard(development);

		expect(card?.kind).toBe('development');
		if (card?.kind === 'development') {
			expect(card.card.pricing).not.toBeNull();
		}
	});
});
