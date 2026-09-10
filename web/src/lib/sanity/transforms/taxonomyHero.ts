import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '../image';
import type { MediaAssetInput } from './mediaFilter';

const HERO_WIDTHS = [640, 960, 1280, 1600, 1920, 2400];
const PAGE_HERO = { width: 1920, height: 1080, fit: 'crop' as const, quality: 60 };

// A location tile carries two crops of the same approved hero. The mobile swipe rail shows a
// portrait card; the desktop grid lays the tile out landscape and lets a trailing incomplete
// row flex-grow — a lone tile fills the whole row. Serving one 600×800 portrait to both meant
// the desktop tile upscaled a 600px-wide portrait across a ~960px landscape area (soft, over-
// cropped). So we build a portrait and a landscape derivative, each with its own srcset; both
// pass through the same image builder, so the Sanity hotspot/crop is honoured in both.
const LOCATION_CARD_PORTRAIT = { width: 600, height: 800, fit: 'crop' as const, quality: 65 };
const LOCATION_CARD_LANDSCAPE = { width: 1200, height: 800, fit: 'crop' as const, quality: 65 };
// Portrait rail tops out at ~296 CSS px (2× ⇒ ~600). Landscape desktop tiles run from a narrow
// 4-up (~223px) to a full-width lone tile (~964px, 2× ⇒ ~1920).
const LOCATION_PORTRAIT_WIDTHS = [300, 450, 600, 800];
const LOCATION_LANDSCAPE_WIDTHS = [480, 640, 800, 960, 1280, 1600, 1920];

export type TaxonomyHero = {
	url: string;
	srcset: string;
	lqip: string | null;
	alt: string;
	tagline: string | null;
};

export type CountryFeatureCard = {
	name: string;
	href: string;
	/** Raw flag asset URL (SVG) linked in Sanity; null falls back to a built-in stamp. */
	flagUrl: string | null;
	tagline: string | null;
};

export type FeaturedLocationCard = {
	name: string;
	countryLabel: string;
	/** Parent country slug, used to group locations by country on the homepage. */
	countrySlug: string;
	href: string;
	/** Portrait crop (3:4) — the mobile swipe-rail card and the <picture> fallback. */
	image: string;
	/** Portrait srcset for the rail at higher pixel densities. */
	portraitSrcset: string;
	/** Landscape crop (3:2) — the desktop grid, where tiles can flex-grow to a full row. */
	landscape: string;
	/** Landscape srcset, from a narrow 4-up tile up to a full-width lone tile at 2×. */
	landscapeSrcset: string;
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
	/** Dereferenced flag asset URL, projected only by the country selector query. */
	flagUrl?: string | null;
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
		lqip: getImagePlaceholder(asset),
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

type LocationCardImages = Pick<
	FeaturedLocationCard,
	'image' | 'portraitSrcset' | 'landscape' | 'landscapeSrcset' | 'alt'
>;

function resolveLocationCardImages(
	asset: MediaAssetInput | null | undefined,
	fallbackName: string
): LocationCardImages | null {
	if (!asset) return null;

	// The portrait crop gates the card: no portrait ⇒ the asset is blocked or missing, so the
	// tile drops out entirely (as before). The landscape crop shares the same gate and falls
	// back to the portrait URL only defensively — in practice both resolve or neither does.
	const image = buildPublicImageUrl(asset, LOCATION_CARD_PORTRAIT);
	if (!image) return null;

	return {
		image,
		portraitSrcset: buildImageSrcset(asset, LOCATION_PORTRAIT_WIDTHS, LOCATION_CARD_PORTRAIT),
		landscape: buildPublicImageUrl(asset, LOCATION_CARD_LANDSCAPE) ?? image,
		landscapeSrcset: buildImageSrcset(asset, LOCATION_LANDSCAPE_WIDTHS, LOCATION_CARD_LANDSCAPE),
		alt: heroAlt(asset, fallbackName)
	};
}

export function toCountryCard(doc: TaxonomyWithHero | null | undefined): CountryFeatureCard | null {
	// The selector identifies a country by name + slug. The flag and tagline are both
	// optional: a missing flag falls back to a built-in stamp, a missing tagline is
	// simply omitted — neither should drop the country off the homepage.
	if (!doc?.slug || !doc.name) return null;

	return {
		name: doc.name,
		href: `/${doc.slug}`,
		flagUrl: doc.flagUrl ?? null,
		tagline: doc.tagline?.trim() || null
	};
}

export function toLocationCard(doc: TaxonomyWithHero | null | undefined): FeaturedLocationCard | null {
	if (!doc?.slug || !doc.name || !doc.countrySlug || !doc.countryName) return null;

	const cardImage = resolveLocationCardImages(doc.heroImage, doc.name);
	if (!cardImage) return null;

	return {
		name: doc.name,
		countryLabel: doc.countryName,
		countrySlug: doc.countrySlug,
		href: `/${doc.countrySlug}/${doc.slug}`,
		image: cardImage.image,
		portraitSrcset: cardImage.portraitSrcset,
		landscape: cardImage.landscape,
		landscapeSrcset: cardImage.landscapeSrcset,
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
	lqip: string | null;
	alt: string;
} | null {
	const resolved = resolveHomepageHero(hero);
	if (!resolved) return null;

	return {
		url: resolved.url,
		srcset: resolved.srcset,
		lqip: resolved.lqip,
		alt: resolved.alt
	};
}
