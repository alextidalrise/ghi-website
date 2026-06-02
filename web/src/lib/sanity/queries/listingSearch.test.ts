import { describe, expect, it } from 'vitest';
import { listingSearchQueryParams } from './listingSearch';

describe('listingSearchQueryParams', () => {
	it('always supplies facet params referenced in listing search GROQ', () => {
		expect(
			listingSearchQueryParams(
				{ type: 'global' },
				{ golfRelevance: ['frontline_golf'], start: 0, end: 8 }
			)
		).toEqual({
			propertyType: null,
			community: null,
			minPrice: null,
			maxPrice: null,
			minBeds: null,
			golfRelevance: ['frontline_golf'],
			start: 0,
			end: 8
		});
	});
});
