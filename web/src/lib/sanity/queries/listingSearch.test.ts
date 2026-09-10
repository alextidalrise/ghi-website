import { describe, expect, it } from 'vitest';
import {
	buildListingCardsCountQuery,
	buildLocationGridIds,
	buildPaginatedListingCardsQuery,
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

describe('EUR-normalised price', () => {
	it('applies the per-currency rate select in the min/max facet branches', () => {
		const query = buildListingCardsCountQuery({ type: 'global' });
		// Both price facet comparisons convert native currency before comparing.
		expect(query).toContain('pricing.currency == "AED" => $rateAED');
		expect(query.match(/\$rateAED/g)?.length).toBeGreaterThanOrEqual(2);
	});

	it('sorts on the same normalised expression', () => {
		const query = buildPaginatedListingCardsQuery({ type: 'global' }, 'price_desc');
		expect(query).toContain('pricing.currency == "GBP" => $rateGBP');
		expect(query).toContain('desc, _id asc');
	});

	it('always supplies the three rate params', () => {
		const params = listingSearchQueryParams({ type: 'global' }, { start: 0, end: 12 });
		expect(params).toMatchObject({
			rateGBP: expect.any(Number),
			rateUSD: expect.any(Number),
			rateAED: expect.any(Number)
		});
	});

	it('threads a live rate table through to the params', () => {
		const params = listingSearchQueryParams(
			{ type: 'global' },
			{ start: 0, end: 12 },
			{ EUR: 1, GBP: 1.2, USD: 0.9, AED: 0.25 }
		);
		expect(params).toMatchObject({ rateGBP: 1.2, rateUSD: 0.9, rateAED: 0.25 });
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

describe('features facet filter', () => {
	it('matches on any selected feature-highlight label (OR)', () => {
		const query = buildListingCardsCountQuery({ type: 'global' });
		expect(query).toContain('content.featureHighlights[');
		expect(query).toContain('lower(label) in $features');
		// Provenance-suffixed labels still match via the comma-split head.
		expect(query).toContain('lower(string::split(label, ",")[0]) in $features');
	});

	it('serializes a populated features facet, nulls an empty one', () => {
		expect(
			listingSearchQueryParams({ type: 'global' }, { features: ['sea view'] })
		).toMatchObject({ features: ['sea view'] });
		expect(listingSearchQueryParams({ type: 'global' }, { features: [] })).toMatchObject({
			features: null
		});
	});
});
