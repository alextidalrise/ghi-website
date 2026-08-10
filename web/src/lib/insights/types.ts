import type { PortableTextBlock } from '@portabletext/types';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';
import type { GuideCalloutBlock, GuideKeyFiguresBlock, GuideImageBlock } from '$lib/guides/types';
import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';
import type {
	InsightDevelopmentCard,
	InsightDevelopmentGridItemRaw,
	InsightDevelopmentGroup
} from '$lib/sanity/transforms/insightDevelopmentCard';
import type { InsightCourseGridItemRaw } from '$lib/sanity/transforms/insightCourseCard';
import type { InsightPartnerLogoItemRaw } from '$lib/sanity/transforms/insightPartnerLogoCard';
import type { InsightGuideCardItemRaw } from '$lib/sanity/transforms/insightGuideCard';

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

/** One column of an `InsightFigurePairBlock`: a figure with its own caption and property link. */
export type InsightFigurePairItem = {
	_key?: string;
	image?: MediaAssetInput | null;
	caption?: string | null;
	linkLabel?: string | null;
	linkHref?: string | null;
};

/**
 * Two figures read as an equal pair (a place-vs-place comparison). Two side-by-side columns
 * on desktop, stacked on mobile; each keeps its own caption and optional property link. A
 * deliberate, explicit module — never an automatic pairing of adjacent single figures.
 */
export type InsightFigurePairBlock = {
	_type: 'insightFigurePair';
	_key: string;
	items?: InsightFigurePairItem[] | null;
};

/**
 * A compact, square editorial portrait floated beside the prose that introduces someone.
 * Unlike `InsightFigureBlock` (full-width, 16:9) it keeps the image's square ratio and renders
 * small; unlike `author.avatar` it names whoever the copy introduces without touching the byline.
 */
export type InsightPortraitBlock = {
	_type: 'insightPortrait';
	_key: string;
	image?: MediaAssetInput | null;
	name?: string | null;
	role?: string | null;
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
 * A Front Line collection carousel placed inline in the body. The editor hand-picks an ordered
 * set of listing references; the GROQ projection dereferences them (publish-gated) into raw card
 * rows, and the Insight server load maps those to `cards` — the discriminated card union the rail
 * renderer consumes directly off the block. See `insightFrontlineRail` and the section load.
 */
export type InsightFrontlineRailBlock = {
	_type: 'insightFrontlineRail';
	_key: string;
	heading?: string | null;
	summary?: string | null;
	/** Auto-summary templates used when `summary` is blank; `{count}` interpolates the live number. */
	summaryCountSingular?: string | null;
	summaryCountPlural?: string | null;
	/** The outbound link beneath the carousel. Absent `showViewAll` (older blocks) reads as shown. */
	showViewAll?: boolean | null;
	viewAllLabel?: string | null;
	viewAllHref?: string | null;
	cards?: SimilarListingCard[] | null;
};

/**
 * One destination panel as projected (raw): the article's own copy/image plus the dereferenced
 * canonical location that owns the name, hub route and default photograph. Resolved into a
 * render-ready card by `toInsightDestinationCard`.
 */
export type InsightDestinationCardRaw = {
	_key?: string;
	body?: string | null;
	caption?: string | null;
	actionLabel?: string | null;
	actionHrefOverride?: string | null;
	imageOverride?: MediaAssetInput | null;
	location?: {
		_id?: string | null;
		name?: string | null;
		slug?: string | null;
		type?: string | null;
		countrySlug?: string | null;
		heroImage?: MediaAssetInput | null;
	} | null;
};

/** An ordered set of destination panels. Identity is live; only copy/image overrides are article-owned. */
export type InsightDestinationGridBlock = {
	_type: 'insightDestinationGrid';
	_key: string;
	heading?: string | null;
	items?: InsightDestinationCardRaw[] | null;
};

/**
 * The live development collection. The projection carries raw `items` (each with a publish-gated
 * canonical development row); the Insight server load resolves those into `cards` (flat, editor
 * order) and `groups` (by destination, for the mobile view) — the shape the renderer consumes.
 */
export type InsightDevelopmentGridBlock = {
	_type: 'insightDevelopmentGrid';
	_key: string;
	heading?: string | null;
	mobileInitialMode?: 'onePerGroup' | 'all' | null;
	expandLabel?: string | null;
	collapseLabel?: string | null;
	items?: InsightDevelopmentGridItemRaw[] | null;
	cards?: InsightDevelopmentCard[] | null;
	groups?: InsightDevelopmentGroup[] | null;
};

/**
 * A collection of golf courses. The projection carries raw `items` (each with a dereferenced
 * canonical course); the renderer resolves them to cards. Identity and route are always live.
 */
export type InsightCourseGridBlock = {
	_type: 'insightCourseGrid';
	_key: string;
	heading?: string | null;
	items?: InsightCourseGridItemRaw[] | null;
};

/**
 * A partner logo wall. The projection carries raw `items` (each with a dereferenced partner, logo
 * included but `referralUrl` never); the renderer resolves them to cells linking to /partners.
 */
export type InsightPartnerLogoGridBlock = {
	_type: 'insightPartnerLogoGrid';
	_key: string;
	heading?: string | null;
	items?: InsightPartnerLogoItemRaw[] | null;
};

/**
 * Exactly two live-text guide cards. The projection carries raw `items` (each with a dereferenced
 * guide); the renderer resolves them to cards. Title/audience/route are live; text is never an image.
 */
export type InsightGuideCardsBlock = {
	_type: 'insightGuideCards';
	_key: string;
	heading?: string | null;
	items?: InsightGuideCardItemRaw[] | null;
};

/** A member of a section body: prose, the shared guide blocks, or a journal block. */
export type InsightBodyBlock =
	| PortableTextBlock
	| GuideCalloutBlock
	| GuideKeyFiguresBlock
	| GuideImageBlock
	| InsightFigureBlock
	| InsightFigurePairBlock
	| InsightPortraitBlock
	| InsightCardGridBlock
	| InsightRoutesBlock
	| InsightPullQuoteBlock
	| InsightTakeawaysBlock
	| InsightFaqBlock
	| InsightCtaCalloutBlock
	| InsightFrontlineRailBlock
	| InsightDestinationGridBlock
	| InsightDevelopmentGridBlock
	| InsightCourseGridBlock
	| InsightPartnerLogoGridBlock
	| InsightGuideCardsBlock;

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
	/** Hero composition. `splitSquare` is the opt-in equal-column, square-plate launch treatment. */
	heroLayout?: 'standard' | 'splitSquare' | null;
	author?: InsightAuthor | null;
	sections?: InsightSection[] | null;
	ctaHeading?: string | null;
	ctaBody?: string | null;
	/** Optional overrides for the closing band's buttons; each needs both a label and href to render. */
	ctaPrimary?: InsightCtaAction | null;
	ctaSecondary?: InsightCtaAction | null;
	/** When `false`, the closing band suppresses the alternative button entirely (distinct from an absent override). */
	ctaShowSecondary?: boolean | null;
	/** Optional closing-band WhatsApp overrides. Message is text only; the number stays centralised. */
	ctaWhatsAppLabel?: string | null;
	ctaWhatsAppMessage?: string | null;
	seo?: InsightSeo;
	related?: InsightCard[] | null;
};
