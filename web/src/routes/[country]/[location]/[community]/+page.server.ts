import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	buildDevelopmentDetailPageData,
	buildPropertyDetailPageData,
	type ListingPathParams
} from '$lib/listing/detailPage';
import { buildCanonicalPath } from '$lib/listing/canonicalPath';
import { loadReviews } from '$lib/reviews';
import {
	catchAllCommunityInLocationQuery,
	communitiesByLocationQuery,
	developmentByCatchAllPathPreviewQuery,
	developmentByCatchAllPathQuery,
	fetchPublic,
	fetchPublicDevelopment,
	fetchPublicProperty,
	fetchSimilarListingCards,
	listingLegacyThreeSegmentPathQuery,
	locationBySlugQuery,
	propertyByCatchAllPathPreviewQuery,
	propertyByCatchAllPathQuery
} from '$lib/sanity/queries';
import {
	toPublicDevelopment,
	toPublicPropertyListing,
	type RawDevelopment,
	type RawPropertyListing
} from '$lib/sanity/transforms';

type LegacyPathRow = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
	isCatchAll?: boolean | null;
};

type CommunityRow = {
	slug?: string | null;
};

function catchAllPathParams(
	countrySlug: string,
	locationSlug: string,
	listingSlug: string
): ListingPathParams {
	return { countrySlug, locationSlug, slug: listingSlug };
}

/** Resolve community redirects, catch-all listings, and legacy listing fallbacks at 3 segments. */
/**
 * Reviews load alongside the listing, never after it — a separate origin must not add its
 * latency to the page's. A failure resolves to null and the section omits itself, so the
 * listing is never held hostage to a reviews outage.
 *
 * This wraps the listing loader rather than threading `reviews` through its many return
 * points (property / development / preview / catch-all), which is how the development page
 * got missed the first time round.
 */
export const load: PageServerLoad = async (event) => {
	const [listing, reviews] = await Promise.all([loadListing(event), loadReviews(event.fetch)]);
	return { ...listing, reviews };
};

const loadListing = async ({
	params,
	url,
	locals: { preview, loadQuery }
}: Parameters<PageServerLoad>[0]) => {
	const location = await fetchPublic<{ _id?: string; slug?: string | null } | null>(
		locationBySlugQuery,
		{
			params: { countrySlug: params.country, locationSlug: params.location }
		}
	);

	if (!location?._id || !location.slug) {
		error(404, 'Not found.');
	}

	const communities = await fetchPublic<CommunityRow[]>(communitiesByLocationQuery, {
		params: { locationId: location._id }
	});

	const communityMatch = (communities ?? []).find(
		(community) => community.slug === params.community
	);

	if (communityMatch?.slug) {
		const target = new URL(`/${params.country}/${params.location}`, url.origin);
		target.searchParams.set('community', communityMatch.slug);
		redirect(301, `${target.pathname}${target.search}`);
	}

	if (preview) {
		return loadCatchAllPreview(
			{
				countrySlug: params.country,
				locationSlug: params.location,
				slug: params.community
			},
			url.origin,
			loadQuery
		);
	}

	const pathParams = catchAllPathParams(params.country, params.location, params.community);

	const property = await fetchPublicProperty(propertyByCatchAllPathQuery, {
		params: {
			countrySlug: params.country,
			locationSlug: params.location,
			slug: params.community
		}
	});

	if (property) {
		const similarCards = await fetchSimilarListingCards({
			listingId: property._id!,
			mode: property.related?.similarPropertiesMode,
			propertyType: property.propertyType,
			location: property.location
		});

		return {
			preview: false as const,
			...buildPropertyDetailPageData(property, url.origin, pathParams, { similarCards })
		};
	}

	const development = await fetchPublicDevelopment(developmentByCatchAllPathQuery, {
		params: {
			countrySlug: params.country,
			locationSlug: params.location,
			slug: params.community
		}
	});

	if (development) {
		const similarCards = await fetchSimilarListingCards({
			listingId: development._id!,
			mode: development.related?.similarPropertiesMode,
			kind: 'development',
			location: development.location
		});

		return {
			preview: false as const,
			...buildDevelopmentDetailPageData(development, url.origin, pathParams, { similarCards })
		};
	}

	const catchAllCommunity = await fetchPublic<{ slug?: string | null } | null>(
		catchAllCommunityInLocationQuery,
		{
			params: { locationId: location._id, communitySlug: params.community }
		}
	);

	if (catchAllCommunity?.slug) {
		redirect(301, `/${params.country}/${params.location}`);
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

	error(404, 'Not found.');
};

async function loadCatchAllPreview(
	pathParams: ListingPathParams,
	siteOrigin: string,
	loadQuery: App.Locals['loadQuery']
) {
	const propertyInitial = await loadQuery<RawPropertyListing | null>(
		propertyByCatchAllPathPreviewQuery,
		{
			countrySlug: pathParams.countrySlug,
			locationSlug: pathParams.locationSlug,
			slug: pathParams.slug
		}
	);

	const property = toPublicPropertyListing(propertyInitial.data);
	if (property) {
		const detail = buildPropertyDetailPageData(property, siteOrigin, pathParams, {
			preview: true,
			skipRedirect: true,
			similarCards: []
		});

		return {
			preview: true as const,
			previewQuery: propertyByCatchAllPathPreviewQuery,
			queryParams: {
				countrySlug: pathParams.countrySlug,
				locationSlug: pathParams.locationSlug,
				slug: pathParams.slug
			},
			listingInitial: propertyInitial,
			...detail
		};
	}

	const developmentInitial = await loadQuery<RawDevelopment | null>(
		developmentByCatchAllPathPreviewQuery,
		{
			countrySlug: pathParams.countrySlug,
			locationSlug: pathParams.locationSlug,
			slug: pathParams.slug
		}
	);

	const development = toPublicDevelopment(developmentInitial.data);
	if (development) {
		// Fetched separately from the live Presentation query (see the [slug] route note);
		// renders on load, does not hot-update while editing.
		const similarCards = await fetchSimilarListingCards({
			listingId: development._id!,
			mode: development.related?.similarPropertiesMode,
			kind: 'development',
			location: development.location
		});
		const detail = buildDevelopmentDetailPageData(development, siteOrigin, pathParams, {
			preview: true,
			skipRedirect: true,
			similarCards
		});

		return {
			preview: true as const,
			previewQuery: developmentByCatchAllPathPreviewQuery,
			queryParams: {
				countrySlug: pathParams.countrySlug,
				locationSlug: pathParams.locationSlug,
				slug: pathParams.slug
			},
			listingInitial: developmentInitial,
			...detail
		};
	}

	error(404, 'Listing not found.');
}
