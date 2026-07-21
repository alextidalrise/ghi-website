import type { PageServerLoad } from './$types';
import {
	fetchCountriesWithHero,
	fetchFeatureFilterSettings,
	fetchHomepageContent,
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
import { resolveHomepageContent } from '$lib/sanity/transforms/pageContent';

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
		reviews,
		featureFilter,
		rawContent
	] = await Promise.all([
		fetchNavTaxonomy(),
		fetchHomepageFeaturedListingCards(),
		fetchHomepageFrontlineListingCards(),
		fetchSiteSettingsHero(),
		fetchCountriesWithHero(),
		fetchHomepageFeaturedLocations(),
		fetchHomepagePartnerLogos(),
		fetchListingFacetRows(),
		loadReviews(fetch),
		fetchFeatureFilterSettings(),
		fetchHomepageContent()
	]);

	const content = resolveHomepageContent(rawContent);

	return {
		countries: nav.countries,
		locations: nav.locations,
		communities: nav.communities,
		facetRows,
		featureFilter,
		featuredCards,
		frontlineCards,
		homepageHero: resolveHomepageHeroImage(homepageHero),
		homepageHeroTagline: homepageHero?.tagline ?? null,
		featuredCountries,
		featuredLocations,
		partnerLogos,
		reviews,
		content
	};
};
