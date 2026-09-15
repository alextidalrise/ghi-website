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
				'https://example.com/spain/marbella?page=2&sort=price_asc&propertyType=villa&minPrice=500000&maxPrice=2000000&minBeds=3&community=nueva-andalucia&country=Spain&location=marbella&golfRelevance=frontline_golf&golfRelevance=golf_view&golfCourse=valderrama&golfCourse=la-reserva&features=Sea%20view&features=private%20pool'
			)
		);

		expect(params).toEqual({
			page: 2,
			sort: 'price_asc',
			propertyType: 'villa',
			minPrice: 500_000,
			maxPrice: 2_000_000,
			minBeds: 3,
			community: 'nueva-andalucia',
			country: 'spain',
			location: 'marbella',
			golfRelevance: ['frontline_golf', 'golf_view'],
			golfCourse: ['la-reserva', 'valderrama'],
			features: ['private pool', 'sea view']
		});
	});

	it('lowercases and de-duplicates feature keys', () => {
		const params = parseListingSearchParams(
			new URL('https://example.com/spain/marbella?features=Sea%20View&features=sea%20view')
		);
		expect(params.features).toEqual(['sea view']);
	});

	it('parses community filter slug', () => {
		const params = parseListingSearchParams(
			new URL('https://example.com/spain/marbella?community=la-quinta')
		);
		expect(params.community).toBe('la-quinta');
	});

	it('falls back to defaults for invalid values and page < 1', () => {
		const params = parseListingSearchParams(
			new URL(
				'https://example.com/spain/marbella?page=0&sort=invalid&propertyType=castle&minPrice=-1&maxPrice=abc&minBeds=0&community=Nueva%20Andalucia!&golfRelevance=not_real'
			)
		);

		expect(params.page).toBe(1);
		expect(params.sort).toBeNull(); // unsorted: the grid leads with pinned listings
		expect(params.propertyType).toBeNull();
		expect(params.minPrice).toBeNull();
		expect(params.maxPrice).toBeNull();
		expect(params.minBeds).toBeNull();
		expect(params.community).toBeNull();
		expect(params.golfRelevance).toEqual([]);
	});

	it('normalizes a valid community slug and rejects non-slug values', () => {
		expect(
			parseListingSearchParams(
				new URL('https://example.com/spain/marbella?community=NUEVA-ANDALUCIA')
			).community
		).toBe('nueva-andalucia');

		expect(
			parseListingSearchParams(new URL('https://example.com/spain/marbella?community=a/b'))
				.community
		).toBeNull();
	});
});

describe('parseListingSearchParams country', () => {
	it('drops a country value that is not a slug', () => {
		expect(
			parseListingSearchParams(new URL('https://example.com/front-line-collection?country=spain%20or%201')).country
		).toBeNull();
	});
});

describe('serializeListingSearchParams', () => {
	it('round-trips parsed params', () => {
		const url = new URL(
			'https://example.com/spain/marbella?page=3&sort=newest&propertyType=apartment&minPrice=250000&maxPrice=900000&minBeds=2&country=portugal&location=vilamoura&golfRelevance=near_golf'
		);
		const parsed = parseListingSearchParams(url);
		const serialized = serializeListingSearchParams(parsed);

		expect(parseListingSearchParams(new URL(`https://example.com/spain/marbella?${serialized}`))).toEqual(
			parsed
		);
	});

	it('omits sort when none was chosen, and clears it via a null override', () => {
		const sorted = parseListingSearchParams(new URL('https://example.com/spain?sort=price_asc'));
		expect(listingSearchParamsToQueryParams(sorted, { sort: null }).get('sort')).toBeNull();
		expect(serializeListingSearchParams({ ...DEFAULT_LISTING_SEARCH_PARAMS }).has('sort')).toBe(false);
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

	it('round-trips repeated feature keys, including labels with spaces', () => {
		const params = {
			...DEFAULT_LISTING_SEARCH_PARAMS,
			features: ['private pool', 'sea view']
		};
		const serialized = serializeListingSearchParams(params);
		expect(serialized.getAll('features')).toEqual(['private pool', 'sea view']);
		expect(
			parseListingSearchParams(new URL(`https://example.com/spain/marbella?${serialized}`)).features
		).toEqual(['private pool', 'sea view']);
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
		const query = listingSearchParamsToQueryParams(params, { page: 3, sort: 'newest' });

		expect(query.get('page')).toBe('3');
		// An explicit Newest is kept: it is a strict sort, distinct from the unsorted default.
		expect(query.get('sort')).toBe('newest');
		expect(query.get('propertyType')).toBe('villa');
	});
});
