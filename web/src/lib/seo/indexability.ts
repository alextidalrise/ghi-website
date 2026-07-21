import {
	DEFAULT_LISTING_SEARCH_PARAMS,
	type ListingSearchParams
} from '$lib/listing/searchParams';

const INDEX_AFFECTING_KEYS: (keyof ListingSearchParams)[] = [
	'page',
	'sort',
	'propertyType',
	'minPrice',
	'maxPrice',
	'minBeds',
	'community',
	'golfRelevance',
	'golfCourse',
	'features'
];

export function hasIndexAffectingQuery(params: ListingSearchParams): boolean {
	for (const key of INDEX_AFFECTING_KEYS) {
		const current = params[key];
		const defaultVal = DEFAULT_LISTING_SEARCH_PARAMS[key];

		if (Array.isArray(current) && Array.isArray(defaultVal)) {
			if (current.length !== defaultVal.length) return true;
		} else if (current !== defaultVal) {
			return true;
		}
	}
	return false;
}
