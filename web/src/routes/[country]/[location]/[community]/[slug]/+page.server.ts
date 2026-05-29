import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	buildDevelopmentDetailPageData,
	buildPropertyDetailPageData,
	type ListingPathParams
} from '$lib/listing/detailPage';
import {
	developmentByPathPreviewQuery,
	developmentByPathQuery,
	developmentStalePathQuery,
	fetchPublic,
	fetchPublicDevelopment,
	fetchPublicProperty,
	fetchSimilarListingCards,
	propertyByPathPreviewQuery,
	propertyByPathQuery,
	propertyStalePathQuery
} from '$lib/sanity/queries';
import { buildCanonicalPath, pathsMatch } from '$lib/listing/canonicalPath';
import {
	toPublicDevelopment,
	toPublicPropertyListing,
	type RawDevelopment,
	type RawPropertyListing
} from '$lib/sanity/transforms';

type StalePathRow = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
};

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const pathParams: ListingPathParams = {
		countrySlug: params.country,
		locationSlug: params.location,
		communitySlug: params.community,
		slug: params.slug
	};

	if (locals.preview) {
		return loadPreviewListing(pathParams, url.origin, locals.loadQuery);
	}

	return loadPublishedListing(pathParams, url.origin);
};

async function loadPreviewListing(
	pathParams: ListingPathParams,
	siteOrigin: string,
	loadQuery: App.Locals['loadQuery']
) {
	const propertyInitial = await loadQuery<RawPropertyListing | null>(
		propertyByPathPreviewQuery,
		pathParams
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
			previewQuery: propertyByPathPreviewQuery,
			queryParams: pathParams,
			listingInitial: propertyInitial,
			...detail
		};
	}

	const developmentInitial = await loadQuery<RawDevelopment | null>(
		developmentByPathPreviewQuery,
		pathParams
	);

	const development = toPublicDevelopment(developmentInitial.data);
	if (development) {
		const detail = buildDevelopmentDetailPageData(development, siteOrigin, pathParams, {
			preview: true,
			skipRedirect: true
		});

		return {
			preview: true as const,
			previewQuery: developmentByPathPreviewQuery,
			queryParams: pathParams,
			listingInitial: developmentInitial,
			...detail
		};
	}

	error(404, 'Listing not found.');
}

async function loadPublishedListing(pathParams: ListingPathParams, siteOrigin: string) {
	const { countrySlug, locationSlug, communitySlug, slug } = pathParams;

	const property = await fetchPublicProperty(propertyByPathQuery, {
		params: pathParams
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
			...buildPropertyDetailPageData(property, siteOrigin, pathParams, { similarCards })
		};
	}

	const stalePropertyMatches = await fetchPublic<StalePathRow[]>(propertyStalePathQuery, {
		params: { countrySlug, slug }
	});

	if (stalePropertyMatches?.length === 1) {
		const canonical = stalePropertyMatches[0];
		if (
			!pathsMatch({ countrySlug, locationSlug, communitySlug, slug }, canonical) &&
			buildCanonicalPath(canonical)
		) {
			redirect(301, buildCanonicalPath(canonical)!);
		}
	}

	const development = await fetchPublicDevelopment(developmentByPathQuery, {
		params: pathParams
	});

	if (development) {
		return {
			preview: false as const,
			...buildDevelopmentDetailPageData(development, siteOrigin, pathParams)
		};
	}

	const staleDevelopmentMatches = await fetchPublic<StalePathRow[]>(developmentStalePathQuery, {
		params: { countrySlug, slug }
	});

	if (staleDevelopmentMatches?.length === 1) {
		const canonical = staleDevelopmentMatches[0];
		if (
			!pathsMatch({ countrySlug, locationSlug, communitySlug, slug }, canonical) &&
			buildCanonicalPath(canonical)
		) {
			redirect(301, buildCanonicalPath(canonical)!);
		}
	}

	error(404, 'Listing not found.');
}
