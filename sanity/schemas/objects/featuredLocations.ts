import { defineArrayMember } from 'sanity';

type LocationRef = { _ref?: string } | null | undefined;

/**
 * Array member for hand-picked `locationTaxonomy` reference arrays
 * (siteSettings.homepageFeaturedLocations, locationTaxonomy.featuredLocations).
 *
 * The reference picker hides locations already chosen in the same array — both the
 * published id (stored in `_ref`) and its `drafts.` twin — so the same location can't
 * be added twice. Pair with `noDuplicateLocations` as a validation safety net for
 * imports/migrations that bypass the picker.
 */
export const featuredLocationMember = defineArrayMember({
	type: 'reference',
	to: [{ type: 'locationTaxonomy' }],
	options: {
		filter: ({ parent }) => {
			const selected = (Array.isArray(parent) ? parent : [])
				.map((item: LocationRef) => item?._ref)
				.filter((ref): ref is string => Boolean(ref));
			return {
				filter:
					'type == "location" && !(_id in $ids) && !(_id in $draftIds)',
				params: { ids: selected, draftIds: selected.map((id) => `drafts.${id}`) }
			};
		}
	}
});

/** Validation: no location referenced more than once in a hand-picked array. */
export function noDuplicateLocations(locations: unknown): true | string {
	const refs = (Array.isArray(locations) ? locations : [])
		.map((item: LocationRef) => item?._ref)
		.filter((ref): ref is string => Boolean(ref));
	return new Set(refs).size === refs.length
		? true
		: 'The same location is selected more than once — remove the duplicate.';
}
