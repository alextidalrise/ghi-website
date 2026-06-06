import { buildImageSrcset, buildPublicImageUrl } from '../image';
import type { MediaAssetInput } from './mediaFilter';

const HERO_WIDTHS = [720, 960, 1280, 1600, 2000];
const FRONTLINE_HERO_IMAGE = { width: 1600, height: 1400, fit: 'crop' as const, quality: 85 };

/** Defaults so the page renders fully before an editor authors the hero. */
export const FRONTLINE_HERO_DEFAULTS = {
	eyebrow: 'Frontline Golf',
	// `*…*` renders italic in the headline, matching the homepage display treatment.
	headline: 'Homes on the *fairway’s edge*',
	lead: 'Every home in this collection sits on the first line of a golf course, where the fairway is the view from the terrace and the first tee is a short walk from the door.',
	image: {
		url: '/design-system/assets/andalucia-golf-villa.png',
		srcset: '',
		alt: 'A golf-course villa overlooking the fairway and mountains at dusk'
	}
} as const;

export type FrontlineHeroInput = {
	image?: MediaAssetInput | null;
	eyebrow?: string | null;
	headline?: string | null;
	lead?: string | null;
} | null;

export type FrontlineHeroImage = {
	url: string;
	srcset: string;
	alt: string;
};

export type FrontlineHeroContent = {
	eyebrow: string;
	headline: string;
	lead: string;
	image: FrontlineHeroImage | null;
};

function resolveImage(
	asset: MediaAssetInput | null | undefined,
	altFallback: string
): FrontlineHeroImage | null {
	if (!asset) return null;
	const url = buildPublicImageUrl(asset, FRONTLINE_HERO_IMAGE);
	if (!url) return null;
	return {
		url,
		srcset: buildImageSrcset(asset, HERO_WIDTHS, FRONTLINE_HERO_IMAGE),
		alt: asset.altText?.trim() || altFallback
	};
}

/** Resolve the Front Line Collection hero, falling back to defaults field by field. */
export function resolveFrontlineHero(input: FrontlineHeroInput): FrontlineHeroContent {
	const eyebrow = input?.eyebrow?.trim() || FRONTLINE_HERO_DEFAULTS.eyebrow;
	const headline = input?.headline?.trim() || FRONTLINE_HERO_DEFAULTS.headline;
	const lead = input?.lead?.trim() || FRONTLINE_HERO_DEFAULTS.lead;

	return {
		eyebrow,
		headline,
		lead,
		// Editor image wins; otherwise the brand default keeps the asymmetric treatment intact.
		image:
			resolveImage(input?.image, 'Golf course fairway at a frontline property') ??
			FRONTLINE_HERO_DEFAULTS.image
	};
}
