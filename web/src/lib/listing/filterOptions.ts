/** User-facing filter and sort options — values must match Sanity schema enums. */

export const PROPERTY_TYPES = [
	{ label: 'Villa', value: 'villa' },
	{ label: 'Apartment', value: 'apartment' },
	{ label: 'Penthouse', value: 'penthouse' },
	{ label: 'Townhouse', value: 'townhouse' },
	{ label: 'Plot', value: 'plot' },
	{ label: 'Finca', value: 'finca' },
	{ label: 'Development', value: 'development' }
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number]['value'];

export const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((option) => option.value);

export const GOLF_RELEVANCE = [
	{ label: 'Frontline golf', value: 'frontline_golf' },
	{ label: 'Golf view', value: 'golf_view' },
	{ label: 'Golf resort', value: 'golf_resort' },
	{ label: 'Near golf', value: 'near_golf' },
	{ label: 'Close to golf', value: 'close_to_golf' }
] as const;

export type GolfRelevanceValue = (typeof GOLF_RELEVANCE)[number]['value'];

export const GOLF_RELEVANCE_VALUES = GOLF_RELEVANCE.map((option) => option.value);

export const SORT_OPTIONS = [
	{ label: 'Title A–Z', value: 'title' },
	{ label: 'Price: low to high', value: 'price_asc' },
	{ label: 'Price: high to low', value: 'price_desc' },
	{ label: 'Newest', value: 'newest' }
] as const;

export type ListingSort = (typeof SORT_OPTIONS)[number]['value'];

export const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

export const MIN_BEDS_OPTIONS = [
	{ label: 'Any beds', value: '' },
	{ label: '1+', value: '1' },
	{ label: '2+', value: '2' },
	{ label: '3+', value: '3' },
	{ label: '4+', value: '4' },
	{ label: '5+', value: '5' }
] as const;
