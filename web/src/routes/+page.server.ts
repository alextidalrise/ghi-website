import type { PageServerLoad } from './$types';
import { fetchPublic, locationsByCountryQuery } from '$lib/sanity/queries';

type CountryOption = {
	_id: string;
	name: string;
	slug: string;
};

type LocationOption = {
	_id: string;
	name: string;
	slug: string;
	countrySlug: string;
};

export const load: PageServerLoad = async () => {
	const countries: CountryOption[] = [
		{
			_id: 'country-spain',
			name: 'Spain',
			slug: 'spain'
		}
	];

	const locationGroups = await Promise.all(
		countries.map(async (country) => {
			const rows = await fetchPublic<Array<{ _id: string; name: string; slug?: string | null }>>(
				locationsByCountryQuery,
				{ params: { countrySlug: country.slug } }
			);

			return (rows ?? [])
				.filter((row): row is { _id: string; name: string; slug: string } => Boolean(row.slug))
				.map((row) => ({
					_id: row._id,
					name: row.name,
					slug: row.slug,
					countrySlug: country.slug
				}));
		})
	);

	return {
		countries,
		locations: locationGroups.flat()
	};
};
