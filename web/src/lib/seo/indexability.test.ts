import { describe, expect, it } from 'vitest';
import { hasIndexAffectingQuery } from './indexability';
import { DEFAULT_LISTING_SEARCH_PARAMS, type ListingSearchParams } from '$lib/listing/searchParams';

function withOverrides(overrides: Partial<ListingSearchParams>): ListingSearchParams {
	return { ...DEFAULT_LISTING_SEARCH_PARAMS, ...overrides };
}

describe('hasIndexAffectingQuery', () => {
	it('returns false for default params', () => {
		expect(hasIndexAffectingQuery(DEFAULT_LISTING_SEARCH_PARAMS)).toBe(false);
	});

	it('returns true for page > 1', () => {
		expect(hasIndexAffectingQuery(withOverrides({ page: 2 }))).toBe(true);
	});

	it('returns true for non-default sort', () => {
		expect(hasIndexAffectingQuery(withOverrides({ sort: 'price_asc' }))).toBe(true);
	});

	it('returns true for propertyType filter', () => {
		expect(hasIndexAffectingQuery(withOverrides({ propertyType: 'villa' }))).toBe(true);
	});

	it('returns true for minPrice filter', () => {
		expect(hasIndexAffectingQuery(withOverrides({ minPrice: 500000 }))).toBe(true);
	});

	it('returns true for maxPrice filter', () => {
		expect(hasIndexAffectingQuery(withOverrides({ maxPrice: 2000000 }))).toBe(true);
	});

	it('returns true for minBeds filter', () => {
		expect(hasIndexAffectingQuery(withOverrides({ minBeds: 3 }))).toBe(true);
	});

	it('returns true for golfRelevance filter', () => {
		expect(hasIndexAffectingQuery(withOverrides({ golfRelevance: ['frontline_golf'] }))).toBe(true);
	});

	it('returns true for golfCourse filter', () => {
		expect(hasIndexAffectingQuery(withOverrides({ golfCourse: ['aloha-golf'] }))).toBe(true);
	});

	it('returns true for features filter', () => {
		expect(hasIndexAffectingQuery(withOverrides({ features: ['pool'] }))).toBe(true);
	});

	it('ignores community (handled separately by location route)', () => {
		expect(hasIndexAffectingQuery(withOverrides({ community: 'marbella' }))).toBe(false);
	});

	it('returns true for multiple active filters', () => {
		expect(
			hasIndexAffectingQuery(withOverrides({ page: 3, sort: 'price_desc', minBeds: 2 }))
		).toBe(true);
	});
});
