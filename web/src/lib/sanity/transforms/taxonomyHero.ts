import { buildImageSrcset, buildPublicImageUrl } from '../image';
import type { MediaAssetInput } from './mediaFilter';

const HERO_WIDTHS = [960, 1280, 1600, 1920, 2400];
const COUNTRY_CARD = { width: 800, height: 600, fit: 'crop' as const, quality: 85 };
const LOCATION_CARD = { width: 600, height: 800, fit: 'crop' as const, quality: 85 };
const PAGE_HERO = { width: 1920, height: 1080, fit: 'crop' as const, quality: 85 };

export type TaxonomyHero = {
	url: string;
	srcset: string;
	alt: string;
	tagline: string | null;
};

export type CountryFeatureCard = {
	name: string;
	href: string;
	image: string;
	alt: string;
	tagline: string | null;
};

export type FeaturedLocationCard = {
	name: string;
	countryLabel: string;
	href: string;
	image: string;
	alt: string;
	tagline: string | null;
};

export type HomepageHero = {
	image?: MediaAssetInput | null;
	tagline?: string | null;
} | null;

export type TaxonomyWithHero = {
	name?: string | null;
	slug?: string | null;
	tagline?: string | null;
	heroImage?: MediaAssetInput | null;
	countrySlug?: string | null;
	countryName?: string | null;
};

function heroAlt(asset: MediaAssetInput | null | undefined, fallback: string): string {
	return asset?.altText?.trim() || fallback;
}

function buildHeroFromAsset(
	asset: MediaAssetInput | null | undefined,
	tagline: string | null | undefined,
	fallbackName: string
): TaxonomyHero | null {
	if (!asset) return null;

	const url = buildPublicImageUrl(asset, PAGE_HERO);
	if (!url) return null;

	return {
		url,
		srcset: buildImageSrcset(asset, HERO_WIDTHS, PAGE_HERO),
		alt: heroAlt(asset, fallbackName),
		tagline: tagline?.trim() || null
	};
}

/** Full-bleed page hero for a country or location taxonomy doc. */
export function resolveTaxonomyHero(doc: TaxonomyWithHero | null | undefined): TaxonomyHero | null {
	if (!doc?.heroImage) return null;
	return buildHeroFromAsset(doc.heroImage, doc.tagline, doc.name ?? 'Location');
}

/** Homepage hero from siteSettings.homepageHero. */
export function resolveHomepageHero(hero: HomepageHero): TaxonomyHero | null {
	if (!hero?.image) return null;
	return buildHeroFromAsset(hero.image, hero.tagline, 'Golf property');
}

function resolveCardImage(
	asset: MediaAssetInput | null | undefined,
	options: typeof COUNTRY_CARD | typeof LOCATION_CARD,
	fallbackName: string
): { image: string; alt: string } | null {
	if (!asset) return null;

	const image = buildPublicImageUrl(asset, options);
	if (!image) return null;

	return { image, alt: heroAlt(asset, fallbackName) };
}

export function toCountryCard(doc: TaxonomyWithHero | null | undefined): CountryFeatureCard | null {
	if (!doc?.slug || !doc.name) return null;

	// A card needs a picture; the tagline is optional and simply omitted when absent
	// (don't silently drop the whole card because an editor skipped the tagline).
	const cardImage = resolveCardImage(doc.heroImage, COUNTRY_CARD, doc.name);
	if (!cardImage) return null;

	return {
		name: doc.name,
		href: `/${doc.slug}`,
		image: cardImage.image,
		alt: cardImage.alt,
		tagline: doc.tagline?.trim() || null
	};
}

export function toLocationCard(doc: TaxonomyWithHero | null | undefined): FeaturedLocationCard | null {
	if (!doc?.slug || !doc.name || !doc.countrySlug || !doc.countryName) return null;

	const cardImage = resolveCardImage(doc.heroImage, LOCATION_CARD, doc.name);
	if (!cardImage) return null;

	return {
		name: doc.name,
		countryLabel: doc.countryName,
		href: `/${doc.countrySlug}/${doc.slug}`,
		image: cardImage.image,
		alt: cardImage.alt,
		tagline: doc.tagline?.trim() || null
	};
}

export function toCountryCards(
	docs: Array<TaxonomyWithHero | null | undefined> | null | undefined
): CountryFeatureCard[] {
	return (docs ?? [])
		.map(toCountryCard)
		.filter((card): card is CountryFeatureCard => Boolean(card));
}

export function toLocationCards(
	docs: Array<TaxonomyWithHero | null | undefined> | null | undefined
): FeaturedLocationCard[] {
	return (docs ?? [])
		.map(toLocationCard)
		.filter((card): card is FeaturedLocationCard => Boolean(card));
}

export function resolveHomepageHeroImage(hero: HomepageHero): {
	url: string;
	srcset: string;
	alt: string;
} | null {
	const resolved = resolveHomepageHero(hero);
	if (!resolved) return null;

	return {
		url: resolved.url,
		srcset: resolved.srcset,
		alt: resolved.alt
	};
}
