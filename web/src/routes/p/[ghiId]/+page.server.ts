import type { PageServerLoad } from './$types';
import { redirectToCanonicalFromGhiId } from '$lib/listing/ghiPermalink';
import { propertyByGhiIdQuery } from '$lib/sanity/queries';

export const load: PageServerLoad = async ({ params }) => {
	await redirectToCanonicalFromGhiId(params.ghiId, propertyByGhiIdQuery, 'Property not found.');
};
