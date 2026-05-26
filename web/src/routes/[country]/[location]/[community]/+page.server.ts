import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCommunityBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import { buildCanonicalPath } from '$lib/listing/canonicalPath';
import { buildLocationSeo } from '$lib/listing/seo';
import {
	communityBySlugQuery,
	countryBySlugQuery,
	fetchPublic,
	listingLegacyThreeSegmentPathQuery,
	locationBySlugQuery,
	propertyCardsByCommunityQuery
} from '$lib/sanity/queries';
import type { CountryBySlugQueryResult } from '$lib/sanity/types';

type LocationTaxonomyPage = LocationTaxonomyRef & {
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
};

type LegacyPathRow = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
};

const COMMUNITY_LISTINGS_PAGE_SIZE = 24;

export const load: PageServerLoad = async ({ params, url }) => {
	const [country, location, community] = await Promise.all([
		fetchPublic<CountryBySlugQueryResult>(countryBySlugQuery, {
			params: { countrySlug: params.country }
		}),
		fetchPublic<LocationTaxonomyPage | null>(locationBySlugQuery, {
			params: { countrySlug: params.country, locationSlug: params.location }
		}),
		fetchPublic<LocationTaxonomyPage | null>(communityBySlugQuery, {
			params: {
				countrySlug: params.country,
				locationSlug: params.location,
				communitySlug: params.community
			}
		})
	]);

	if (!country?.slug || !location?.slug) {
		error(404, 'Community not found.');
	}

	if (community?.slug && community.name) {
		return loadCommunityPage(country, location, community, params, url.origin);
	}

	const legacyMatches = await fetchPublic<LegacyPathRow[]>(listingLegacyThreeSegmentPathQuery, {
		params: {
			countrySlug: params.country,
			locationSlug: params.location,
			slug: params.community
		}
	});

	if (legacyMatches?.length === 1) {
		const canonicalPath = buildCanonicalPath(legacyMatches[0]);
		if (canonicalPath) {
			redirect(301, canonicalPath);
		}
	}

	error(404, 'Community not found.');
};

async function loadCommunityPage(
	country: NonNullable<CountryBySlugQueryResult>,
	location: LocationTaxonomyPage,
	community: LocationTaxonomyPage,
	params: { country: string; location: string; community: string },
	siteOrigin: string
) {
	const listings = await fetchPublic<unknown[]>(propertyCardsByCommunityQuery, {
		params: {
			countrySlug: params.country,
			locationSlug: params.location,
			communitySlug: params.community,
			start: 0,
			end: COMMUNITY_LISTINGS_PAGE_SIZE
		}
	});

	const canonicalPath = `/${country.slug}/${location.slug}/${community.slug}`;
	const canonicalUrl = `${siteOrigin}${canonicalPath}`;
	const breadcrumbs = buildCommunityBreadcrumbs(country, location, community, canonicalPath);
	const seo = buildLocationSeo(
		{
			name: community.name!,
			seoTitle: community.seoTitle,
			metaDescription: community.metaDescription,
			publicDescription: community.publicDescription
		},
		canonicalUrl
	);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, siteOrigin);

	return {
		pageType: 'community' as const,
		country,
		location,
		community,
		listings: listings ?? [],
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
}
