import type { LayoutServerLoad } from './$types';
import { fetchNavTaxonomy } from '$lib/sanity/queries';

export const load: LayoutServerLoad = async ({ locals: { preview } }) => {
	const nav = await fetchNavTaxonomy();

	return { preview, nav };
};
