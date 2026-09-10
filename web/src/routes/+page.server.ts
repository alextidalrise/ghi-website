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

export const load: PageServerLoad = async ({ fetch, url, locals }) => {
	// `home` covers the query-driven homepage rails (featured, frontline, partners,
	// countries); `frontline` also fires on any new frontline listing site-wide.
	addCacheTags(cacheTag.home, cacheTag.frontline);

	// Live rates for the EUR-normalised sort/filter behind the frontline rail and facet bar.
	// Already in flight from ratesHandle, so this await overlaps the fetches below.
	const { rates } = await locals.exchangeRates;

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
		fetchHomepageFrontlineListingCards(rates),
		fetchSiteSettingsHero(),
		fetchCountriesWithHero(),
		fetchHomepageFeaturedLocations(),
		fetchHomepagePartnerLogos(),
		fetchListingFacetRows(rates),
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
