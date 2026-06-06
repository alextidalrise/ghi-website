import { defineQuery } from 'groq';
import { MEDIA_ASSET_PUBLIC } from '../allowlists';
import {
	resolveFrontlineHero,
	type FrontlineHeroContent,
	type FrontlineHeroInput
} from '../transforms/frontlineHero';
import { fetchPublic } from './fetch';
import { PUBLIC_LISTING_FILTER } from './filters';
import { GOLF_COURSE_PUBLIC_FILTER } from './golf';

export type CourseFilterOption = { label: string; value: string };

/**
 * Golf courses that have at least one publishable frontline-golf listing on them
 * (as primary or linked course). Populating the filter from real frontline stock
 * means every option returns results — no dead-end selections.
 */
const frontlineCourseOptionsQuery = /* groq */ `
  *[
    _type == "golfCourse"
    && ${GOLF_COURSE_PUBLIC_FILTER}
    && defined(slug.current)
    && count(*[
      _type == "propertyListing"
      && listingKind in ["property", "unit"]
      && ${PUBLIC_LISTING_FILTER}
      && coalesce(golf.golfRelevance, "") == "frontline_golf"
      && (
        golf.primaryGolfCourse._ref == ^._id
        || ^._id in golf.linkedGolfCourses[]._ref
      )
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
