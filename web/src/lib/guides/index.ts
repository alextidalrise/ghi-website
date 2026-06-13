import { resolveTaxonomyHero, type TaxonomyHero } from '$lib/sanity/transforms/taxonomyHero';
import type { GuideDetail, GuideSection, GuideTocItem } from './types';

/** Full-bleed page hero for a guide, or null when no hero image is set. */
export function resolveGuideHero(guide: GuideDetail): TaxonomyHero | null {
	return resolveTaxonomyHero({
		name: guide.title ?? 'Guide',
		heroImage: guide.heroImage,
		tagline: guide.tagline
	});
}

/** Contents-rail items: only sections that carry both a heading and an anchor. */
export function buildGuideToc(sections: GuideSection[] | null | undefined): GuideTocItem[] {
	return (sections ?? [])
		.filter(
			(section): section is GuideSection & { anchor: string; heading: string } =>
				Boolean(section.anchor && section.heading)
		)
		.map((section) => ({ anchor: section.anchor, heading: section.heading }));
}

export { GUIDES_PATH, guidePath } from './routes';
export {
	GUIDE_CATEGORY_ORDER,
	GUIDE_CATEGORY_META,
	groupGuidesByCategory,
	isGuideCategory,
	type GuideCategoryGroup,
	type GuideCategoryMeta
} from './categories';
export { buildGuidesBreadcrumbs, buildGuideBreadcrumbs } from './breadcrumbs';
export { buildGuideSeo, buildGuideArticleJsonLd, type GuideSeoMeta } from './seo';
export type {
	GuideCard,
	GuideCategory,
	GuideDetail,
	GuideSection,
	GuideTocItem,
	GuideBodyBlock,
	GuideCalloutBlock,
	GuideKeyFiguresBlock,
	GuideImageBlock
} from './types';
