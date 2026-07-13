import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { handleListingEnquiry } from '$lib/listing/enquiryAction';
import { buildUnitDetailPageData, type UnitPathParams } from '$lib/listing/detailPage';
import { loadReviews } from '$lib/reviews';
import {
	fetchPublicUnit,
	fetchSimilarListingCards,
	unitByDevPathPreviewQuery,
	unitByDevPathQuery
} from '$lib/sanity/queries';
import { toPublicUnitListing, type RawUnitListing } from '$lib/sanity/transforms';

// The enquiry rail on nested unit pages posts here.
export const actions: Actions = {
	enquire: (event) => handleListingEnquiry(event)
};

/** Reviews fetched in parallel with the unit; see the sibling routes for the reasoning. */
export const load: PageServerLoad = async (event) => {
	const [listing, reviews] = await Promise.all([loadListing(event), loadReviews(event.fetch)]);
	return { ...listing, reviews };
};

const loadListing = async ({ params, url, locals }: Parameters<PageServerLoad>[0]) => {
	const queryParams = {
		countrySlug: params.country,
		locationSlug: params.location,
		communitySlug: params.community,
		developmentSlug: params.slug,
		unitSlug: params.unit
	};

	const pathParams: UnitPathParams = {
		countrySlug: params.country,
		locationSlug: params.location,
		communitySlug: params.community,
		developmentSlug: params.slug,
		unitSlug: params.unit
	};

	if (locals.preview) {
		// Units are synthesized from three documents, so field-level live overlay is out
		// of scope; render the draft statically instead.
		const initial = await locals.loadQuery<RawUnitListing | null>(
			unitByDevPathPreviewQuery,
			queryParams
		);
		const resolved = toPublicUnitListing(initial.data);
		if (!resolved) {
			error(404, 'Unit not found.');
		}

		return {
			preview: true as const,
			...buildUnitDetailPageData(resolved.listing, resolved.context, url.origin, pathParams, {
				preview: true,
				skipRedirect: true,
				similarCards: []
			})
		};
	}

	const resolved = await fetchPublicUnit(unitByDevPathQuery, { params: queryParams });
	if (!resolved) {
		error(404, 'Unit not found.');
	}

	const similarCards = await fetchSimilarListingCards({
		listingId: resolved.listing._id!,
		mode: resolved.listing.related?.similarPropertiesMode,
		propertyType: resolved.listing.propertyType,
		location: resolved.listing.location
	});

	return {
		preview: false as const,
		...buildUnitDetailPageData(resolved.listing, resolved.context, url.origin, pathParams, {
			similarCards
		})
	};
};
