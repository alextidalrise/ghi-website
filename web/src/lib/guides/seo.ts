import { buildPublicImageUrl } from '$lib/sanity/image';
import type { GuideDetail } from './types';

export type GuideSeoMeta = {
	canonicalUrl: string;
	title: string;
	description: string | null;
	openGraphTitle: string;
	openGraphDescription: string | null;
	openGraphImageUrl: string | null;
	noindex: boolean;
};

/** Truncate the intro to a search-snippet length when nothing better is set. */
function introSnippet(intro: string | null | undefined): string | null {
	const trimmed = intro?.trim();
	if (!trimmed) return null;
	if (trimmed.length <= 157) return trimmed;
	return `${trimmed.slice(0, 154).trimEnd()}…`;
}

export function buildGuideSeo(guide: GuideDetail, canonicalUrl: string): GuideSeoMeta {
	const seo = guide.seo;
	const fallbackTitle = guide.title ?? 'Guide';
	const description =
		seo?.metaDescription?.trim() || guide.tagline?.trim() || introSnippet(guide.intro);

	return {
		canonicalUrl,
		title: seo?.seoTitle ?? fallbackTitle,
		description: description ?? null,
		openGraphTitle: seo?.openGraphTitle ?? seo?.seoTitle ?? fallbackTitle,
		openGraphDescription: seo?.openGraphDescription ?? description ?? null,
		openGraphImageUrl: buildPublicImageUrl(seo?.openGraphImage ?? guide.heroImage, {
			width: 1200,
			height: 630,
			fit: 'crop'
		}),
		noindex: seo?.noindex ?? false
	};
}

/** Article JSON-LD for a guide page. */
export function buildGuideArticleJsonLd(
	guide: GuideDetail,
	canonicalUrl: string,
	imageUrl: string | null
): Record<string, unknown> {
	const jsonLd: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: guide.title ?? 'Guide',
		mainEntityOfPage: canonicalUrl,
		url: canonicalUrl,
		publisher: {
			'@type': 'Organization',
			name: 'Golf Homes International'
		}
	};

	const description = guide.seo?.metaDescription?.trim() || guide.tagline?.trim();
	if (description) jsonLd.description = description;
	if (imageUrl) jsonLd.image = imageUrl;
	if (guide.lastReviewed) jsonLd.dateModified = guide.lastReviewed;

	return jsonLd;
}
