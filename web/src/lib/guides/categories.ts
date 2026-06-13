import type { GuideCard, GuideCategory } from './types';

/** Display order of categories on the hub. New categories slot in here. */
export const GUIDE_CATEGORY_ORDER: GuideCategory[] = ['buying', 'location', 'golf'];

export type GuideCategoryMeta = {
	/** Plural heading used as the group title on the hub. */
	label: string;
	/** One-line introduction shown beneath the group heading. */
	blurb: string;
};

export const GUIDE_CATEGORY_META: Record<GuideCategory, GuideCategoryMeta> = {
	buying: {
		label: 'Buying guides',
		blurb:
			'How a purchase works country by country: the legal steps, the taxes and fees, financing, and the order it all happens in.'
	},
	location: {
		label: 'Location guides',
		blurb:
			'Where to buy and why, area by area: the character of each place, who it suits, and what living there is like.'
	},
	golf: {
		label: 'Golf guides',
		blurb: 'The courses behind the homes: membership, access, and what playing there involves.'
	}
};

export function isGuideCategory(value: string | null | undefined): value is GuideCategory {
	return value === 'buying' || value === 'location' || value === 'golf';
}

export type GuideCategoryGroup = {
	category: GuideCategory;
	meta: GuideCategoryMeta;
	guides: GuideCard[];
};

/**
 * Bucket guide cards into category groups in display order. Categories with no
 * guides are dropped, so the hub never shows an empty "Golf guides" heading before
 * that content exists.
 */
export function groupGuidesByCategory(cards: GuideCard[]): GuideCategoryGroup[] {
	return GUIDE_CATEGORY_ORDER.map((category) => ({
		category,
		meta: GUIDE_CATEGORY_META[category],
		guides: cards.filter((card) => card.guideCategory === category)
	})).filter((group) => group.guides.length > 0);
}
