import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCanonicalPath } from '$lib/listing/canonicalPath';
import {
	communitiesByLocationQuery,
	fetchPublic,
	listingLegacyThreeSegmentPathQuery,
	locationBySlugQuery
} from '$lib/sanity/queries';

type LegacyPathRow = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
};

type CommunityRow = {
	slug?: string | null;
};

/** Redirect legacy community-page URLs to filtered location pages; preserve listing slug fallback. */
export const load: PageServerLoad = async ({ params, url, locals: { preview } }) => {
	if (preview) {
		error(404, 'Community pages are no longer available in preview for this path.');
	}

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
