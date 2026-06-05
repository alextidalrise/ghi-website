import { defineArrayMember } from 'sanity';

type ListingRef = { _ref?: string } | null | undefined;

/**
 * Array member for hand-picked `propertyListing` reference arrays
 * (siteSettings.homepageFeaturedListings, locationTaxonomy.featuredListings).
 *
 * The reference picker hides listings already chosen in the same array — both the
 * published id (stored in `_ref`) and its `drafts.` twin — so the same listing can't
 * be added twice. Pair with `noDuplicateListings` as a validation safety net for
 * imports/migrations that bypass the picker.
 */
export const featuredListingMember = defineArrayMember({
	type: 'reference',
	to: [{ type: 'propertyListing' }],
	options: {
		filter: ({ parent }) => {
			const selected = (Array.isArray(parent) ? parent : [])
				.map((item: ListingRef) => item?._ref)
				.filter((ref): ref is string => Boolean(ref));
			return {
				filter: '!(_id in $ids) && !(_id in $draftIds)',
				params: { ids: selected, draftIds: selected.map((id) => `drafts.${id}`) }
			};
		}
	}
});

/** Validation: no listing referenced more than once in a hand-picked array. */
export function noDuplicateListings(listings: unknown): true | string {
	const refs = (Array.isArray(listings) ? listings : [])
		.map((item: ListingRef) => item?._ref)
		.filter((ref): ref is string => Boolean(ref));
	return new Set(refs).size === refs.length
		? true
		: 'The same listing is selected more than once — remove the duplicate.';
}
