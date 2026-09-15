import { defineQuery } from 'groq';
import { MEDIA_ASSET_PUBLIC } from '../allowlists';
import {
	resolveFrontlineHero,
	type FrontlineHeroContent,
	type FrontlineHeroInput
} from '../transforms/frontlineHero';
import { fetchPublic } from './fetch';
import { PUBLIC_LISTING_FILTER } from './filters';

export type CourseFilterOption = { label: string; value: string };

/**
 * Golf courses that have at least one publishable frontline-golf listing on them
 * (as primary or linked course). Populating the filter from real frontline stock
 * means every option returns results — no dead-end selections.
 */
const frontlineCourseOptionsQuery = /* groq */ `
  *[
    _type == "golfCourse"
    && defined(slug.current)
    && count(*[
      _type == "propertyListing"
      && listingKind in ["property", "unit"]
      && ${PUBLIC_LISTING_FILTER}
      && coalesce(golf.golfRelevance, "") == "frontline_golf"
      && ^._id in golf.linkedGolfCourses[]._ref
    ]) > 0
  ] | order(name asc){
    "label": name,
    "value": slug.current
  }
`;

/** Course filter options for the Front Line Collection page. */
export async function fetchFrontlineCourseOptions(): Promise<CourseFilterOption[]> {
	const raw = await fetchPublic<Array<{ label?: string | null; value?: string | null }>>(
		frontlineCourseOptionsQuery
	);
	return (raw ?? [])
		.filter((row): row is CourseFilterOption => Boolean(row.label && row.value))
		.map((row) => ({ label: row.label, value: row.value }));
}

/** A location option carries its country's slug so the filter bar can cascade. */
export type FrontlineLocationOption = { label: string; value: string; country: string };

export type FrontlinePlaceOptions = {
	countryOptions: Array<{ label: string; value: string }>;
	locationOptions: FrontlineLocationOption[];
};

type RawFrontlinePlace = {
	countryName?: string | null;
	countrySlug?: string | null;
	locationName?: string | null;
	locationSlug?: string | null;
};

/**
 * Where every publishable frontline-golf grid row sits. The same rows the collection grid
 * shows (properties, units and developments), and the same fields its Country and Location
 * facets match on, so every option returns results.
 */
const frontlinePlacesQuery = /* groq */ `
  *[
    (
      (_type == "propertyListing" && listingKind in ["property", "unit"])
      || _type == "development"
    )
    && ${PUBLIC_LISTING_FILTER}
    && coalesce(golf.golfRelevance, "") == "frontline_golf"
  ]{
    "countryName": coalesce(location.country->name, location.community->parent->parent->name),
    "countrySlug": coalesce(location.country->slug.current, location.community->parent->parent->slug.current),
    "locationName": location.location->name,
    "locationSlug": location.location->slug.current
  }
`;

/** Reduce frontline rows to de-duplicated, name-ordered country and location options. */
export function toFrontlinePlaceOptions(rows: RawFrontlinePlace[]): FrontlinePlaceOptions {
	const countries = new Map<string, { label: string; value: string }>();
	const locations = new Map<string, FrontlineLocationOption>();

	for (const row of rows) {
		if (!row.countrySlug || !row.countryName) continue;
		if (!countries.has(row.countrySlug)) {
			countries.set(row.countrySlug, { label: row.countryName, value: row.countrySlug });
		}
		// Keyed by slug alone: the Location facet matches on slug, and keyed {#each} blocks
		// in ListingFilters throw on a duplicate value.
		if (row.locationSlug && row.locationName && !locations.has(row.locationSlug)) {
			locations.set(row.locationSlug, {
				label: row.locationName,
				value: row.locationSlug,
				country: row.countrySlug
			});
		}
	}

	const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);
	return {
		countryOptions: [...countries.values()].sort(byLabel),
		locationOptions: [...locations.values()].sort(byLabel)
	};
}

/** Country and Location filter options for the Front Line Collection page. */
export async function fetchFrontlinePlaceOptions(): Promise<FrontlinePlaceOptions> {
	const raw = await fetchPublic<RawFrontlinePlace[]>(frontlinePlacesQuery);
	return toFrontlinePlaceOptions(raw ?? []);
}

export const frontlineHeroQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    frontlineHero{
      image${MEDIA_ASSET_PUBLIC},
      eyebrow,
      headline,
      lead
    }
  }
`);

/** Resolve the Front Line Collection hero (with defaults applied) from site settings. */
export async function fetchFrontlineHero(): Promise<FrontlineHeroContent> {
	const result = await fetchPublic<{ frontlineHero?: FrontlineHeroInput }>(frontlineHeroQuery);
	return resolveFrontlineHero(result?.frontlineHero ?? null);
}
