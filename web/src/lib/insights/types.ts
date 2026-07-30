import type { PortableTextBlock } from '@portabletext/types';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';
import type { GuideCalloutBlock, GuideKeyFiguresBlock, GuideImageBlock } from '$lib/guides/types';

export type InsightCategory = 'market' | 'lifestyle' | 'golf' | 'relocation';

/** The byline behind an article, dereferenced from the `author` document. */
export type InsightAuthor = {
	_id?: string | null;
	name?: string | null;
	slug?: string | null;
	role?: string | null;
	bio?: string | null;
	avatar?: MediaAssetInput | null;
};

/** A framed, captioned photograph in the body. */
export type InsightFigureBlock = {
	_type: 'insightFigure';
	_key: string;
	image?: MediaAssetInput | null;
	caption?: string | null;
};

/** Two or three parallel points, side by side. */
export type InsightCardGridItem = {
	_key?: string;
	heading?: string | null;
	body?: string | null;
};

export type InsightCardGridBlock = {
	_type: 'insightCardGrid';
	_key: string;
	items?: InsightCardGridItem[] | null;
};

/** One path in a two-route decision aid: what it suits, its next step, and what follows. */
export type InsightRouteItem = {
	_key?: string;
	heading?: string | null;
	body?: string | null;
	actionLabel?: string | null;
	actionHref?: string | null;
	outcome?: string | null;
};

/** Exactly two routes, each with its own next step. See the `insightRoutes` schema. */
export type InsightRoutesBlock = {
	_type: 'insightRoutes';
	_key: string;
	heading?: string | null;
	routes?: InsightRouteItem[] | null;
};

/** Large pulled-out quote. */
export type InsightPullQuoteBlock = {
	_type: 'insightPullQuote';
	_key: string;
	quote?: string | null;
	attribution?: string | null;
};

/** Boxed "what this covers / key takeaways" summary. */
export type InsightTakeawayItem = {
	label?: string | null;
	text?: string | null;
};

export type InsightTakeawaysBlock = {
	_type: 'insightTakeaways';
	_key: string;
	heading?: string | null;
	items?: InsightTakeawayItem[] | null;
};

export type InsightFaqItem = {
	_key?: string;
	question?: string | null;
	answer?: string | null;
};

/** FAQ accordion (also drives FAQPage structured data). */
export type InsightFaqBlock = {
	_type: 'insightFaq';
	_key: string;
	items?: InsightFaqItem[] | null;
};

/** Inline enquiry prompt inside the body. */
export type InsightCtaCalloutBlock = {
	_type: 'insightCtaCallout';
	_key: string;
	heading?: string | null;
	body?: string | null;
	buttonLabel?: string | null;
	buttonHref?: string | null;
};

/**
 * A live Front Line collection carousel placed inline in the body. Carries only its framing —
 * the listings are the request-time frontline feed, delivered to the renderer via context
 * rather than projected onto the block. See `insightFrontlineRail` and `frontlineContext`.
 */
export type InsightFrontlineRailBlock = {
	_type: 'insightFrontlineRail';
	_key: string;
	heading?: string | null;
	summary?: string | null;
};

/** A member of a section body: prose, the shared guide blocks, or a journal block. */
export type InsightBodyBlock =
	| PortableTextBlock
	| GuideCalloutBlock
	| GuideKeyFiguresBlock
	| GuideImageBlock
	| InsightFigureBlock
	| InsightCardGridBlock
	| InsightRoutesBlock
	| InsightPullQuoteBlock
	| InsightTakeawaysBlock
	| InsightFaqBlock
	| InsightCtaCalloutBlock
	| InsightFrontlineRailBlock;

export type InsightSection = {
	heading?: string | null;
	anchor?: string | null;
	body?: InsightBodyBlock[] | null;
};

/** A contents-rail entry derived from a section that has both a heading and an anchor. */
export type InsightTocItem = { anchor: string; heading: string };

export type InsightSeo = {
	seoTitle?: string | null;
	metaDescription?: string | null;
	openGraphTitle?: string | null;
	openGraphDescription?: string | null;
	openGraphImage?: MediaAssetInput | null;
	noindex?: boolean | null;
} | null;

/**
 * Card projection for the index and related rail. The article body is never shipped to a
 * card — `bodyChars` is the flattened character count used to derive reading time.
 */
export type InsightCard = {
	_id: string;
	title?: string | null;
	slug?: string | null;
	insightCategory?: InsightCategory | string | null;
	subhead?: string | null;
	publishedAt?: string | null;
	featured?: boolean | null;
	readingTimeOverride?: number | null;
	bodyChars?: number | null;
	heroImage?: MediaAssetInput | null;
	author?: InsightAuthor | null;
};

/** The framed thesis note in the hero rail, under the image. */
export type InsightHeroNote = {
	heading?: string | null;
	body?: string | null;
};

/** Full article projection for the post template. */
/** A closing-CTA action override authored in Sanity. Both fields are needed to render a button. */
export type InsightCtaAction = {
	label?: string | null;
	href?: string | null;
};

export type InsightDetail = {
	_id: string;
	_type: 'insight';
	title?: string | null;
	/** A phrase from the title, set in italic on the hero. See `splitTitleEmphasis`. */
	titleEmphasis?: string | null;
	slug?: string | null;
	insightCategory?: InsightCategory | string | null;
	subhead?: string | null;
	publishedAt?: string | null;
	featured?: boolean | null;
	readingTimeOverride?: number | null;
	bodyChars?: number | null;
	heroImage?: MediaAssetInput | null;
	heroCaption?: string | null;
	heroNote?: InsightHeroNote | null;
	author?: InsightAuthor | null;
	sections?: InsightSection[] | null;
	ctaHeading?: string | null;
	ctaBody?: string | null;
	/** Optional overrides for the closing band's buttons; each needs both a label and href to render. */
	ctaPrimary?: InsightCtaAction | null;
	ctaSecondary?: InsightCtaAction | null;
	seo?: InsightSeo;
	related?: InsightCard[] | null;
};
