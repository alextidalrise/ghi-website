import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '$lib/listing/breadcrumbs';
import { parseListingSearchParams } from '$lib/listing/searchParams';
import { hasIndexAffectingQuery } from '$lib/seo/indexability';
import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
import {
	fetchFrontlineContent,
	fetchFrontlineCourseOptions,
	fetchFrontlineHero,
	fetchListingCards
} from '$lib/sanity/queries';
import { resolveFrontlineContent } from '$lib/sanity/transforms/pageContent';

const BASE_PATH = FRONTLINE_COLLECTION_PATH;

export const load: PageServerLoad = async ({ url }) => {
	const searchParams = parseListingSearchParams(url);
	const canonicalUrl = `${url.origin}${BASE_PATH}`;

	const [listingResults, courseOptions, hero, rawContent] = await Promise.all([
		fetchListingCards({
			scope: { type: 'global' },
			params: { ...searchParams, golfRelevance: ['frontline_golf'] }
		}),
		fetchFrontlineCourseOptions(),
		fetchFrontlineHero(),
		fetchFrontlineContent()
	]);

	const content = resolveFrontlineContent(rawContent);

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'Front Line Collection', href: BASE_PATH }
	];

	const title = content.seo?.seoTitle?.trim() || 'Frontline Golf Homes | Golf Homes International';
	const description =
		content.seo?.metaDescription?.trim() ||
		'Every property on the first line of a golf course, across Spain and Portugal. Filter the frontline collection by golf course, price, property type and bedrooms.';
	const seo = {
		title,
		description,
		ogTitle: content.seo?.openGraphTitle?.trim() || title,
		ogDescription: content.seo?.openGraphDescription?.trim() || description,
		canonicalUrl,
		noindex: content.seo?.noindex ?? false
	};

	if (hasIndexAffectingQuery(searchParams)) {
		seo.noindex = true;
	}

	return {
		basePath: BASE_PATH,
		searchParams,
		listingResults,
		courseOptions,
		hero,
		content,
		breadcrumbs,
		seo,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};
