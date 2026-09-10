import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCountryBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import type { LocationTaxonomyRef } from '$lib/listing/breadcrumbs';
import { withPreviewLocationSeo } from '$lib/listing/detailPage';
import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
import { buildLocationSeo } from '$lib/listing/seo';
import { parseListingSearchParams } from '$lib/listing/searchParams';
import { hasIndexAffectingQuery } from '$lib/seo/indexability';
import { toFeatureOptions } from '$lib/listing/featureHighlights';
import { loadReviews } from '$lib/reviews';
import {
	countryBySlugQuery,
	fetchCountryFeaturedListingCards,
	fetchCountryFeatureLabels,
	fetchFeatureFilterSettings,
	fetchFrontlineListingCards,
	fetchListingCards,
	fetchMaybePreview,
	fetchPublic,
	locationsByCountryQuery
} from '$lib/sanity/queries';
import type { CountryBySlugQueryResult } from '$lib/sanity/types';
import { addCacheTags } from '$lib/cache/tagContext';
import { cacheTag } from '$lib/cache/tags';

type LocationTaxonomyPage = LocationTaxonomyRef & {
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
};

export const load: PageServerLoad = async ({
	params,
	url,
	fetch,
	locals: { preview, loadQuery, exchangeRates }
}) => {
	const searchParams = parseListingSearchParams(url);
	const listingScope = { type: 'country' as const, countrySlug: params.country };
	const { rates } = await exchangeRates;

	/* One round trip. Every query below is keyed on `params.country` (and, for the grid, the
	   URL search params) — none read the fetched `country` document, so nothing waits for it.
	   Reviews are an outbound call to a third party and depend on nothing at all. Awaiting
	   these separately would turn one round trip into several sequential ones, and TTFB is the
	   binding constraint on this page: measured at 1.25–3.0s on production, against a 6–21ms
	   connect, which gates FCP, LCP and Speed Index alike.

	   The Features menu depends on the feature-filter settings, but only in a synchronous
	   transform: the raw labels and the settings both fetch here, in parallel, and
	   `toFeatureOptions` joins them below — so the menu stays in this single round trip rather
	   than sitting behind a second one.

	   The cost of collapsing them is that an unknown slug now runs the other queries before
	   404ing. That is a rare, cheap path, and it buys the common one fewer round trips. */
	const [
		country,
		locations,
		featuredCards,
		frontlineCards,
		listingResults,
		featureLabels,
		featureFilter,
		reviews
	] = await Promise.all([
		fetchMaybePreview<CountryBySlugQueryResult>(
			countryBySlugQuery,
			{ countrySlug: params.country },
			loadQuery,
			preview
		),
		fetchPublic<LocationTaxonomyPage[]>(locationsByCountryQuery, {
			params: { countrySlug: params.country }
		}),
		fetchCountryFeaturedListingCards({ countrySlug: params.country }),
		fetchFrontlineListingCards({ scope: listingScope, rates }),
		fetchListingCards({ scope: listingScope, params: searchParams, rates }),
		fetchCountryFeatureLabels(params.country),
		fetchFeatureFilterSettings(),
		loadReviews(fetch)
	]);

	if (!country?.slug) {
		error(404, 'Location not found.');
	}

	const featureOptions = toFeatureOptions(featureLabels, featureFilter);

	/* Location facet options for the filter bar: the country's locations as {label, value}.
	   De-duped by slug — a country can surface two location docs sharing one slug (a stray CMS
	   duplicate, or a draft alongside its published twin in preview), and both filter to the
	   identical ?location= value. Left un-deduped, the keyed {#each} in ListingFilters hits a
	   duplicate key and throws during client-side navigation. */
	const locationOptions = (() => {
		const bySlug = new Map<string, { label: string; value: string }>();
		for (const loc of locations ?? []) {
			if (!loc.slug || !loc.name || bySlug.has(loc.slug)) continue;
			bySlug.set(loc.slug, { label: loc.name, value: loc.slug });
		}
		return [...bySlug.values()];
	})();

	/* Structural tags for new documents this page's live queries would surface: a new
	   country-wide listing and a new frontline listing in this country. Curated featured
	   listings/locations are already covered by their `doc:` tags (and the country doc's). */
	addCacheTags(cacheTag.gridCountry(country.slug), cacheTag.frontlineCountry(country.slug));

	const canonicalPath = `/${country.slug}`;

	const frontlineViewAllHref = FRONTLINE_COLLECTION_PATH;

	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const breadcrumbs = buildCountryBreadcrumbs(country, canonicalPath);
	/* Canonical stays the unfiltered country URL; an active listing filter makes the page
	   noindex (follow), mirroring the location page's filtered-results behavior. */
	const seoBase = buildLocationSeo(country, canonicalUrl);
	if (hasIndexAffectingQuery(searchParams)) {
		seoBase.noindex = true;
	}
	const seo = preview ? withPreviewLocationSeo(seoBase) : seoBase;
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'country' as const,
		location: country,
		locations: locations ?? [],
		featuredCards,
		frontlineCards,
		frontlineViewAllHref,
		reviews,
		searchParams,
		listingResults,
		featureOptions,
		locationOptions,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
