import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '$lib/listing/breadcrumbs';
import { parseListingSearchParams } from '$lib/listing/searchParams';
import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
import {
	fetchFrontlineCourseOptions,
	fetchFrontlineHero,
	fetchListingCards
} from '$lib/sanity/queries';

const BASE_PATH = FRONTLINE_COLLECTION_PATH;

export const load: PageServerLoad = async ({ url }) => {
	const searchParams = parseListingSearchParams(url);
	const canonicalUrl = `${url.origin}${BASE_PATH}`;

	const [listingResults, courseOptions, hero] = await Promise.all([
		fetchListingCards({
			scope: { type: 'global' },
			// The whole collection is frontline golf — pin it server-side rather than
			// exposing the generic golf-relevance filter. User facets (course, price,
			// type, beds, sort) still apply on top.
			params: { ...searchParams, golfRelevance: ['frontline_golf'] }
		}),
		fetchFrontlineCourseOptions(),
		fetchFrontlineHero()
	]);

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'Front Line Collection', href: BASE_PATH }
	];

	const seo = {
		title: 'Frontline Golf Homes | Golf Homes International',
		description:
			'Every property on the first line of a golf course, across Spain and Portugal. Filter the frontline collection by golf course, price, property type and bedrooms.',
		canonicalUrl,
		noindex: false
	};

	return {
		basePath: BASE_PATH,
		searchParams,
		listingResults,
		courseOptions,
		hero,
		breadcrumbs,
		seo,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};
