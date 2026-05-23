import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildAreaBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { buildLocationSeo } from '$lib/listing/seo';
import { areaBySlugQuery, countryBySlugQuery, fetchPublic } from '$lib/sanity/queries';
import type { AreaBySlugQueryResult, CountryBySlugQueryResult } from '$lib/sanity/types';

export const load: PageServerLoad = async ({ params, url }) => {
	const [country, area] = await Promise.all([
		fetchPublic<CountryBySlugQueryResult>(countryBySlugQuery, {
			params: { countrySlug: params.country }
		}),
		fetchPublic<AreaBySlugQueryResult>(areaBySlugQuery, {
			params: { countrySlug: params.country, areaSlug: params.area }
		})
	]);

	if (!country?.slug || !area?.slug) {
		error(404, 'Location not found.');
	}

	const canonicalPath = `/${country.slug}/${area.slug}`;
	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildAreaBreadcrumbs(country, area, canonicalPath);
	const seo = buildLocationSeo(area, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'area' as const,
		location: area,
		country,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
