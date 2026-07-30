import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import {
	fetchHomepageFrontlineListingCards,
	fetchMaybePreview,
	insightBySlugQuery
} from '$lib/sanity/queries';
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

	// The live Front Line carousel is an inline body block. Fetch its feed only when an article
	// actually uses one — most don't, and the extra query would otherwise tax every article's
	// TTFB (this repo's binding constraint). It's the same canonical feed the homepage runs.
	const usesFrontlineRail = (insight.sections ?? []).some((section) =>
		(section.body ?? []).some((block) => block?._type === 'insightFrontlineRail')
	);
	const frontlineCards = usesFrontlineRail ? await fetchHomepageFrontlineListingCards() : [];

	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);
	const articleJsonLd = buildInsightArticleJsonLd(insight, canonicalUrl, seo.openGraphImageUrl);
	const faqJsonLd = buildInsightFaqJsonLd(insight.sections);

	return {
		insight,
		toc,
		frontlineCards,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd,
		articleJsonLd,
		faqJsonLd
	};
};
