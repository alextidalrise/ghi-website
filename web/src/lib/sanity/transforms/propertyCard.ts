import { buildPublicImageUrl } from '../image';
import type { PropertyCardsByCommunityQueryResult } from '../types';
import { resolveListingHeroImage } from './mediaFilter';
import { filterPublicPricing, type PublicPricing } from './pricingFilter';

export type RawPropertyCard = PropertyCardsByCommunityQueryResult[number];

export type PublicPropertyCardLocation = NonNullable<RawPropertyCard['location']>;

export type PublicPropertyCardSpecs = RawPropertyCard['specs'];

/** 3:2 card hero dimensions per DESIGN.md property card spec. */
export const CARD_HERO_IMAGE = { width: 600, height: 400, fit: 'crop' as const, quality: 82 };

export type PublicPropertyCard = {
	_id: RawPropertyCard['_id'];
	ghiListingId: RawPropertyCard['ghiListingId'];
	title: RawPropertyCard['title'];
	slug: RawPropertyCard['slug'];
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	isCatchAll?: boolean | null;
	listingKind: RawPropertyCard['listingKind'];
	propertyType: RawPropertyCard['propertyType'];
	transactionType: RawPropertyCard['transactionType'];
	location: PublicPropertyCardLocation | null;
	pricing: PublicPricing | null;
	specs: PublicPropertyCardSpecs;
	heroImageUrl: string | null;
	heroImageAlt: string | null;
};

/** Map a card query row to a privacy-safe, component-ready card payload. */
export function toPublicPropertyCard(raw: RawPropertyCard): PublicPropertyCard {
	const heroAsset = resolveListingHeroImage(raw.media);
	const heroImageUrl = buildPublicImageUrl(heroAsset, CARD_HERO_IMAGE);

	return {
		_id: raw._id,
		ghiListingId: raw.ghiListingId,
		title: raw.title,
		slug: raw.slug,
		countrySlug: raw.countrySlug,
		locationSlug: raw.locationSlug,
		communitySlug: raw.communitySlug,
		isCatchAll: raw.isCatchAll,
		listingKind: raw.listingKind,
		propertyType: raw.propertyType,
		transactionType: raw.transactionType,
		location: raw.location,
		pricing: filterPublicPricing(raw.pricing),
		specs: raw.specs,
		heroImageUrl,
		heroImageAlt: heroAsset?.altText ?? raw.title ?? null
	};
}
