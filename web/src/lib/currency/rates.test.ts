import { describe, expect, it } from 'vitest';
import {
	AED_PER_USD,
	EUR_PER_UNIT,
	FALLBACK_RATES,
	rateQueryParams,
	ratesFromPerEur,
	toEur,
	type RateTable
} from './rates';

// A deliberately-different table so tests can tell a threaded table apart from the fallback.
const CUSTOM: RateTable = { EUR: 1, GBP: 1.2, USD: 0.9, AED: 0.25 };

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

	it('defaults to the static fallback when no table is passed', () => {
		expect(rateQueryParams()).toEqual(rateQueryParams(FALLBACK_RATES));
	});

	it('uses a threaded live table over the fallback', () => {
		expect(rateQueryParams(CUSTOM)).toEqual({ rateGBP: 1.2, rateUSD: 0.9, rateAED: 0.25 });
	});
});

describe('toEur with a threaded table', () => {
	it('applies the passed table instead of the fallback', () => {
		expect(toEur(1000, 'GBP', CUSTOM)).toBe(1200);
		expect(toEur(1000, 'USD', CUSTOM)).toBe(900);
		expect(toEur(1000, 'EUR', CUSTOM)).toBe(1000);
	});

	it('still treats unknown currency as EUR with a custom table', () => {
		expect(toEur(1000, 'JPY', CUSTOM)).toBe(1000);
	});
});

describe('ratesFromPerEur', () => {
	it('inverts the per-EUR quotes and derives AED from the USD peg', () => {
		const t = ratesFromPerEur({ usdPerEur: 1.1652, gbpPerEur: 0.85898 });
		expect(t.EUR).toBe(1);
		expect(t.GBP).toBeCloseTo(1 / 0.85898, 10);
		expect(t.USD).toBeCloseTo(1 / 1.1652, 10);
		expect(t.AED).toBeCloseTo(1 / (1.1652 * AED_PER_USD), 10);
	});

	it('produces the same table as the exported fallback for the snapshot quotes', () => {
		expect(ratesFromPerEur({ usdPerEur: 1.1652, gbpPerEur: 0.85898 })).toEqual(FALLBACK_RATES);
	});
});
