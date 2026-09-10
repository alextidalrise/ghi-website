import { describe, expect, it } from 'vitest';
import { composePrice, formatListingPrice, formatListingPriceParts } from './formatPrice';

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

describe('formatListingPrice — converted display', () => {
	// 1 GBP = 1.25 EUR, 1 USD = 0.8 EUR, 1 AED = 0.25 EUR: clean reciprocals for readable sums.
	const rates = { EUR: 1, GBP: 1.25, USD: 0.8, AED: 0.25 };

	it('converts to the target currency, rounds to 3 s.f. and marks it approximate', () => {
		expect(formatListingPrice({ price: 1_245_000, currency: 'EUR' }, { to: 'GBP', rates })).toBe(
			'approx. £996,000'
		);
		expect(formatListingPrice({ price: 22_500_000, currency: 'AED' }, { to: 'EUR', rates })).toBe(
			'approx. €5,630,000'
		);
	});

	it('keeps a same-currency price exact with no marker', () => {
		expect(formatListingPrice({ price: 1_245_000, currency: 'EUR' }, { to: 'EUR', rates })).toBe(
			'€1,245,000'
		);
	});

	it('keeps the qualifier in front of the marker', () => {
		expect(
			formatListingPrice(
				{ price: 515_000, currency: 'EUR', priceQualifier: 'from' },
				{ to: 'GBP', rates }
			)
		).toBe('From approx. £412,000');
		expect(formatListingPrice({ priceFrom: 515_000, currency: 'EUR' }, { to: 'GBP', rates })).toBe(
			'From approx. £412,000'
		);
	});

	it('rounds each end of a range independently', () => {
		expect(
			formatListingPrice(
				{ priceFrom: 449_000, priceTo: 774_000, currency: 'EUR' },
				{ to: 'GBP', rates }
			)
		).toBe('approx. £359,000 – £619,000');
	});

	it('never converts POA or free text', () => {
		expect(formatListingPrice({ priceDisplay: 'POA' }, { to: 'GBP', rates })).toBe('POA');
		expect(
			formatListingPrice({ priceDisplay: 'Prices on request' }, { to: 'GBP', rates })
		).toBe('Prices on request');
	});

	it('leaves a malformed native code alone', () => {
		expect(formatListingPrice({ price: 500_000, currency: 'AE' }, { to: 'GBP', rates })).toBe(
			'AE 500,000'
		);
	});
});

describe('formatListingPriceParts', () => {
	it('reports the kind so callers can frame without inspecting the string', () => {
		expect(formatListingPriceParts({ price: 525_000, currency: 'EUR' })).toEqual({
			kind: 'single',
			prefix: null,
			figure: '€525,000',
			currency: 'EUR',
			approx: false
		});
		expect(formatListingPriceParts({ priceFrom: 1, priceTo: 2, currency: 'EUR' })?.kind).toBe(
			'range'
		);
		expect(formatListingPriceParts({ priceDisplay: 'POA' })?.kind).toBe('poa');
		expect(formatListingPriceParts({ priceDisplay: 'Ask' })?.kind).toBe('text');
		expect(formatListingPriceParts({ currency: 'EUR' })).toBeNull();
	});

	it('composes back to the one-line form', () => {
		const parts = formatListingPriceParts(
			{ price: 1_000_000, currency: 'EUR', priceQualifier: 'guide' },
			{ to: 'USD', rates: { EUR: 1, GBP: 1.25, USD: 0.8, AED: 0.25 } }
		)!;
		expect(composePrice(parts)).toBe('Guide approx. US$1,250,000');
	});
});
