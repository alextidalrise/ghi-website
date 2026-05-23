import { error, redirect } from '@sveltejs/kit';
import { fetchPublic } from '$lib/sanity/queries';
import { buildCanonicalPath } from './canonicalPath';

const GHI_ID_PATTERN = /^GHI[0-9]{5}$/;

type CanonicalPathRow = {
	countrySlug?: string | null;
	areaSlug?: string | null;
	slug?: string | null;
};

export async function redirectToCanonicalFromGhiId(
	ghiId: string,
	query: string,
	notFoundMessage = 'Listing not found.'
): Promise<never> {
	if (!GHI_ID_PATTERN.test(ghiId)) {
		error(404, notFoundMessage);
	}

	const listing = await fetchPublic<CanonicalPathRow | null>(query, {
		params: { ghiId }
	});

	const canonicalPath = listing ? buildCanonicalPath(listing) : null;

	if (!canonicalPath) {
		error(404, notFoundMessage);
	}

	redirect(301, canonicalPath);
}
