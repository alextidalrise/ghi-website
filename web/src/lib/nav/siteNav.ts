import {
	buildListingSearchHref,
	DEFAULT_LISTING_SEARCH_PARAMS
} from '$lib/listing/searchParams';

export type SiteNavItem = {
	label: string;
	href: string;
};

export const DEFAULT_PRIMARY_COUNTRY_SLUG = 'spain';

export function buildSiteNavItems(primaryCountrySlug: string): SiteNavItem[] {
	const countrySlug = primaryCountrySlug || DEFAULT_PRIMARY_COUNTRY_SLUG;
	const countryPath = `/${countrySlug}`;
	const golfHref = buildListingSearchHref(countryPath, DEFAULT_LISTING_SEARCH_PARAMS, {
		golfRelevance: ['frontline_golf']
	});

	return [
		{ label: 'Properties', href: '/' },
		{ label: 'Destinations', href: countryPath },
		{ label: 'Golf', href: golfHref },
		{ label: 'About', href: '/about' }
	];
}
