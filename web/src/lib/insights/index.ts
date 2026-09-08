import type { InsightSection, InsightTocItem } from './types';

/** Contents-rail items: only sections that carry both a heading and an anchor. */
export function buildInsightToc(
	sections: InsightSection[] | null | undefined
): InsightTocItem[] {
	return (sections ?? [])
		.filter(
			(section): section is InsightSection & { anchor: string; heading: string } =>
				Boolean(section.anchor && section.heading)
		)
		.map((section) => ({ anchor: section.anchor, heading: section.heading }));
}

/**
 * Body block types that make a section long or dense enough to earn a quiet "Back to contents"
 * route at its foot — the principal property/content grids plus the FAQ. Matched by `_type`, never
 * by heading text, so this stays reusable across every Insight (no Albany-specific section names).
 */
const BACK_TO_CONTENTS_BLOCK_TYPES = new Set([
	'insightFaq',
	'insightExternalPropertyGrid',
	'insightListingGrid',
	'insightDevelopmentGrid',
	'insightDestinationGrid',
	'insightCourseGrid',
	'insightCardGrid'
]);

/** True when a section carries a principal grid or the FAQ, so the shell appends a back-to-contents link. */
export function sectionHasBackToContents(section: InsightSection): boolean {
	return (section.body ?? []).some(
		(block) => Boolean(block) && BACK_TO_CONTENTS_BLOCK_TYPES.has((block as { _type?: string })._type ?? '')
	);
}

export { INSIGHTS_PATH, insightPath, insightsIndexHref } from './routes';
export {
	INSIGHT_CATEGORY_ORDER,
	INSIGHT_CATEGORY_META,
	isInsightCategory,
	insightKickerLabel,
	insightCategoryLabel,
	buildCategoryFilters,
	type InsightCategoryMeta,
	type InsightCategoryFilter
} from './categories';
export {
	readingMinutes,
	readingLabel,
	formatInsightDate,
	insightDateISO,
	splitTitleEmphasis,
	authorInitials,
	type TitleSegment
} from './format';
export { buildInsightsBreadcrumbs, buildInsightBreadcrumbs } from './breadcrumbs';
export {
	buildInsightSeo,
	buildInsightArticleJsonLd,
	buildInsightFaqJsonLd,
	collectFaqItems,
	type InsightSeoMeta
} from './seo';
export type {
	InsightCard,
	InsightCategory,
	InsightAuthor,
	InsightDetail,
	InsightCtaAction,
	InsightHeroNote,
	InsightSection,
	InsightTocItem,
	InsightBodyBlock,
	InsightPullQuoteBlock,
	InsightTakeawaysBlock,
	InsightFaqBlock,
	InsightFaqItem,
	InsightCtaCalloutBlock
} from './types';
