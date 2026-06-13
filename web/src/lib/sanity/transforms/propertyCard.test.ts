import { describe, expect, it, vi } from 'vitest';
import {
	APPROVED_IMAGE_REF,
	goldenPropertyRaw,
	mediaPrivacyPropertyRaw
} from '../verification/fixture-payloads';
import { isPublicMediaAsset, type MediaAssetInput } from './mediaFilter';
import { toPublicPropertyCard, type RawPropertyCard } from './propertyCard';

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

function mediaAsset(ref: string, alt: string): MediaAssetInput {
	return {
		asset: { _type: 'image', asset: { _type: 'reference', _ref: ref } },
		altText: alt
	};
}

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

describe('toPublicPropertyCard', () => {
	it('preserves public pricing and resolves hero image URL for golden fixture', () => {
		const card = toPublicPropertyCard(baseCard());

		expect(card.pricing?.price).toBe(895_000);
		expect(card.heroImageUrl).toBe(
			`https://cdn.sanity.io/images/test/production/${APPROVED_IMAGE_REF}?w=600&h=400`
		);
		expect(card.heroImageAlt).toBe('Approved hero');
		expect(card.location?.addressDisplay).toBe('Costa del Sol, Spain');
	});

	it('strips numeric prices and renders POA when priceConfirmed is false', () => {
		const card = toPublicPropertyCard(
			baseCard({
				pricing: {
					price: 650_000,
					priceFrom: 650_000,
					priceTo: 720_000,
					priceDisplay: 'POA',
					currency: 'EUR',
					priceConfirmed: false,
					availabilityStatus: 'available',
					completionStatus: null,
					completionDate: null,
					buildStatus: null,
					priceQualifier: null
				}
			})
		);

		expect(card.pricing?.price).toBeUndefined();
		expect(card.pricing?.priceFrom).toBeUndefined();
		expect(card.pricing?.priceTo).toBeUndefined();
		expect(card.pricing?.priceDisplay).toBe('POA');
	});

	it('falls back to thumbnailOverride when first gallery item has no file', () => {
		const card = toPublicPropertyCard(
			baseCard({
				media: {
					gallery: [{ altText: 'Gallery slot without file' }],
					thumbnailOverride: mediaAsset(APPROVED_IMAGE_REF, 'Thumbnail with file')
				} as RawPropertyCard['media']
			})
		);

		expect(card.heroImageUrl).toBe(
			`https://cdn.sanity.io/images/test/production/${APPROVED_IMAGE_REF}?w=600&h=400`
		);
		expect(card.heroImageAlt).toBe('Thumbnail with file');
	});

	it('returns null hero URL when gallery and thumbnail have no file', () => {
		const card = toPublicPropertyCard(
			baseCard({
				media: {
					gallery: [{ altText: 'Gallery slot without file' }]
				} as RawPropertyCard['media']
			})
		);

		expect(card.heroImageUrl).toBeNull();
		expect(card.heroImageAlt).toBe('Verification Golden Villa');
	});

	it('excludes pricing governance and raw media from serialized output', () => {
		const card = toPublicPropertyCard(baseCard());
		const serialized = JSON.stringify(card);

		expect(serialized).not.toContain('priceConfirmed');
		expect(serialized).not.toContain('"media"');
	});
});
