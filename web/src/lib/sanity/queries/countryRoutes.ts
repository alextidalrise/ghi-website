import { defineQuery } from 'groq';
import { fetchPublic } from './fetch';

/**
 * What the country page's cross-link panel needs: this market's buying guide, and how
 * many vetted firms cover it.
 *
 * Both the guide's `country` and the partner's `countries` are matched in their
 * dereferenced and legacy-string forms, so the panel is correct either side of the
 * country-refs migration.
 */
export const countryRoutesQuery = defineQuery(`
  {
    "guide": *[
      _type == "guide"
      && (country->slug.current == $countrySlug || country == $countrySlug)
      && guideCategory == "buying"
      && defined(slug.current)
    ] | order(coalesce(order, 999) asc, title asc)[0]{
      title,
      "slug": slug.current
    },
    "partnerCount": count(*[
      _type == "partner"
      && defined(slug.current)
      && (count(countries[@->slug.current == $countrySlug]) > 0 || $countrySlug in countries)
    ])
  }
`);

export type CountryRoutes = {
	/** The market's buying guide, or null where none is written yet. */
	guide: { title: string; href: string } | null;
	/** Vetted firms covering this market. Zero is a real, renderable state. */
	partnerCount: number;
};

export const EMPTY_COUNTRY_ROUTES: CountryRoutes = { guide: null, partnerCount: 0 };

/**
 * Fetch the country page's routes. Resolves to the empty shape on any failure, so a
 * below-fold signpost never takes the country page down with it.
 */
export async function fetchCountryRoutes(
	countrySlug: string | null | undefined
): Promise<CountryRoutes> {
	if (!countrySlug) return EMPTY_COUNTRY_ROUTES;

	const raw = await fetchPublic<{
		guide?: { title?: string | null; slug?: string | null } | null;
		partnerCount?: number | null;
	}>(countryRoutesQuery, { params: { countrySlug } });

	const guide =
		raw?.guide?.slug && raw.guide.title
			? { title: raw.guide.title, href: `/guides/${raw.guide.slug}` }
			: null;

	return {
		guide,
		partnerCount: raw?.partnerCount ?? 0
	};
}
