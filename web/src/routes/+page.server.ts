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
import { addCacheTags } from '$lib/cache/tagContext';
import { cacheTag } from '$lib/cache/tags';

export const load: PageServerLoad = async ({ fetch, url }) => {
	// `home` covers the query-driven homepage rails (featured, frontline, partners,
	// countries); `frontline` also fires on any new frontline listing site-wide.
	addCacheTags(cacheTag.home, cacheTag.frontline);

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
		canonicalUrl: `${url.origin}/`,
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
