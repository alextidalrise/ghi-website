import { describe, expect, it } from 'vitest';
import {
	buildListingCardsCountQuery,
	buildLocationGridIds,
	listingSearchQueryParams
} from './listingSearch';

describe('buildLocationGridIds', () => {
	it('includes the primary location only by default', () => {
		expect(buildLocationGridIds('loc-a', [])).toEqual(['loc-a']);
	});

	it('merges linked locations when includeInGrid is true', () => {
		expect(
			buildLocationGridIds('loc-a', [
				{ includeInGrid: true, location: { _id: 'loc-b' } },
				{ includeInGrid: false, location: { _id: 'loc-c' } },
				{ includeInGrid: true, location: { _id: 'loc-b' } }
			])
		).toEqual(['loc-a', 'loc-b']);
	});
});

describe('golfCourse listing scope', () => {
	it('includes golf course id filter in count query', () => {
		const query = buildListingCardsCountQuery({ type: 'golfCourse', golfCourseId: 'gc-1' });
		expect(query).toContain('$golfCourseId in golf.linkedGolfCourses[]._ref');
	});

	it('passes golfCourseId in query params', () => {
		expect(
			listingSearchQueryParams(
				{ type: 'golfCourse', golfCourseId: 'gc-1' },
				{ start: 0, end: 12 }
			)
		).toMatchObject({ golfCourseId: 'gc-1' });
	});
});

describe('price facet filter', () => {
	it('gates developments on priceConfirmed but lets any priced property through', () => {
		const query = buildListingCardsCountQuery({ type: 'global' });
		expect(query).toContain('_type == "development" && pricing.priceConfirmed == true');
		expect(query).toContain('_type == "propertyListing" && defined(pricing.price)');
	});
});

describe('golfCourse facet filter', () => {
	it('matches on linked course slugs', () => {
		const query = buildListingCardsCountQuery({ type: 'global' });
		expect(query).toContain('count(golf.linkedGolfCourses[@->slug.current in $golfCourse]) > 0');
	});

	it('serializes a populated golfCourse facet, nulls an empty one', () => {
		expect(
			listingSearchQueryParams({ type: 'global' }, { golfCourse: ['valderrama'] })
		).toMatchObject({ golfCourse: ['valderrama'] });
		expect(
			listingSearchQueryParams({ type: 'global' }, { golfCourse: [] })
		).toMatchObject({ golfCourse: null });
	});
});
