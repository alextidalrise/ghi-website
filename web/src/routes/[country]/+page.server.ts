import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCountryBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import { withPreviewLocationSeo } from '$lib/listing/detailPage';
import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
import { buildLocationSeo } from '$lib/listing/seo';
import {
	countryBySlugQuery,
	fetchCountryFeaturedListingCards,
	fetchCountryFeaturedLocations,
	fetchFrontlineListingCards,
	fetchMaybePreview,
	fetchPublic,
	locationsByCountryQuery
} from '$lib/sanity/queries';
import type { CountryBySlugQueryResult } from '$lib/sanity/types';

type LocationTaxonomyPage = LocationTaxonomyRef & {
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
};

export const load: PageServerLoad = async ({ params, url, locals: { preview, loadQuery } }) => {
	const country = await fetchMaybePreview<CountryBySlugQueryResult>(
		countryBySlugQuery,
		{ countrySlug: params.country },
		loadQuery,
		preview
	);

	if (!country?.slug) {
		error(404, 'Location not found.');
	}

	const canonicalPath = `/${country.slug}`;

	const [locations, featuredCards, frontlineCards, featuredLocations] = await Promise.all([
		fetchPublic<LocationTaxonomyPage[]>(locationsByCountryQuery, {
			params: { countrySlug: params.country }
		}),
		fetchCountryFeaturedListingCards({ countrySlug: params.country }),
		fetchFrontlineListingCards({
			scope: { type: 'country', countrySlug: params.country }
		}),
		fetchCountryFeaturedLocations({ countrySlug: params.country })
	]);

	const frontlineViewAllHref = FRONTLINE_COLLECTION_PATH;

	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildCountryBreadcrumbs(country, canonicalPath);
	const seo = preview
		? withPreviewLocationSeo(buildLocationSeo(country, canonicalUrl))
		: buildLocationSeo(country, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'country' as const,
		location: country,
		locations: locations ?? [],
		featuredLocations,
		featuredCards,
		frontlineCards,
		frontlineViewAllHref,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
