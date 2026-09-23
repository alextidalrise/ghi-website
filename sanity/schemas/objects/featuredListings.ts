import { defineArrayMember } from 'sanity';

type ListingRef = { _ref?: string } | null | undefined;

/**
 * Builds an array member for hand-picked listing reference arrays
 * (siteSettings.homepageFeaturedListings, locationTaxonomy.featuredListings).
 *
 * `types` controls which document types the reference picker offers. The homepage
 * grid sticks to `propertyListing`; country pages also allow `development` (the
 * frontend featured query already renders both — see FEATURED_LISTING_REF_FILTER).
 *
 * The reference picker hides listings already chosen in the same array — both the
 * published id (stored in `_ref`) and its `drafts.` twin — so the same listing can't
 * be added twice. Pair with `noDuplicateListings` as a validation safety net for
 * imports/migrations that bypass the picker.
 */
export function createFeaturedListingMember(types: string[] = ['propertyListing']) {
	return defineArrayMember({
		type: 'reference',
		to: types.map((type) => ({ type })),
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
}

/** Default member — `propertyListing` only (homepage featured grid). */
export const featuredListingMember = createFeaturedListingMember();

/** Validation: no listing referenced more than once in a hand-picked array. */
export function noDuplicateListings(listings: unknown): true | string {
	const refs = (Array.isArray(listings) ? listings : [])
		.map((item: ListingRef) => item?._ref)
		.filter((ref): ref is string => Boolean(ref));
	return new Set(refs).size === refs.length
		? true
		: 'The same listing is selected more than once — remove the duplicate.';
}

/** Most listings a grid can pin — mirrors PINNED_LISTINGS_LIMIT in the web listing search. */
export const PINNED_LISTINGS_MAX = 6;

type PinScope = { filter: string; params?: Record<string, unknown> };
type PinScopeDocument = {
	_id?: string;
	linkedLocations?: Array<{ includeInGrid?: boolean; location?: ListingRef }>;
} & Record<string, unknown>;

const publishedId = (id: string | undefined) => (id ?? '').replace(/^drafts\./, '');

/** Which listings a grid holds — kept in step with the web grid's scope filters. */
export const pinScopes = {
	country: (document: PinScopeDocument): PinScope => ({
		filter: 'location.country._ref == $scopeId',
		params: { scopeId: publishedId(document._id) }
	}),
	/** A location grid also holds linked locations marked "Include properties in grid". */
	location: (document: PinScopeDocument): PinScope => ({
		filter: 'location.location._ref in $scopeIds',
		params: {
			scopeIds: [
				publishedId(document._id),
				...(document.linkedLocations ?? [])
					.filter((entry) => entry?.includeInGrid && entry.location?._ref)
					.map((entry) => entry.location!._ref as string)
			]
		}
	}),
	golfCourse: (document: PinScopeDocument): PinScope => ({
		filter: '$scopeId in golf.linkedGolfCourses[]._ref',
		params: { scopeId: publishedId(document._id) }
	}),
	/** Mirrors the web's FRONTLINE_COLLECTION_FILTER: frontline golf and opted in. */
	frontline: (): PinScope => ({
		filter: 'golf.golfRelevance == "frontline_golf" && includeInFrontlineCollection == true'
	})
};

/**
 * Array member for a grid's ordered pinned listings. The picker offers only listings that
 * can appear on that grid (individual properties/units and developments inside its scope),
 * minus ones already pinned. Pair with `noDuplicateListings` and `Rule.max(PINNED_LISTINGS_MAX)`.
 */
export function createPinnedListingMember(scope: (document: PinScopeDocument) => PinScope) {
	return defineArrayMember({
		type: 'reference',
		to: [{ type: 'propertyListing' }, { type: 'development' }],
		options: {
			filter: ({ document, parent }) => {
				const selected = (Array.isArray(parent) ? parent : [])
					.map((item: ListingRef) => item?._ref)
					.filter((ref): ref is string => Boolean(ref));
				const { filter, params } = scope(document as PinScopeDocument);
				return {
					filter: `(_type == "development" || listingKind in ["property", "unit"]) && (${filter}) && !(_id in $ids) && !(_id in $draftIds)`,
					params: { ...params, ids: selected, draftIds: selected.map((id) => `drafts.${id}`) }
				};
			}
		}
	});
}

/** Shared editor-facing description for every grid's pin field. */
export const PINNED_LISTINGS_DESCRIPTION =
	'Listings that open this page’s property grid, in this order, ahead of the rest (newest first). Up to 6. They lead only until a visitor picks a sort, and are hidden when a filter excludes them. No label marks them on the site.';
