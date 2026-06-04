import { buildPublicImageUrl } from '../image';
import { resolveListingHeroImage } from './mediaFilter';
import { filterPublicPricing, type PublicPricing } from './pricingFilter';
import { CARD_HERO_IMAGE, toPublicPropertyCard, type PublicPropertyCard, type RawPropertyCard } from './propertyCard';

export type RawDevelopmentCard = {
	_id: string;
	listingKind?: string | null;
	ghiListingId?: string | null;
	title?: string | null;
	slug?: string | null;
	developmentDisplayMode?:
		| 'flat_listing'
		| 'unit_types'
		| 'units'
		| 'price_from_summary'
		| 'enquiry_led'
		| null;
	developmentStatus?: string | null;
	location?: PublicPropertyCard['location'];
	pricing?: Parameters<typeof filterPublicPricing>[0] | null;
	media?: RawPropertyCard['media'];
};

export type PublicDevelopmentCard = {
	_id: string;
	ghiListingId?: string | null;
	title?: string | null;
	slug?: string | null;
	listingKind?: string | null;
	developmentDisplayMode: RawDevelopmentCard['developmentDisplayMode'];
	developmentStatus?: string | null;
	location: PublicPropertyCard['location'];
	pricing: PublicPricing | null;
	heroImageUrl: string | null;
	heroImageAlt: string | null;
};

export type SimilarListingCard =
	| { kind: 'property'; card: PublicPropertyCard }
	| { kind: 'development'; card: PublicDevelopmentCard };

export type RawSimilarListingItem = RawPropertyCard | RawDevelopmentCard;

export function isRawDevelopmentCard(raw: RawSimilarListingItem): raw is RawDevelopmentCard {
	return raw.listingKind === 'development';
}

/** Map a development card query row to a component-ready payload. */
export function toPublicDevelopmentCard(raw: RawDevelopmentCard): PublicDevelopmentCard {
	const heroAsset = resolveListingHeroImage(raw.media);
	const heroImageUrl = buildPublicImageUrl(heroAsset, CARD_HERO_IMAGE);

	return {
		_id: raw._id,
		ghiListingId: raw.ghiListingId,
		title: raw.title,
		slug: raw.slug,
		listingKind: raw.listingKind,
		developmentDisplayMode: raw.developmentDisplayMode ?? 'flat_listing',
		developmentStatus: raw.developmentStatus,
		location: raw.location ?? null,
		pricing: filterPublicPricing(raw.pricing),
		heroImageUrl,
		heroImageAlt: heroAsset?.altText ?? raw.title ?? null
	};
}

/** Map a mixed manual-similar row to a discriminated card union. */
export function toSimilarListingCard(raw: RawSimilarListingItem): SimilarListingCard | null {
	if (!raw?._id) {
		return null;
	}

	if (isRawDevelopmentCard(raw)) {
		return { kind: 'development', card: toPublicDevelopmentCard(raw) };
	}

	return { kind: 'property', card: toPublicPropertyCard(raw as RawPropertyCard) };
}

export function toSimilarListingCards(
	raw: Array<RawSimilarListingItem | null | undefined> | null | undefined,
	{ excludeId, limit }: { excludeId: string; limit: number }
): SimilarListingCard[] {
	return (raw ?? [])
		.filter((item): item is RawSimilarListingItem => Boolean(item?._id))
		.filter((item) => item._id !== excludeId)
		.slice(0, limit)
		.map(toSimilarListingCard)
		.filter((card): card is SimilarListingCard => card !== null);
}
