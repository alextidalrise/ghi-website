import { describe, expect, it } from 'vitest';
import {
	analyticsPrice,
	ITEM_BRAND,
	toAnalyticsItem,
	toAnalyticsItems,
	toAnalyticsItemsByPosition,
	type ItemSource
} from './item';

function property(overrides: Partial<ItemSource> = {}): ItemSource {
	return {
		ghiListingId: 'GHI00123',
		title: 'Front-line villa with sea views',
		listingKind: 'property',
		propertyType: 'villa',
		countrySlug: 'spain',
		locationSlug: 'marbella',
		pricing: { price: 1_250_000, currency: 'EUR' },
		...overrides
	};
}

describe('analyticsPrice', () => {
	it('reports a confirmed price with its currency', () => {
		expect(analyticsPrice(property())).toEqual({ price: 1_250_000, currency: 'EUR' });
	});

	it('defaults the currency to EUR when the listing omits it', () => {
		expect(analyticsPrice(property({ pricing: { price: 500_000 } })).currency).toBe('EUR');
	});

	it('respects a non-euro currency', () => {
		expect(analyticsPrice(property({ pricing: { price: 900_000, currency: 'GBP' } })).currency).toBe(
			'GBP'
		);
	});

	it('sends nothing for a price-on-application listing', () => {
		// What filterPublicPricing() produces when priceConfirmed === false.
		expect(analyticsPrice(property({ pricing: { priceDisplay: 'POA', currency: 'EUR' } }))).toEqual({});
	});

	it('sends nothing when there is no pricing object at all', () => {
		expect(analyticsPrice(property({ pricing: null }))).toEqual({});
	});

	it('sends nothing for an enquiry-led development', () => {
		const source = property({
			listingKind: 'development',
			developmentDisplayMode: 'enquiry_led',
			pricing: { price: 750_000, currency: 'EUR' }
		});
		expect(analyticsPrice(source)).toEqual({});
	});

	it('still reports a price for a development that shows pricing', () => {
		const source = property({
			listingKind: 'development',
			developmentDisplayMode: 'price_from_summary',
			pricing: { priceFrom: 450_000, currency: 'EUR' }
		});
		expect(analyticsPrice(source)).toEqual({ price: 450_000, currency: 'EUR' });
	});

	it('falls back to priceFrom when there is no single price', () => {
		expect(analyticsPrice(property({ pricing: { priceFrom: 450_000 } })).price).toBe(450_000);
	});

	it('omits a zero or negative price rather than sending it', () => {
		expect(analyticsPrice(property({ pricing: { price: 0, currency: 'EUR' } }))).toEqual({});
		expect(analyticsPrice(property({ pricing: { price: -1 } }))).toEqual({});
	});

	it('omits a non-finite price', () => {
		expect(analyticsPrice(property({ pricing: { price: Number.NaN } }))).toEqual({});
		expect(analyticsPrice(property({ pricing: { price: Number.POSITIVE_INFINITY } }))).toEqual({});
	});
});

describe('toAnalyticsItem', () => {
	it('builds a complete item from a property card', () => {
		expect(toAnalyticsItem(property())).toEqual({
			item_id: 'GHI00123',
			item_name: 'Front-line villa with sea views',
			item_brand: ITEM_BRAND,
			item_category: 'property',
			item_category2: 'villa',
			item_category3: 'spain',
			item_category4: 'marbella',
			price: 1_250_000,
			currency: 'EUR'
		});
	});

	it('returns null when the GHI id is missing, and never leaks a Sanity _id', () => {
		expect(toAnalyticsItem(property({ ghiListingId: null }))).toBeNull();
		expect(toAnalyticsItem(property({ ghiListingId: '  ' }))).toBeNull();
		expect(toAnalyticsItem(null)).toBeNull();
		expect(toAnalyticsItem(undefined)).toBeNull();
	});

	it('categorises a development from its display mode', () => {
		const item = toAnalyticsItem(property({ developmentDisplayMode: 'units', listingKind: null }));
		expect(item?.item_category).toBe('development');
	});

	it('lets the caller mark a unit, which the CMS stores as a property', () => {
		expect(toAnalyticsItem(property(), { kind: 'unit' })?.item_category).toBe('unit');
	});

	it('omits categories the listing does not have', () => {
		const item = toAnalyticsItem(
			property({ propertyType: null, countrySlug: null, locationSlug: null, title: null })
		);
		expect(item).not.toHaveProperty('item_category2');
		expect(item).not.toHaveProperty('item_category3');
		expect(item).not.toHaveProperty('item_name');
	});

	it('omits price and currency together for a POA listing', () => {
		const item = toAnalyticsItem(property({ pricing: { priceDisplay: 'POA' } }));
		expect(item).not.toHaveProperty('price');
		expect(item).not.toHaveProperty('currency');
	});

	it('reads the taxonomy from a detail document, which nests it under location', () => {
		// Cards flatten the slugs; detail pages nest them. Both must produce the same
		// dimensions, or view_item silently loses country and location.
		const detail = toAnalyticsItem({
			ghiListingId: 'GHI00130',
			title: 'Monte Rei Golf & Country Club',
			listingKind: 'development',
			countrySlug: null,
			locationSlug: null,
			location: { country: { slug: 'portugal' }, location: { slug: 'monte-rei' } }
		});
		expect(detail?.item_category3).toBe('portugal');
		expect(detail?.item_category4).toBe('monte-rei');
	});

	it('prefers the card-level slugs when both shapes are present', () => {
		const item = toAnalyticsItem(
			property({ location: { country: { slug: 'wrong' }, location: { slug: 'wrong' } } })
		);
		expect(item?.item_category3).toBe('spain');
		expect(item?.item_category4).toBe('marbella');
	});

	it('attaches list context and position when given', () => {
		const item = toAnalyticsItem(property(), {
			list: { list_id: 'featured', list_name: 'Featured listings' },
			index: 3
		});
		expect(item?.item_list_id).toBe('featured');
		expect(item?.item_list_name).toBe('Featured listings');
		expect(item?.index).toBe(3);
	});

	it('keeps index 0, which is a real position rather than an absent one', () => {
		expect(toAnalyticsItem(property(), { index: 0 })?.index).toBe(0);
	});
});

describe('toAnalyticsItems', () => {
	const list = { list_id: 'similar', list_name: 'Similar properties' };

	it('maps a SimilarListingCard union, tagging developments correctly', () => {
		const items = toAnalyticsItems(
			[
				{ kind: 'property', card: property({ ghiListingId: 'GHI1' }) },
				{ kind: 'development', card: property({ ghiListingId: 'GHI2' }) }
			],
			list
		);
		expect(items.map((i) => i.item_category)).toEqual(['property', 'development']);
		expect(items.every((i) => i.item_list_id === 'similar')).toBe(true);
	});

	it('preserves original positions when an unidentifiable listing is dropped', () => {
		// The middle card has no GHI id, so it is not reported — but the third card must
		// still report index 2, so impressions and clicks agree on position.
		const items = toAnalyticsItems(
			[
				{ kind: 'property', card: property({ ghiListingId: 'GHI1' }) },
				{ kind: 'property', card: property({ ghiListingId: null }) },
				{ kind: 'property', card: property({ ghiListingId: 'GHI3' }) }
			],
			list
		);
		expect(items).toHaveLength(2);
		expect(items.map((i) => i.index)).toEqual([0, 2]);
	});

	it('accepts a bare card array as well as the union shape', () => {
		const items = toAnalyticsItems([property({ ghiListingId: 'GHI9' })], list);
		expect(items[0].item_id).toBe('GHI9');
	});

	it('returns an empty array for an empty list', () => {
		expect(toAnalyticsItems([], list)).toEqual([]);
	});
});

describe('toAnalyticsItemsByPosition', () => {
	const list = { list_id: 'featured', list_name: 'Featured listings' };

	it('stays aligned with the source array, leaving holes for unreportable listings', () => {
		// Containers hand a card its item by array position, so the holes must be kept —
		// compacting here would give every card after a gap the wrong listing.
		const result = toAnalyticsItemsByPosition(
			[
				{ kind: 'property', card: property({ ghiListingId: 'GHI1' }) },
				{ kind: 'property', card: property({ ghiListingId: null }) },
				{ kind: 'property', card: property({ ghiListingId: 'GHI3' }) }
			],
			list
		);
		expect(result).toHaveLength(3);
		expect(result[0]?.item_id).toBe('GHI1');
		expect(result[1]).toBeNull();
		expect(result[2]?.item_id).toBe('GHI3');
	});

	it('agrees with toAnalyticsItems once the holes are removed', () => {
		const cards = [
			{ kind: 'property', card: property({ ghiListingId: 'GHI1' }) },
			{ kind: 'property', card: property({ ghiListingId: null }) }
		];
		expect(toAnalyticsItemsByPosition(cards, list).filter(Boolean)).toEqual(
			toAnalyticsItems(cards, list)
		);
	});
});
