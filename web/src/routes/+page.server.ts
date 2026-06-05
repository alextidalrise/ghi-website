import type { PageServerLoad } from './$types';
import {
	fetchCountriesWithHero,
	fetchHomepageFeaturedListingCards,
	fetchHomepageFeaturedLocations,
	fetchHomepageFrontlineListingCards,
	fetchSiteSettingsHero
} from '$lib/sanity/queries';
import { resolveHomepageHeroImage } from '$lib/sanity/transforms/taxonomyHero';

export const load: PageServerLoad = async ({ parent }) => {
	const { nav } = await parent();

	const [featuredCards, frontlineCards, homepageHero, featuredCountries, featuredLocations] =
		await Promise.all([
			fetchHomepageFeaturedListingCards(),
			fetchHomepageFrontlineListingCards(),
			fetchSiteSettingsHero(),
			fetchCountriesWithHero(),
			fetchHomepageFeaturedLocations()
		]);

	return {
		countries: nav.countries,
		locations: nav.locations,
		communities: nav.communities,
		featuredCards,
		frontlineCards,
		homepageHero: resolveHomepageHeroImage(homepageHero),
		homepageHeroTagline: homepageHero?.tagline ?? null,
		featuredCountries,
		featuredLocations
	};
};
