import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildLocationBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import { buildLocationSeo } from '$lib/listing/seo';
import {
	communitiesByLocationQuery,
	countryBySlugQuery,
	fetchPublic,
	locationBySlugQuery
} from '$lib/sanity/queries';
import type { CountryBySlugQueryResult } from '$lib/sanity/types';

type LocationTaxonomyPage = LocationTaxonomyRef & {
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
};

type CommunityTaxonomyRow = LocationTaxonomyPage & {
	canonicalLocationSlug?: string | null;
	isAssociated?: boolean | null;
};

export const load: PageServerLoad = async ({ params, url }) => {
	const [country, location] = await Promise.all([
		fetchPublic<CountryBySlugQueryResult>(countryBySlugQuery, {
			params: { countrySlug: params.country }
		}),
		fetchPublic<LocationTaxonomyPage | null>(locationBySlugQuery, {
			params: { countrySlug: params.country, locationSlug: params.location }
		})
	]);

	if (!country?.slug || !location?.slug || !location._id || !location.name) {
		error(404, 'Location not found.');
	}

	const communities = await fetchPublic<CommunityTaxonomyRow[]>(communitiesByLocationQuery, {
		params: { locationId: location._id }
	});

	const directCommunities = (communities ?? []).filter((community) => !community.isAssociated);
	const associatedCommunities = (communities ?? []).filter((community) => community.isAssociated);

	const canonicalPath = `/${country.slug}/${location.slug}`;
	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildLocationBreadcrumbs(country, location, canonicalPath);
	const seo = buildLocationSeo(
		{
			name: location.name,
			seoTitle: location.seoTitle,
			metaDescription: location.metaDescription,
			publicDescription: location.publicDescription
		},
		canonicalUrl
	);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'location' as const,
		location,
		country,
		directCommunities,
		associatedCommunities,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
