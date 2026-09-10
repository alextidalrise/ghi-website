import { describe, expect, it } from 'vitest';
import { exchangeRatesFromDoc } from './rates.server';
import { FALLBACK_RATES, RATES_AS_OF, ratesFromPerEur } from './rates';

describe('exchangeRatesFromDoc', () => {
	it('converts base quotes into a EUR-per-unit table', () => {
		const result = exchangeRatesFromDoc({
			gbpPerEur: 0.85898,
			usdPerEur: 1.1652,
			asOf: '2026-09-09'
		});
		expect(result.source).toBe('sanity');
		expect(result.asOf).toBe('2026-09-09');
		expect(result.rates).toEqual(ratesFromPerEur({ usdPerEur: 1.1652, gbpPerEur: 0.85898 }));
	});

	it('lets a per-rate override win over the derived value', () => {
		const result = exchangeRatesFromDoc({
			gbpPerEur: 0.85898,
			usdPerEur: 1.1652,
			asOf: '2026-09-09',
			aedOverride: 0.3
		});
		expect(result.rates.AED).toBe(0.3);
		// The unoverridden rates still derive from the base quotes.
		expect(result.rates.USD).toBeCloseTo(1 / 1.1652, 10);
	});

	it.each([
		['missing doc', null],
		['missing gbp', { usdPerEur: 1.1652 }],
		['zero usd', { gbpPerEur: 0.85898, usdPerEur: 0 }],
		['negative gbp', { gbpPerEur: -1, usdPerEur: 1.1652 }],
		['NaN', { gbpPerEur: Number.NaN, usdPerEur: 1.1652 }]
	])('falls back on %s', (_label, doc) => {
		const result = exchangeRatesFromDoc(doc as never);
		expect(result.source).toBe('fallback');
		expect(result.rates).toEqual(FALLBACK_RATES);
		expect(result.asOf).toBe(RATES_AS_OF);
	});

	it('ignores a non-positive override and keeps the derived rate', () => {
		const result = exchangeRatesFromDoc({
			gbpPerEur: 0.85898,
			usdPerEur: 1.1652,
			gbpOverride: 0
		});
		expect(result.rates.GBP).toBeCloseTo(1 / 0.85898, 10);
	});
});
