import { buildPublicImageUrl } from '$lib/sanity/image';
import type { InsightDetail, InsightFaqItem, InsightSection } from './types';

export type InsightSeoMeta = {
	canonicalUrl: string;
	title: string;
	description: string | null;
	openGraphTitle: string;
	openGraphDescription: string | null;
	openGraphImageUrl: string | null;
	noindex: boolean;
};

function subheadSnippet(subhead: string | null | undefined): string | null {
	const trimmed = subhead?.trim();
	if (!trimmed) return null;
	if (trimmed.length <= 157) return trimmed;
	return `${trimmed.slice(0, 154).trimEnd()}…`;
}

export function buildInsightSeo(insight: InsightDetail, canonicalUrl: string): InsightSeoMeta {
	const seo = insight.seo;
	const fallbackTitle = insight.title ?? 'Insight';
	const description = seo?.metaDescription?.trim() || subheadSnippet(insight.subhead);

	return {
		canonicalUrl,
		title: seo?.seoTitle ?? fallbackTitle,
		description: description ?? null,
		openGraphTitle: seo?.openGraphTitle ?? seo?.seoTitle ?? fallbackTitle,
		openGraphDescription: seo?.openGraphDescription ?? description ?? null,
		openGraphImageUrl: buildPublicImageUrl(seo?.openGraphImage ?? insight.heroImage, {
			width: 1200,
			height: 630,
			fit: 'crop'
		}),
		noindex: seo?.noindex ?? false
	};
}

/** Article JSON-LD for an insight page. */
export function buildInsightArticleJsonLd(
	insight: InsightDetail,
	canonicalUrl: string,
	imageUrl: string | null
): Record<string, unknown> {
	const jsonLd: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: insight.title ?? 'Insight',
		mainEntityOfPage: canonicalUrl,
		url: canonicalUrl,
		publisher: {
			'@type': 'Organization',
			name: 'Golf Homes International'
		}
	};

	const authorName = insight.author?.name?.trim();
	if (authorName) {
		jsonLd.author =
			authorName === 'Golf Homes International'
				? { '@type': 'Organization', name: authorName }
				: { '@type': 'Person', name: authorName };
	}

	const description = insight.seo?.metaDescription?.trim() || insight.subhead?.trim();
	if (description) jsonLd.description = description;
	if (imageUrl) jsonLd.image = imageUrl;
	if (insight.publishedAt) jsonLd.datePublished = insight.publishedAt;

	return jsonLd;
}

/** Every FAQ question/answer across the article's sections, in reading order. */
export function collectFaqItems(sections: InsightSection[] | null | undefined): InsightFaqItem[] {
	const items: InsightFaqItem[] = [];
	for (const section of sections ?? []) {
		for (const block of section.body ?? []) {
			if (block && (block as { _type?: string })._type === 'insightFaq') {
				const faqItems = (block as { items?: InsightFaqItem[] | null }).items ?? [];
				for (const item of faqItems) {
					if (item?.question?.trim() && item?.answer?.trim()) items.push(item);
				}
			}
		}
	}
	return items;
}

/** FAQPage JSON-LD, or null when the article has no answered questions. */
export function buildInsightFaqJsonLd(
	sections: InsightSection[] | null | undefined
): Record<string, unknown> | null {
	const items = collectFaqItems(sections);
	if (items.length === 0) return null;

	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}))
	};
}
