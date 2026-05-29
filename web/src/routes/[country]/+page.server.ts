import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCountryBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import {
	DEFAULT_LISTING_SEARCH_PARAMS,
	buildListingSearchHref
} from '$lib/listing/searchParams';
import { buildLocationSeo } from '$lib/listing/seo';
import {
	countryBySlugQuery,
	fetchCountryFeaturedListingCards,
	fetchFrontlineListingCards,
	fetchPublic,
	locationsByCountryQuery
} from '$lib/sanity/queries';
import type { CountryBySlugQueryResult } from '$lib/sanity/types';

type LocationTaxonomyPage = LocationTaxonomyRef & {
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
};

export const load: PageServerLoad = async ({ params, url }) => {
	const country = await fetchPublic<CountryBySlugQueryResult>(countryBySlugQuery, {
		params: { countrySlug: params.country }
	});

	if (!country?.slug) {
		error(404, 'Location not found.');
	}

	const canonicalPath = `/${country.slug}`;

	const [locations, featuredCards, frontlineCards] = await Promise.all([
		fetchPublic<LocationTaxonomyPage[]>(locationsByCountryQuery, {
			params: { countrySlug: params.country }
		}),
		fetchCountryFeaturedListingCards({ countrySlug: params.country }),
		fetchFrontlineListingCards({
			scope: { type: 'country', countrySlug: params.country }
		})
	]);

	const frontlineViewAllHref = buildListingSearchHref(
		canonicalPath,
		DEFAULT_LISTING_SEARCH_PARAMS,
		{ golfRelevance: ['frontline_golf'] }
	);

	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildCountryBreadcrumbs(country, canonicalPath);
	const seo = buildLocationSeo(country, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'country' as const,
		location: country,
		locations: locations ?? [],
		featuredCards,
		frontlineCards,
		frontlineViewAllHref,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
