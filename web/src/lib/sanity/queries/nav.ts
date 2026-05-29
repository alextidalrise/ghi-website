import { fetchPublic } from './fetch';
import { countriesForNavQuery, locationsByCountryQuery } from './location';

export type NavCountryOption = {
	_id: string;
	name: string;
	slug: string;
};

export type NavLocationOption = {
	_id: string;
	name: string;
	slug: string;
	countrySlug: string;
};

export type NavTaxonomy = {
	countries: NavCountryOption[];
	locations: NavLocationOption[];
	primaryCountrySlug: string;
};

const DEFAULT_PRIMARY_COUNTRY_SLUG = 'spain';

export async function fetchNavTaxonomy(): Promise<NavTaxonomy> {
	const rows = await fetchPublic<Array<{ _id: string; name: string; slug?: string | null }>>(
		countriesForNavQuery
	);

	const countries = (rows ?? []).flatMap((row) =>
		row.slug ? [{ _id: row._id, name: row.name, slug: row.slug }] : []
	);

	const locationGroups = await Promise.all(
		countries.map(async (country) => {
			const locationRows = await fetchPublic<
				Array<{ _id: string; name: string; slug?: string | null }>
			>(locationsByCountryQuery, { params: { countrySlug: country.slug } });

			return (locationRows ?? []).flatMap((row) =>
				row.slug
					? [
							{
								_id: row._id,
								name: row.name,
								slug: row.slug,
								countrySlug: country.slug
							}
						]
					: []
			);
		})
	);

	return {
		countries,
		locations: locationGroups.flat(),
		primaryCountrySlug: countries[0]?.slug ?? DEFAULT_PRIMARY_COUNTRY_SLUG
	};
}
