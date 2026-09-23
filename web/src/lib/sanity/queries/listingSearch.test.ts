import { describe, expect, it } from 'vitest';
import {
	buildListingCardsCountQuery,
	buildLocationGridIds,
	buildPaginatedListingCardsQuery,
	buildPinnedListingCardsQuery,
	listingSearchQueryParams,
	mergePinnedPage,
	pinnedRestStart
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
			{ EUR: 1, GBP: 1.2, USD: 0.9, AED: 0.25, RUB: 0.01 }
		);
		expect(params).toMatchObject({ rateGBP: 1.2, rateUSD: 0.9, rateAED: 0.25 });
	});
});

describe('country facet filter', () => {
	it('matches the listing country, falling back to the community ancestry', () => {
		const query = buildListingCardsCountQuery({ type: 'global' });
		expect(query).toContain('!defined($country)');
		expect(query).toContain(
			'coalesce(location.country->slug.current, location.community->parent->parent->slug.current) == $country'
		);
	});

	it('supplies country, or null when unset', () => {
		expect(listingSearchQueryParams({ type: 'global' }, { country: 'spain' })).toMatchObject({
			country: 'spain'
		});
		expect(listingSearchQueryParams({ type: 'global' }, {})).toMatchObject({ country: null });
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

describe('buildPinnedListingCardsQuery', () => {
	const location = {
		type: 'location' as const,
		countrySlug: 'spain',
		locationSlug: 'marbella',
		locationId: 'loc-a',
		locationIds: ['loc-a', 'loc-b']
	};

	it('reads each grid from its own pin source', () => {
		expect(buildPinnedListingCardsQuery({ type: 'country', countrySlug: 'spain' })).toContain(
			'type == "country" && slug.current == $countrySlug][0].pinnedListings'
		);
		expect(buildPinnedListingCardsQuery(location)).toContain('*[_id == $pinSourceId][0].pinnedListings');
		expect(buildPinnedListingCardsQuery({ type: 'golfCourse', golfCourseId: 'gc' })).toContain(
			'*[_id == $golfCourseId][0].pinnedListings'
		);
		expect(buildPinnedListingCardsQuery({ type: 'frontlineCollection' })).toContain(
			'.frontlinePinnedListings'
		);
	});

	it('returns null for scopes without pins', () => {
		expect(buildPinnedListingCardsQuery({ type: 'global' })).toBeNull();
	});

	it('limits the Front Line Collection to curated frontline listings, pins included', () => {
		const query = buildPinnedListingCardsQuery({ type: 'frontlineCollection' })!;
		// Both the pinned rows and the natural rows carry the curated filter.
		expect(query.match(/includeInFrontlineCollection == true/g)).toHaveLength(2);
		expect(query).toContain('coalesce(golf.golfRelevance, "") == "frontline_golf"');
		expect(buildListingCardsCountQuery({ type: 'frontlineCollection' })).toContain(
			'includeInFrontlineCollection == true'
		);
		expect(buildListingCardsCountQuery({ type: 'global' })).not.toContain(
			'includeInFrontlineCollection'
		);
	});

	it('filters pins like the grid, caps them, and keeps them out of the natural rows', () => {
		const query = buildPinnedListingCardsQuery(location)!;
		expect(query).toContain('pinnedListings[0...6]');
		// Pins pass through the same scope + facet filters as every other row.
		expect(query.match(/location\.location\._ref in \$locationIds/g)?.length).toBe(2);
		expect(query).toContain('!(_id in coalesce(');
		expect(query).toContain('_createdAt desc, _id asc)[$restStart...$end]');
	});

	it('supplies every param the pinned query references', () => {
		const query = buildPinnedListingCardsQuery(location)!;
		const params = listingSearchQueryParams(location, { start: 24, end: 48, restStart: 18 });
		const referenced = new Set(query.match(/\$[A-Za-z]+/g)!.map((name) => name.slice(1)));
		// $publishedStatus / $previewAll are added by fetchPublic.
		for (const name of referenced) {
			if (name === 'publishedStatus' || name === 'previewAll') continue;
			expect(params, `$${name}`).toHaveProperty(name);
		}
		expect(params).toMatchObject({ restStart: 18, end: 48 });
	});

	it('supplies the pin source id for location scopes', () => {
		expect(listingSearchQueryParams(location, { start: 0, end: 24 })).toMatchObject({
			pinSourceId: 'loc-a',
			locationIds: ['loc-a', 'loc-b']
		});
	});
});

describe('mergePinnedPage', () => {
	const PAGE = 24;
	const pinned = ['p1', 'p2', 'p3'];
	// The unsorted grid as one list: pins, then natural rows n0, n1, …
	const natural = Array.from({ length: 60 }, (_, i) => `n${i}`);
	const page = (n: number, pins: string[]) => {
		const start = (n - 1) * PAGE;
		const end = start + PAGE;
		const restStart = pinnedRestStart(start);
		return mergePinnedPage(pins, natural.slice(restStart, end), { start, end, restStart });
	};

	it('leads page one with the pins, in order', () => {
		expect(page(1, pinned)).toEqual([...pinned, ...natural.slice(0, 21)]);
	});

	it('continues the natural order on later pages without repeating or skipping', () => {
		const all = [...page(1, pinned), ...page(2, pinned), ...page(3, pinned)];
		expect(all).toEqual([...pinned, ...natural]);
	});

	it('is the plain natural order with no pins', () => {
		expect(page(2, [])).toEqual(natural.slice(24, 48));
	});

	it('handles the maximum pin count', () => {
		const six = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
		expect([...page(1, six), ...page(2, six)]).toEqual([...six, ...natural.slice(0, 42)]);
	});
});
