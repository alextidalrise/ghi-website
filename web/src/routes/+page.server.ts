import type { PageServerLoad } from './$types';
import {
	fetchCountriesWithHero,
	fetchHomepageFeaturedListingCards,
	fetchHomepageFeaturedLocations,
	fetchHomepageFrontlineListingCards,
	fetchHomepagePartnerLogos,
	fetchListingFacetRows,
	fetchNavTaxonomy,
	fetchSiteSettingsHero
} from '$lib/sanity/queries';
import { loadReviews } from '$lib/reviews';
import { resolveHomepageHeroImage } from '$lib/sanity/transforms/taxonomyHero';

export const load: PageServerLoad = async ({ fetch }) => {
	const [
		nav,
		featuredCards,
		frontlineCards,
		homepageHero,
		featuredCountries,
		featuredLocations,
		partnerLogos,
		facetRows,
		reviews
	] = await Promise.all([
		fetchNavTaxonomy(),
		fetchHomepageFeaturedListingCards(),
		fetchHomepageFrontlineListingCards(),
		fetchSiteSettingsHero(),
		fetchCountriesWithHero(),
		fetchHomepageFeaturedLocations(),
		fetchHomepagePartnerLogos(),
		fetchListingFacetRows(),
		loadReviews(fetch)
	]);

	return {
		countries: nav.countries,
		locations: nav.locations,
		communities: nav.communities,
		facetRows,
		featuredCards,
		frontlineCards,
		homepageHero: resolveHomepageHeroImage(homepageHero),
		homepageHeroTagline: homepageHero?.tagline ?? null,
		featuredCountries,
		featuredLocations,
		partnerLogos,
		reviews
	};
};
