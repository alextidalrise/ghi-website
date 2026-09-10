import { describe, expect, it } from 'vitest';
import { formatListingPrice } from './formatPrice';

describe('formatListingPrice', () => {
	it('formats a plain EUR price', () => {
		expect(formatListingPrice({ price: 1_500_000, currency: 'EUR' })).toBe('€1,500,000');
	});

	it('formats AED, GBP and USD prices with their symbols', () => {
		// en-GB renders AED with a non-breaking space and USD as "US$" — assert the grouped
		// amount and code rather than an exact symbol/whitespace shape.
		expect(formatListingPrice({ price: 22_500_000, currency: 'AED' })).toContain('22,500,000');
		expect(formatListingPrice({ price: 22_500_000, currency: 'AED' })).toContain('AED');
		expect(formatListingPrice({ price: 1_000_000, currency: 'GBP' })).toBe('£1,000,000');
		expect(formatListingPrice({ price: 1_000_000, currency: 'USD' })).toBe('US$1,000,000');
	});

	it('defaults a missing currency to EUR', () => {
		expect(formatListingPrice({ price: 750_000 })).toBe('€750,000');
	});

	it('degrades a malformed currency code instead of throwing', () => {
		// "AE" is not a well-formed ISO code (Intl.NumberFormat throws RangeError on it).
		expect(() => formatListingPrice({ price: 500_000, currency: 'AE' })).not.toThrow();
		expect(formatListingPrice({ price: 500_000, currency: 'AE' })).toBe('AE 500,000');
		// Empty code degrades to a bare grouped number.
		expect(formatListingPrice({ price: 500_000, currency: '' })).toBe('500,000');
	});

	it('renders POA when priceDisplay is POA', () => {
		expect(formatListingPrice({ priceDisplay: 'POA', price: 900_000, currency: 'EUR' })).toBe('POA');
	});

	it('formats a priceFrom/priceTo range', () => {
		expect(formatListingPrice({ priceFrom: 449_000, priceTo: 774_000, currency: 'EUR' })).toBe(
			'€449,000 – €774,000'
		);
	});

	it('prefixes a from-qualified single price', () => {
		expect(formatListingPrice({ price: 673_000, currency: 'EUR', priceQualifier: 'from' })).toBe(
			'From €673,000'
		);
	});

	it('returns null when there is nothing to show', () => {
		expect(formatListingPrice(null)).toBeNull();
		expect(formatListingPrice({ currency: 'EUR' })).toBeNull();
	});
});
