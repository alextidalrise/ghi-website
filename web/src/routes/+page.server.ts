import type { PageServerLoad } from './$types';
import {
	fetchHomepageFeaturedListingCards,
	fetchHomepageFrontlineListingCards
} from '$lib/sanity/queries';

export const load: PageServerLoad = async ({ parent }) => {
	const { nav } = await parent();

	const [featuredCards, frontlineCards] = await Promise.all([
		fetchHomepageFeaturedListingCards(),
		fetchHomepageFrontlineListingCards()
	]);

	return {
		countries: nav.countries,
		locations: nav.locations,
		communities: nav.communities,
		featuredCards,
		frontlineCards
	};
};
