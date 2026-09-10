import { describe, expect, it } from 'vitest';
import { EUR_PER_UNIT, rateQueryParams, toEur } from './rates';

describe('toEur', () => {
	it('leaves EUR unchanged', () => {
		expect(toEur(1_000_000, 'EUR')).toBe(1_000_000);
	});

	it('converts AED to a smaller EUR figure (peg ~4.28 AED/EUR)', () => {
		const eur = toEur(69_950_000, 'AED');
		expect(eur).toBeGreaterThan(15_500_000);
		expect(eur).toBeLessThan(17_000_000);
	});

	it('converts GBP up and USD down relative to the nominal amount', () => {
		expect(toEur(1_000_000, 'GBP')).toBeGreaterThan(1_000_000);
		expect(toEur(1_000_000, 'USD')).toBeLessThan(1_000_000);
	});

	it('treats null and unknown currency as EUR', () => {
		expect(toEur(500_000, null)).toBe(500_000);
		expect(toEur(500_000, 'JPY')).toBe(500_000);
		expect(toEur(500_000, undefined)).toBe(500_000);
	});
});

describe('rateQueryParams', () => {
	it('exposes the three non-EUR rates matching EUR_PER_UNIT', () => {
		expect(rateQueryParams()).toEqual({
			rateGBP: EUR_PER_UNIT.GBP,
			rateUSD: EUR_PER_UNIT.USD,
			rateAED: EUR_PER_UNIT.AED
		});
	});
});
