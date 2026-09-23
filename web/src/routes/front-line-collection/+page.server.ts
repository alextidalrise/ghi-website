import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '$lib/listing/breadcrumbs';
import { parseListingSearchParams } from '$lib/listing/searchParams';
import { hasIndexAffectingQuery } from '$lib/seo/indexability';
import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
import {
	fetchFrontlineContent,
	fetchFrontlineCourseOptions,
	fetchFrontlineHero,
	fetchFrontlinePlaceOptions,
	fetchListingCards
} from '$lib/sanity/queries';
import { resolveFrontlineContent } from '$lib/sanity/transforms/pageContent';
import { addCacheTags } from '$lib/cache/tagContext';
import { cacheTag } from '$lib/cache/tags';

const BASE_PATH = FRONTLINE_COLLECTION_PATH;

export const load: PageServerLoad = async ({ url, locals }) => {
	// The grid is every curated collection member, so a frontline listing changing anywhere
	// (including its collection switch) must purge this page.
	addCacheTags(cacheTag.frontline);

	const searchParams = parseListingSearchParams(url);
	const canonicalUrl = `${url.origin}${BASE_PATH}`;
	const { rates } = await locals.exchangeRates;

	const [listingResults, courseOptions, placeOptions, hero, rawContent] = await Promise.all([
		fetchListingCards({
			scope: { type: 'frontlineCollection' },
			params: { ...searchParams, golfRelevance: ['frontline_golf'] },
			rates
		}),
		fetchFrontlineCourseOptions({ params: searchParams, rates }),
		fetchFrontlinePlaceOptions(),
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
		'A hand-picked collection of homes on the first line of a golf course, across every market we cover. Filter by country, location, price and golf course.';
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
		countryOptions: placeOptions.countryOptions,
		locationOptions: placeOptions.locationOptions,
		hero,
		content,
		breadcrumbs,
		seo,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};
