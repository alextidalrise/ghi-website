import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { handleListingEnquiry } from '$lib/listing/enquiryAction';
import {
	buildDevelopmentDetailPageData,
	buildPropertyDetailPageData,
	buildUnitDetailPageData,
	type ListingPathParams,
	type UnitPathParams
} from '$lib/listing/detailPage';
import {
	developmentByPathPreviewQuery,
	developmentByPathQuery,
	developmentStalePathQuery,
	fetchPublic,
	fetchPublicDevelopment,
	fetchPublicProperty,
	fetchPublicUnit,
	fetchSimilarListingCards,
	propertyByPathPreviewQuery,
	propertyByPathQuery,
	propertyStalePathQuery,
	unitByCatchAllDevPathQuery
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

// The enquiry rail (property + development + catch-all unit) posts here.
export const actions: Actions = {
	enquire: (event) => handleListingEnquiry(event)
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
		// Similar cards come from a separate public fetch (not the live Presentation query),
		// so they render on first load but won't hot-update as picks change — parity with the
		// published path is worth more here than a blank rail while editing.
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
			previewQuery: developmentByPathPreviewQuery,
			queryParams: pathParams,
			listingInitial: developmentInitial,
			...detail
		};
	}

	// Units under a catch-all development are synthesized from three documents and have
	// no field-level overlay; they are not surfaced in Sanity Presentation preview. The
	// published path below resolves them normally.
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
		const similarCards = await fetchSimilarListingCards({
			listingId: development._id!,
			mode: development.related?.similarPropertiesMode,
			kind: 'development',
			location: development.location
		});

		return {
			preview: false as const,
			...buildDevelopmentDetailPageData(development, siteOrigin, pathParams, { similarCards })
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

	// Last fallback: a unit under a CATCH-ALL development surfaces here at four
	// segments (/{country}/{location}/{developmentSlug}/{unitSlug}), since the community
	// segment is omitted. Units nested under a standard development resolve in the
	// dedicated [slug]/[unit] route instead.
	const unit = await fetchPublicUnit(unitByCatchAllDevPathQuery, {
		params: {
			countrySlug,
			locationSlug,
			developmentSlug: communitySlug,
			unitSlug: slug
		}
	});

	if (unit) {
		const unitPathParams: UnitPathParams = {
			countrySlug: countrySlug!,
			locationSlug: locationSlug!,
			developmentSlug: communitySlug!,
			unitSlug: slug
		};
		const similarCards = await fetchSimilarListingCards({
			listingId: unit.listing._id!,
			mode: unit.listing.related?.similarPropertiesMode,
			propertyType: unit.listing.propertyType,
			location: unit.listing.location
		});

		return {
			preview: false as const,
			...buildUnitDetailPageData(unit.listing, unit.context, siteOrigin, unitPathParams, {
				similarCards
			})
		};
	}

	error(404, 'Listing not found.');
}
