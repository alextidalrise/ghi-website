import type { PageServerLoad } from './$types';
import {
	fetchCountriesWithHero,
	fetchHomepageFeaturedListingCards,
	fetchHomepageFeaturedLocations,
	fetchHomepageFrontlineListingCards,
	fetchHomepagePartnerLogos,
	fetchNavTaxonomy,
	fetchSiteSettingsHero
} from '$lib/sanity/queries';
import { resolveHomepageHeroImage } from '$lib/sanity/transforms/taxonomyHero';

export const load: PageServerLoad = async () => {
	const [
		nav,
		featuredCards,
		frontlineCards,
		homepageHero,
		featuredCountries,
		featuredLocations,
		partnerLogos
	] = await Promise.all([
		fetchNavTaxonomy(),
		fetchHomepageFeaturedListingCards(),
		fetchHomepageFrontlineListingCards(),
		fetchSiteSettingsHero(),
		fetchCountriesWithHero(),
		fetchHomepageFeaturedLocations(),
		fetchHomepagePartnerLogos()
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
		featuredLocations,
		partnerLogos
	};
};
