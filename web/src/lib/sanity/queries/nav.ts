import { fetchPublic } from './fetch';
import {
	communitiesForNavQuery,
	countriesForNavQuery,
	locationsByCountryQuery
} from './location';

// Stray draft taxonomy documents can share a slug with a published community under
// the same location, producing duplicate keys in Svelte's keyed {#each} blocks and
// crashing the client-side router (each_key_duplicate).
function dedupeCommunitiesBySlug(communities: NavCommunityOption[]): NavCommunityOption[] {
	const best = new Map<string, NavCommunityOption>();
	for (const c of communities) {
		const key = `${c.countrySlug}/${c.locationSlug}/${c.slug}`;
		const existing = best.get(key);
		if (!existing || (existing._id.startsWith('drafts.') && !c._id.startsWith('drafts.'))) {
			best.set(key, c);
		}
	}
	return communities.filter((c) => best.get(`${c.countrySlug}/${c.locationSlug}/${c.slug}`) === c);
}

export type NavCountryOption = {
	_id: string;
	name: string;
	slug: string;
	/** Dereferenced flag SVG URL; null falls back to a built-in stamp (Spain/Portugal). */
	flagUrl: string | null;
};

export type NavLocationOption = {
	_id: string;
	name: string;
	slug: string;
	countrySlug: string;
};

export type NavCommunityOption = {
	_id: string;
	name: string;
	slug: string;
	locationSlug: string;
	countrySlug: string;
};

export type NavTaxonomy = {
	countries: NavCountryOption[];
	locations: NavLocationOption[];
	communities: NavCommunityOption[];
	primaryCountrySlug: string;
};

const DEFAULT_PRIMARY_COUNTRY_SLUG = 'spain';

export async function fetchNavTaxonomy(): Promise<NavTaxonomy> {
	const rows = await fetchPublic<
		Array<{ _id: string; name: string; slug?: string | null; flagUrl?: string | null }>
	>(countriesForNavQuery);

	const countries = (rows ?? []).flatMap((row) =>
		row.slug
			? [{ _id: row._id, name: row.name, slug: row.slug, flagUrl: row.flagUrl ?? null }]
			: []
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

	const communityRows = await fetchPublic<
		Array<{
			_id: string;
			name: string;
			slug?: string | null;
			locationSlug?: string | null;
			countrySlug?: string | null;
		}>
	>(communitiesForNavQuery);

	const communities = dedupeCommunitiesBySlug(
		(communityRows ?? []).flatMap((row) =>
			row.slug && row.locationSlug && row.countrySlug
				? [
						{
							_id: row._id,
							name: row.name,
							slug: row.slug,
							locationSlug: row.locationSlug,
							countrySlug: row.countrySlug
						}
					]
				: []
		)
	);

	return {
		countries,
		locations: locationGroups.flat(),
		communities,
		primaryCountrySlug: countries[0]?.slug ?? DEFAULT_PRIMARY_COUNTRY_SLUG
	};
}

/**
 * Communities under a single country, in the same shape the discovery bar consumes.
 * The country page's scoped search bar needs only its own country's communities, so it
 * takes this instead of the whole-catalogue {@link fetchNavTaxonomy} cascade.
 */
export async function fetchCountryNavCommunities(
	countrySlug: string
): Promise<NavCommunityOption[]> {
	const rows = await fetchPublic<
		Array<{
			_id: string;
			name: string;
			slug?: string | null;
			locationSlug?: string | null;
			countrySlug?: string | null;
		}>
	>(communitiesForNavQuery);

	return dedupeCommunitiesBySlug(
		(rows ?? []).flatMap((row) =>
			row.slug && row.locationSlug && row.countrySlug === countrySlug
				? [
						{
							_id: row._id,
							name: row.name,
							slug: row.slug,
							locationSlug: row.locationSlug,
							countrySlug: row.countrySlug
						}
					]
				: []
		)
	);
}
