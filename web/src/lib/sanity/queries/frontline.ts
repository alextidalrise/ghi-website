import { defineQuery } from 'groq';
import { MEDIA_ASSET_PUBLIC } from '../allowlists';
import {
	resolveFrontlineHero,
	type FrontlineHeroContent,
	type FrontlineHeroInput
} from '../transforms/frontlineHero';
import type { RateTable } from '../../currency/rates';
import type { ListingSearchParams } from '../../listing/searchParams';
import { fetchPublic } from './fetch';
import { PUBLIC_LISTING_FILTER } from './filters';
import { buildGolfCourseFacetQuery, listingSearchQueryParams } from './listingSearch';

/**
 * A golf-course option, with every country and location slug its matching frontline rows
 * sit in (a listing links nearby courses, so one course can span locations). The filter
 * bar uses these to narrow the list as Country and Location change.
 */
export type CourseFilterOption = {
	label: string;
	value: string;
	countries: string[];
	locations: string[];
};

type RawCourseRef = { label?: string | null; value?: string | null };

type RawCourseFacet = {
	rows?: Array<{
		country?: string | null;
		location?: string | null;
		courses?: Array<RawCourseRef | null> | null;
	}> | null;
	selected?: RawCourseRef[] | null;
};

/**
 * Reduce facet rows to name-ordered course options. Courses the visitor already selected
 * but no row matches (e.g. after a price change) are kept, with no places, so they stay
 * visible and can be unticked rather than filtering invisibly.
 */
export function toFrontlineCourseOptions(raw: RawCourseFacet | null): CourseFilterOption[] {
	const courses = new Map<string, { label: string; countries: Set<string>; locations: Set<string> }>();

	for (const row of raw?.rows ?? []) {
		for (const course of row.courses ?? []) {
			if (!course?.label || !course.value) continue;
			let entry = courses.get(course.value);
			if (!entry) {
				entry = { label: course.label, countries: new Set(), locations: new Set() };
				courses.set(course.value, entry);
			}
			if (row.country) entry.countries.add(row.country);
			if (row.location) entry.locations.add(row.location);
		}
	}

	for (const course of raw?.selected ?? []) {
		if (!course.label || !course.value || courses.has(course.value)) continue;
		courses.set(course.value, { label: course.label, countries: new Set(), locations: new Set() });
	}

	return [...courses.entries()]
		.map(([value, entry]) => ({
			label: entry.label,
			value,
			countries: [...entry.countries].sort(),
			locations: [...entry.locations].sort()
		}))
		.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Course filter options for the Front Line Collection page: courses linked by the frontline
 * rows (properties, units and developments) matching the visitor's other filters. Country
 * and location are left out so the bar can narrow by place instantly on the client;
 * golfCourse is left out so the facet never narrows itself.
 */
export async function fetchFrontlineCourseOptions({
	params,
	rates
}: {
	params: ListingSearchParams;
	rates?: RateTable;
}): Promise<CourseFilterOption[]> {
	const scope = { type: 'global' } as const;
	const raw = await fetchPublic<RawCourseFacet>(buildGolfCourseFacetQuery(scope), {
		params: {
			...listingSearchQueryParams(
				scope,
				{
					...params,
					country: null,
					location: null,
					golfCourse: [],
					golfRelevance: ['frontline_golf']
				},
				rates
			),
			selectedCourses: params.golfCourse
		}
	});
	return toFrontlineCourseOptions(raw);
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
