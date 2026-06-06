import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildLocationBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { withPreviewLocationSeo } from '$lib/listing/detailPage';
import {
	DEFAULT_LISTING_SEARCH_PARAMS,
	buildListingSearchHref,
	parseListingSearchParams
} from '$lib/listing/searchParams';
import { buildFilteredLocationSeo, buildLocationSeo } from '$lib/listing/seo';
import {
	communitiesByLocationQuery,
	countryBySlugQuery,
	fetchFrontlineListingCards,
	fetchListingCards,
	fetchMaybePreview,
	fetchPublic,
	golfCoursesByLocationQuery,
	locationPageContextQuery
} from '$lib/sanity/queries';
import { toGolfCourseCards, type RawGolfCourse } from '$lib/sanity/transforms';
import { buildLocationGridIds } from '$lib/sanity/queries/listingSearch';
import { resolveTaxonomyHero } from '$lib/sanity/transforms/taxonomyHero';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';
import type { CountryBySlugQueryResult } from '$lib/sanity/types';

type LinkedLocationEntry = {
	includeInGrid?: boolean | null;
	showLink?: boolean | null;
	location?: {
		_id?: string;
		name?: string | null;
		slug?: string | null;
		breadcrumbLabel?: string | null;
	} | null;
};

type LocationPageContext = {
	_id: string;
	name: string;
	slug: string;
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
	overviewHeading?: string | null;
	heroImage?: MediaAssetInput | null;
	tagline?: string | null;
	linkedLocations?: LinkedLocationEntry[] | null;
};

type CommunityTaxonomyRow = {
	_id: string;
	name?: string | null;
	slug?: string | null;
	publicDescription?: string | null;
	isAssociated?: boolean | null;
};

export const load: PageServerLoad = async ({ params, url, locals: { preview, loadQuery } }) => {
	const [country, locationPage] = await Promise.all([
		fetchMaybePreview<CountryBySlugQueryResult>(
			countryBySlugQuery,
			{ countrySlug: params.country },
			loadQuery,
			preview
		),
		fetchMaybePreview<LocationPageContext | null>(
			locationPageContextQuery,
			{ countrySlug: params.country, locationSlug: params.location },
			loadQuery,
			preview
		)
	]);

	if (!country?.slug || !locationPage?.slug || !locationPage._id || !locationPage.name) {
		error(404, 'Location not found.');
	}

	const parsedSearchParams = parseListingSearchParams(url);
	const canonicalPath = `/${country.slug}/${locationPage.slug}`;
	const unfilteredCanonicalUrl = `${url.origin}${canonicalPath}`;

	const [communities, linkedLocations, golfCoursesRaw] = await Promise.all([
		fetchPublic<CommunityTaxonomyRow[]>(communitiesByLocationQuery, {
			params: { locationId: locationPage._id }
		}),
		Promise.resolve(locationPage.linkedLocations ?? []),
		fetchPublic<RawGolfCourse[]>(golfCoursesByLocationQuery, {
			params: { locationId: locationPage._id }
		})
	]);

	const allowedCommunities = communities ?? [];
	const activeCommunity =
		parsedSearchParams.community != null
			? (allowedCommunities.find((community) => community.slug === parsedSearchParams.community) ??
				null)
			: null;

	const searchParams = activeCommunity
		? parsedSearchParams
		: { ...parsedSearchParams, community: null };

	const locationIds = buildLocationGridIds(locationPage._id, linkedLocations);
	const listingScope = {
		type: 'location' as const,
		countrySlug: params.country,
		locationSlug: params.location,
		locationIds,
		communityId: activeCommunity?._id ?? null
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

	const directCommunities = allowedCommunities.filter((community) => !community.isAssociated);
	const associatedCommunities = allowedCommunities.filter((community) => community.isAssociated);
	const relatedAreaLinks = linkedLocations.filter(
		(entry) => entry.showLink && entry.location?.slug && entry.location?.name
	);
	const golfCourseCards = toGolfCourseCards(golfCoursesRaw);

	const breadcrumbs = buildLocationBreadcrumbs(country, locationPage, canonicalPath);
	const seoBase =
		activeCommunity?.name != null
			? buildFilteredLocationSeo(
					locationPage,
					{ name: activeCommunity.name, publicDescription: activeCommunity.publicDescription },
					unfilteredCanonicalUrl
				)
			: buildLocationSeo(locationPage, unfilteredCanonicalUrl);
	const seo = preview ? withPreviewLocationSeo(seoBase) : seoBase;
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'location' as const,
		location: locationPage,
		locationHero: resolveTaxonomyHero(locationPage),
		country,
		activeCommunity,
		directCommunities,
		associatedCommunities,
		relatedAreaLinks,
		canonicalPath,
		searchParams,
		listingResults,
		frontlineCards,
		frontlineViewAllHref,
		golfCourseCards,
		canonicalUrl: seo.canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
