import { describe, expect, it } from 'vitest';
import {
	buildPaginationMeta,
	DEFAULT_LISTING_SEARCH_PARAMS,
	listingSearchParamsToQueryParams,
	parseListingSearchParams,
	serializeListingSearchParams
} from './searchParams';

describe('parseListingSearchParams', () => {
	it('returns defaults for an empty query string', () => {
		expect(parseListingSearchParams(new URL('https://example.com/spain/marbella'))).toEqual(
			DEFAULT_LISTING_SEARCH_PARAMS
		);
	});

	it('parses valid filters and normalizes page to at least 1', () => {
		const params = parseListingSearchParams(
			new URL(
				'https://example.com/spain/marbella?page=2&sort=price_asc&propertyType=villa&minPrice=500000&maxPrice=2000000&minBeds=3&golfRelevance=frontline_golf&golfRelevance=golf_view'
			)
		);

		expect(params).toEqual({
			page: 2,
			sort: 'price_asc',
			propertyType: 'villa',
			minPrice: 500_000,
			maxPrice: 2_000_000,
			minBeds: 3,
			golfRelevance: ['frontline_golf', 'golf_view']
		});
	});

	it('falls back to defaults for invalid values and page < 1', () => {
		const params = parseListingSearchParams(
			new URL(
				'https://example.com/spain/marbella?page=0&sort=invalid&propertyType=castle&minPrice=-1&maxPrice=abc&minBeds=0&golfRelevance=not_real'
			)
		);

		expect(params.page).toBe(1);
		expect(params.sort).toBe('title');
		expect(params.propertyType).toBeNull();
		expect(params.minPrice).toBeNull();
		expect(params.maxPrice).toBeNull();
		expect(params.minBeds).toBeNull();
		expect(params.golfRelevance).toEqual([]);
	});
});

describe('serializeListingSearchParams', () => {
	it('round-trips parsed params', () => {
		const url = new URL(
			'https://example.com/spain/marbella?page=3&sort=newest&propertyType=apartment&minPrice=250000&maxPrice=900000&minBeds=2&golfRelevance=near_golf'
		);
		const parsed = parseListingSearchParams(url);
		const serialized = serializeListingSearchParams(parsed);

		expect(parseListingSearchParams(new URL(`https://example.com/spain/marbella?${serialized}`))).toEqual(
			parsed
		);
	});

	it('omits default values from the query string', () => {
		const serialized = serializeListingSearchParams(DEFAULT_LISTING_SEARCH_PARAMS);
		expect(serialized.toString()).toBe('');
	});

	it('serializes repeated golfRelevance params in stable order', () => {
		const serialized = serializeListingSearchParams({
			...DEFAULT_LISTING_SEARCH_PARAMS,
			golfRelevance: ['golf_view', 'frontline_golf']
		});

		expect(serialized.getAll('golfRelevance')).toEqual(['golf_view', 'frontline_golf']);
	});
});

describe('buildPaginationMeta', () => {
	it('returns expected metadata for a populated result set', () => {
		expect(buildPaginationMeta({ total: 50, page: 2, pageSize: 24 })).toEqual({
			totalPages: 3,
			start: 25,
			end: 48,
			hasPrev: true,
			hasNext: true
		});
	});

	it('handles empty result sets', () => {
		expect(buildPaginationMeta({ total: 0, page: 1, pageSize: 24 })).toEqual({
			totalPages: 0,
			start: 0,
			end: 0,
			hasPrev: false,
			hasNext: false
		});
	});
});

describe('listingSearchParamsToQueryParams', () => {
	it('applies overrides for pagination and filter links', () => {
		const params = parseListingSearchParams(
			new URL('https://example.com/spain/marbella?sort=price_desc&propertyType=villa&page=2')
		);
		const query = listingSearchParamsToQueryParams(params, { page: 3, sort: 'title' });

		expect(query.get('page')).toBe('3');
		expect(query.get('sort')).toBeNull();
		expect(query.get('propertyType')).toBe('villa');
	});
});
