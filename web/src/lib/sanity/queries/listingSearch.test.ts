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
		expect(query).toContain('golf.primaryGolfCourse._ref == $golfCourseId');
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
