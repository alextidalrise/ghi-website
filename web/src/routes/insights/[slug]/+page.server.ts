import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { fetchMaybePreview, insightBySlugQuery } from '$lib/sanity/queries';
import {
	buildInsightArticleJsonLd,
	buildInsightBreadcrumbs,
	buildInsightFaqJsonLd,
	buildInsightSeo,
	buildInsightToc,
	insightPath
} from '$lib/insights';
import type { InsightDetail } from '$lib/insights';

export const load: PageServerLoad = async ({ params, url, locals: { preview, loadQuery } }) => {
	const insight = await fetchMaybePreview<InsightDetail>(
		insightBySlugQuery,
		{ slug: params.slug },
		loadQuery,
		preview
	);

	if (!insight?.slug) {
		error(404, 'Article not found.');
	}

	const canonicalUrl = `${url.origin}${insightPath(insight.slug)}`;
	const breadcrumbs = buildInsightBreadcrumbs(insight);
	const seoBase = buildInsightSeo(insight, canonicalUrl);
	// Draft preview pages must never be indexed.
	const seo = preview ? { ...seoBase, noindex: true } : seoBase;

	const toc = buildInsightToc(insight.sections);

	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);
	const articleJsonLd = buildInsightArticleJsonLd(insight, canonicalUrl, seo.openGraphImageUrl);
	const faqJsonLd = buildInsightFaqJsonLd(insight.sections);

	return {
		insight,
		toc,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd,
		articleJsonLd,
		faqJsonLd
	};
};
