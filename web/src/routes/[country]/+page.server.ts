import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCountryBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import { withPreviewLocationSeo } from '$lib/listing/detailPage';
import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
import { buildLocationSeo } from '$lib/listing/seo';
import { loadReviews } from '$lib/reviews';
import {
	countryBySlugQuery,
	fetchCountryFeaturedListingCards,
	fetchCountryFeaturedLocations,
	fetchCountryListingFacetRows,
	fetchCountryNavCommunities,
	fetchFeatureFilterSettings,
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

export const load: PageServerLoad = async ({
	params,
	url,
	fetch,
	locals: { preview, loadQuery }
}) => {
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

	const [
		locations,
		featuredCards,
		frontlineCards,
		featuredLocations,
		communities,
		facetRows,
		featureFilter
	] = await Promise.all([
		fetchPublic<LocationTaxonomyPage[]>(locationsByCountryQuery, {
			params: { countrySlug: params.country }
		}),
		fetchCountryFeaturedListingCards({ countrySlug: params.country }),
		fetchFrontlineListingCards({
			scope: { type: 'country', countrySlug: params.country }
		}),
		fetchCountryFeaturedLocations({ countrySlug: params.country }),
		fetchCountryNavCommunities(params.country),
		fetchCountryListingFacetRows(params.country),
		fetchFeatureFilterSettings()
	]);

	/* Taxonomy the country-scoped search bar consumes. Locations arrive without a country
	   slug (they were queried under one already), so stamp it on for the bar's shape. */
	const searchLocations = (locations ?? []).flatMap((location) =>
		location._id && location.name && location.slug
			? [
					{
						_id: location._id,
						name: location.name,
						slug: location.slug,
						countrySlug: country.slug
					}
				]
			: []
	);

	const frontlineViewAllHref = FRONTLINE_COLLECTION_PATH;

	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildCountryBreadcrumbs(country, canonicalPath);
	const seo = preview
		? withPreviewLocationSeo(buildLocationSeo(country, canonicalUrl))
		: buildLocationSeo(country, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	const reviews = await loadReviews(fetch);

	return {
		pageType: 'country' as const,
		location: country,
		locations: locations ?? [],
		featuredLocations,
		featuredCards,
		frontlineCards,
		frontlineViewAllHref,
		reviews,
		// Country-scoped taxonomy for the search bar (country selector omitted; the country
		// is fixed to this page's subject).
		searchLocations,
		searchCommunities: communities,
		searchFacetRows: facetRows,
		featureFilter,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
