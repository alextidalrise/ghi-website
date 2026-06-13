import type { PortableTextBlock } from '@portabletext/types';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';

export type GuideCategory = 'buying' | 'location' | 'golf';

/** Editorial aside inside a section body. */
export type GuideCalloutBlock = {
	_type: 'guideCallout';
	_key: string;
	tone?: 'note' | 'important' | null;
	title?: string | null;
	body?: string | null;
};

export type GuideKeyFigureRow = {
	_key?: string;
	label?: string | null;
	value?: string | null;
	note?: string | null;
};

/** Compact label/value reference table inside a section body. */
export type GuideKeyFiguresBlock = {
	_type: 'guideKeyFigures';
	_key: string;
	caption?: string | null;
	rows?: GuideKeyFigureRow[] | null;
};

/** Inline image inside a section body (reuses the public media asset shape). */
export type GuideImageBlock = MediaAssetInput & {
	_type: 'mediaAssetMetadata';
	_key: string;
	dimensions?: { width?: number; height?: number; aspectRatio?: number } | null;
};

export type GuideBodyBlock =
	| PortableTextBlock
	| GuideCalloutBlock
	| GuideKeyFiguresBlock
	| GuideImageBlock;

export type GuideSection = {
	heading?: string | null;
	anchor?: string | null;
	body?: GuideBodyBlock[] | null;
};

export type GuideCard = {
	_id: string;
	title?: string | null;
	slug?: string | null;
	guideCategory?: GuideCategory | string | null;
	audienceLabel?: string | null;
	tagline?: string | null;
	heroImage?: MediaAssetInput | null;
};

export type GuideSeo = {
	seoTitle?: string | null;
	metaDescription?: string | null;
	openGraphTitle?: string | null;
	openGraphDescription?: string | null;
	openGraphImage?: MediaAssetInput | null;
	noindex?: boolean | null;
} | null;

export type GuideDetail = {
	_id: string;
	_type: 'guide';
	title?: string | null;
	slug?: string | null;
	guideCategory?: GuideCategory | string | null;
	audienceLabel?: string | null;
	tagline?: string | null;
	intro?: string | null;
	lastReviewed?: string | null;
	heroImage?: MediaAssetInput | null;
	sections?: GuideSection[] | null;
	advisorHeading?: string | null;
	advisorBody?: string | null;
	seo?: GuideSeo;
	relatedGuides?: GuideCard[] | null;
};

/** A contents-rail entry derived from a section that has both a heading and an anchor. */
export type GuideTocItem = { anchor: string; heading: string };
