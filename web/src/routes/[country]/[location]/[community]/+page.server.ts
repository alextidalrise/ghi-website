import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCommunityBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import { withPreviewLocationSeo } from '$lib/listing/detailPage';
import { buildCanonicalPath } from '$lib/listing/canonicalPath';
import {
	DEFAULT_LISTING_SEARCH_PARAMS,
	buildListingSearchHref,
	parseListingSearchParams
} from '$lib/listing/searchParams';
import { buildLocationSeo } from '$lib/listing/seo';
import {
	communityBySlugQuery,
	countryBySlugQuery,
	fetchFrontlineListingCards,
	fetchListingCards,
	fetchMaybePreview,
	fetchPublic,
	listingLegacyThreeSegmentPathQuery,
	locationBySlugQuery
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

export const load: PageServerLoad = async ({ params, url, locals: { preview, loadQuery } }) => {
	const [country, location, community] = await Promise.all([
		fetchMaybePreview<CountryBySlugQueryResult>(
			countryBySlugQuery,
			{ countrySlug: params.country },
			loadQuery,
			preview
		),
		fetchMaybePreview<LocationTaxonomyPage | null>(
			locationBySlugQuery,
			{ countrySlug: params.country, locationSlug: params.location },
			loadQuery,
			preview
		),
		fetchMaybePreview<LocationTaxonomyPage | null>(
			communityBySlugQuery,
			{
				countrySlug: params.country,
				locationSlug: params.location,
				communitySlug: params.community
			},
			loadQuery,
			preview
		)
	]);

	if (!country?.slug || !location?.slug) {
		error(404, 'Community not found.');
	}

	if (community?.slug && community.name) {
		return loadCommunityPage(country, location, community, params, url, preview);
	}

	if (preview) {
		error(404, 'Community not found.');
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
	url: URL,
	preview: boolean
) {
	const searchParams = parseListingSearchParams(url);
	const canonicalPath = `/${country.slug}/${location.slug}/${community.slug}`;
	const listingScope = {
		type: 'community' as const,
		countrySlug: params.country,
		locationSlug: params.location,
		communitySlug: params.community
	};

	const [listingResults, frontlineCards] = await Promise.all([
		fetchListingCards({
			scope: listingScope,
			params: searchParams
		}),
		fetchFrontlineListingCards({ scope: listingScope })
	]);

	const frontlineViewAllHref = buildListingSearchHref(
		canonicalPath,
		DEFAULT_LISTING_SEARCH_PARAMS,
		{ golfRelevance: ['frontline_golf'] }
	);

	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildCommunityBreadcrumbs(country, location, community, canonicalPath);
	const seo = preview
		? withPreviewLocationSeo(
				buildLocationSeo(
					{
						name: community.name!,
						seoTitle: community.seoTitle,
						metaDescription: community.metaDescription,
						publicDescription: community.publicDescription
					},
					canonicalUrl
				)
			)
		: buildLocationSeo(
				{
					name: community.name!,
					seoTitle: community.seoTitle,
					metaDescription: community.metaDescription,
					publicDescription: community.publicDescription
				},
				canonicalUrl
			);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'community' as const,
		country,
		location,
		community,
		canonicalPath,
		searchParams,
		listingResults,
		frontlineCards,
		frontlineViewAllHref,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
}
