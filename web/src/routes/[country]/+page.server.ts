import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCountryBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import { buildLocationSeo } from '$lib/listing/seo';
import { countryBySlugQuery, fetchPublic, locationsByCountryQuery } from '$lib/sanity/queries';
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

	const locations = await fetchPublic<LocationTaxonomyPage[]>(locationsByCountryQuery, {
		params: { countrySlug: params.country }
	});

	const canonicalPath = `/${country.slug}`;
	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildCountryBreadcrumbs(country, canonicalPath);
	const seo = buildLocationSeo(country, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'country' as const,
		location: country,
		locations: locations ?? [],
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
