import type { PageServerLoad } from './$types';
import { redirectToCanonicalFromGhiId } from '$lib/listing/ghiPermalink';
import { developmentByGhiIdQuery } from '$lib/sanity/queries';

export const load: PageServerLoad = async ({ params }) => {
	await redirectToCanonicalFromGhiId(params.ghiId, developmentByGhiIdQuery, 'Development not found.');
};
