import {
	GOLF_RELEVANCE_VALUES,
	PROPERTY_TYPE_VALUES,
	SORT_VALUES,
	type GolfRelevanceValue,
	type ListingSort,
	type PropertyTypeValue
} from './filterOptions';

export const PAGE_SIZE = 24;

export type ListingSearchParams = {
	page: number;
	sort: ListingSort;
	propertyType: PropertyTypeValue | null;
	minPrice: number | null;
	maxPrice: number | null;
	minBeds: number | null;
	community: string | null;
	golfRelevance: GolfRelevanceValue[];
};

export const DEFAULT_LISTING_SEARCH_PARAMS: ListingSearchParams = {
	page: 1,
	sort: 'newest',
	propertyType: null,
	minPrice: null,
	maxPrice: null,
	minBeds: null,
	community: null,
	golfRelevance: []
};

export type PaginationMeta = {
	totalPages: number;
	start: number;
	end: number;
	hasPrev: boolean;
	hasNext: boolean;
};

function parsePositiveInt(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 0) return null;
	return parsed;
}

function parseSort(value: string | null): ListingSort {
	if (value && (SORT_VALUES as readonly string[]).includes(value)) {
		return value as ListingSort;
	}
	return DEFAULT_LISTING_SEARCH_PARAMS.sort;
}

function parsePropertyType(value: string | null): PropertyTypeValue | null {
	if (value && (PROPERTY_TYPE_VALUES as readonly string[]).includes(value)) {
		return value as PropertyTypeValue;
	}
	return null;
}

function parseMinBeds(value: string | null): number | null {
	const parsed = parsePositiveInt(value);
	return parsed != null && parsed >= 1 ? parsed : null;
}

/** Validate a community slug from the URL — lowercase, hyphen-separated alphanumerics only. */
const COMMUNITY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseCommunity(value: string | null): string | null {
	if (!value) return null;
	const trimmed = value.trim().toLowerCase();
	return COMMUNITY_SLUG_PATTERN.test(trimmed) ? trimmed : null;
}

function parseGolfRelevance(values: string[]): GolfRelevanceValue[] {
	const allowed = new Set<string>(GOLF_RELEVANCE_VALUES);
	const seen = new Set<GolfRelevanceValue>();

	for (const value of values) {
		if (allowed.has(value)) {
			seen.add(value as GolfRelevanceValue);
		}
	}

	return [...seen].sort();
}

/** Parse URL search params into a validated listing search state. */
export function parseListingSearchParams(url: URL): ListingSearchParams {
	const pageRaw = parsePositiveInt(url.searchParams.get('page'));
	const page = pageRaw == null || pageRaw < 1 ? 1 : pageRaw;

	return {
		page,
		sort: parseSort(url.searchParams.get('sort')),
		propertyType: parsePropertyType(url.searchParams.get('propertyType')),
		minPrice: parsePositiveInt(url.searchParams.get('minPrice')),
		maxPrice: parsePositiveInt(url.searchParams.get('maxPrice')),
		minBeds: parseMinBeds(url.searchParams.get('minBeds')),
		community: parseCommunity(url.searchParams.get('community')),
		golfRelevance: parseGolfRelevance(url.searchParams.getAll('golfRelevance'))
	};
}

function appendIfSet(params: URLSearchParams, key: string, value: string | number | null | undefined) {
	if (value == null || value === '') return;
	params.set(key, String(value));
}

/** Serialize listing search params, omitting defaults and using deterministic order. */
export function serializeListingSearchParams(params: ListingSearchParams): URLSearchParams {
	const searchParams = new URLSearchParams();

	if (params.page !== DEFAULT_LISTING_SEARCH_PARAMS.page) {
		searchParams.set('page', String(params.page));
	}

	if (params.sort !== DEFAULT_LISTING_SEARCH_PARAMS.sort) {
		searchParams.set('sort', params.sort);
	}

	appendIfSet(searchParams, 'propertyType', params.propertyType);
	appendIfSet(searchParams, 'minPrice', params.minPrice);
	appendIfSet(searchParams, 'maxPrice', params.maxPrice);
	appendIfSet(searchParams, 'minBeds', params.minBeds);
	appendIfSet(searchParams, 'community', params.community);

	for (const value of params.golfRelevance) {
		searchParams.append('golfRelevance', value);
	}

	return searchParams;
}

/** Build pagination metadata for result summaries and controls. */
export function buildPaginationMeta({
	total,
	page,
	pageSize
}: {
	total: number;
	page: number;
	pageSize: number;
}): PaginationMeta {
	const safePageSize = Math.max(pageSize, 1);
	const totalPages = Math.max(Math.ceil(total / safePageSize), total === 0 ? 0 : 1);
	const safePage = Math.min(Math.max(page, 1), totalPages || 1);
	const start = total === 0 ? 0 : (safePage - 1) * safePageSize + 1;
	const end = total === 0 ? 0 : Math.min(safePage * safePageSize, total);

	return {
		totalPages,
		start,
		end,
		hasPrev: safePage > 1,
		hasNext: totalPages > 0 && safePage < totalPages
	};
}

/** Merge params with overrides and return URLSearchParams for filter/sort/pagination links. */
export function listingSearchParamsToQueryParams(
	params: ListingSearchParams,
	overrides: Partial<ListingSearchParams> = {}
): URLSearchParams {
	return serializeListingSearchParams({ ...params, ...overrides });
}

/** Build a path + query string for listing search links. */
export function buildListingSearchHref(
	basePath: string,
	params: ListingSearchParams,
	overrides: Partial<ListingSearchParams> = {}
): string {
	const query = listingSearchParamsToQueryParams(params, overrides).toString();
	return query ? `${basePath}?${query}` : basePath;
}
