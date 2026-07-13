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
