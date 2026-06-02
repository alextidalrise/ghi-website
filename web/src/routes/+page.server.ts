import type { PageServerLoad } from './$types';
// DEV MOCK: live fetches disabled for offline design work (local Sanity returns 403).
// To restore: uncomment the import + Promise.all block below, delete the mock import
// and the two mock assignments, then delete src/lib/home/mockListings.ts.
// import {
// 	fetchHomepageFeaturedListingCards,
// 	fetchHomepageFrontlineListingCards
// } from '$lib/sanity/queries';
import { MOCK_FEATURED_CARDS, MOCK_FRONTLINE_CARDS } from '$lib/home/mockListings';

export const load: PageServerLoad = async ({ parent }) => {
	const { nav } = await parent();

	// const [featuredCards, frontlineCards] = await Promise.all([
	// 	fetchHomepageFeaturedListingCards(),
	// 	fetchHomepageFrontlineListingCards()
	// ]);
	const featuredCards = MOCK_FEATURED_CARDS;
	const frontlineCards = MOCK_FRONTLINE_CARDS;

	return {
		countries: nav.countries,
		locations: nav.locations,
		communities: nav.communities,
		featuredCards,
		frontlineCards
	};
};
