import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { fetchMaybePreview, guideBySlugQuery } from '$lib/sanity/queries';
import {
	buildGuideArticleJsonLd,
	buildGuideBreadcrumbs,
	buildGuideSeo,
	buildGuideToc,
	guidePath,
	resolveGuideHero
} from '$lib/guides';
import type { GuideDetail } from '$lib/guides';

export const load: PageServerLoad = async ({ params, url, locals: { preview, loadQuery } }) => {
	const guide = await fetchMaybePreview<GuideDetail>(
		guideBySlugQuery,
		{ slug: params.slug },
		loadQuery,
		preview
	);

	if (!guide?.slug) {
		error(404, 'Guide not found.');
	}

	const canonicalPath = guidePath(guide.slug);
	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildGuideBreadcrumbs(guide);
	const seoBase = buildGuideSeo(guide, canonicalUrl);
	// Draft preview pages must never be indexed.
	const seo = preview ? { ...seoBase, noindex: true } : seoBase;

	const guideHero = resolveGuideHero(guide);
	const toc = buildGuideToc(guide.sections);

	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);
	const articleJsonLd = buildGuideArticleJsonLd(
		guide,
		canonicalUrl,
		guideHero?.url ?? seo.openGraphImageUrl ?? null
	);

	return {
		guide,
		guideHero,
		toc,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd,
		articleJsonLd
	};
};
