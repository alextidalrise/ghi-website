import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildLocationBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import { withPreviewLocationSeo } from '$lib/listing/detailPage';
import {
	DEFAULT_LISTING_SEARCH_PARAMS,
	buildListingSearchHref,
	parseListingSearchParams
} from '$lib/listing/searchParams';
import { buildLocationSeo } from '$lib/listing/seo';
import {
	communitiesByLocationQuery,
	countryBySlugQuery,
	fetchFrontlineListingCards,
	fetchListingCards,
	fetchMaybePreview,
	fetchPublic,
	locationBySlugQuery
} from '$lib/sanity/queries';
import type { CountryBySlugQueryResult } from '$lib/sanity/types';

type LocationTaxonomyPage = LocationTaxonomyRef & {
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
};

type ResolvedLocationPage = LocationTaxonomyPage & {
	_id: string;
	name: string;
	slug: string;
};

type CommunityTaxonomyRow = LocationTaxonomyPage & {
	canonicalLocationSlug?: string | null;
	isAssociated?: boolean | null;
};

export const load: PageServerLoad = async ({ params, url, locals: { preview, loadQuery } }) => {
	const [country, location] = await Promise.all([
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
		)
	]);

	if (!country?.slug || !location?.slug || !location._id || !location.name) {
		error(404, 'Location not found.');
	}

	const locationPage: ResolvedLocationPage = {
		...location,
		_id: location._id,
		name: location.name,
		slug: location.slug
	};

	const searchParams = parseListingSearchParams(url);
	const canonicalPath = `/${country.slug}/${locationPage.slug}`;

	const listingScope = {
		type: 'location' as const,
		countrySlug: params.country,
		locationSlug: params.location
	};

	const [communities, listingResults, frontlineCards] = await Promise.all([
		fetchPublic<CommunityTaxonomyRow[]>(communitiesByLocationQuery, {
			params: { locationId: locationPage._id }
		}),
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

	const directCommunities = (communities ?? []).filter((community) => !community.isAssociated);
	const associatedCommunities = (communities ?? []).filter((community) => community.isAssociated);

	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildLocationBreadcrumbs(country, locationPage, canonicalPath);
	const seo = preview
		? withPreviewLocationSeo(
				buildLocationSeo(
					{
						name: locationPage.name,
						seoTitle: locationPage.seoTitle,
						metaDescription: locationPage.metaDescription,
						publicDescription: locationPage.publicDescription
					},
					canonicalUrl
				)
			)
		: buildLocationSeo(
				{
					name: locationPage.name,
					seoTitle: locationPage.seoTitle,
					metaDescription: locationPage.metaDescription,
					publicDescription: locationPage.publicDescription
				},
				canonicalUrl
			);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'location' as const,
		location: locationPage,
		country,
		directCommunities,
		associatedCommunities,
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
};
