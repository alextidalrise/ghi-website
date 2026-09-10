import { describe, expect, it } from 'vitest';
import { convertAmount, displayAmount, isCurrency, roundSignificant } from './convert';
import { FALLBACK_RATES, ratesFromPerEur } from './rates';

// A table with clean reciprocals so the expectations are readable by hand:
// 1 GBP = 1.25 EUR, 1 USD = 0.8 EUR, 1 AED = 0.25 EUR.
const RATES = { EUR: 1, GBP: 1.25, USD: 0.8, AED: 0.25 };

describe('roundSignificant', () => {
	it.each([
		[1_054_321, 1_050_000],
		[1_245_000, 1_250_000],
		[999_500, 1_000_000],
		[2_250, 2_250],
		[412_345, 412_000],
		[89_999, 90_000],
		[0, 0],
		[-1_054_321, -1_050_000]
	])('rounds %d to three significant figures → %d', (input, expected) => {
		expect(roundSignificant(input)).toBe(expected);
	});

	it('honours a different digit count and passes non-finite values through', () => {
		expect(roundSignificant(1_234_567, 2)).toBe(1_200_000);
		expect(roundSignificant(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
	});
});

describe('convertAmount', () => {
	it('converts via EUR per unit', () => {
		expect(convertAmount(1_000_000, 'EUR', 'GBP', RATES)).toBe(800_000);
		expect(convertAmount(1_000_000, 'AED', 'EUR', RATES)).toBe(250_000);
		expect(convertAmount(100, 'USD', 'AED', RATES)).toBeCloseTo(320, 10);
	});

	it('is the identity for the same currency', () => {
		expect(convertAmount(123_456, 'GBP', 'GBP', RATES)).toBe(123_456);
	});

	it('agrees with the live table shape (AED derived from the USD peg)', () => {
		const live = ratesFromPerEur({ usdPerEur: 1.1652, gbpPerEur: 0.85898 });
		// 1 USD in AED is the peg itself.
		expect(convertAmount(1, 'USD', 'AED', live)).toBeCloseTo(3.6725, 6);
	});
});

describe('displayAmount', () => {
	it('returns the exact native amount when no conversion applies', () => {
		expect(displayAmount(1_245_000, 'EUR', null, RATES)).toEqual({
			amount: 1_245_000,
			currency: 'EUR',
			approx: false
		});
		expect(displayAmount(1_245_000, 'EUR', 'EUR', RATES).approx).toBe(false);
		// An unknown target leaves the figure alone.
		expect(displayAmount(1_245_000, 'EUR', 'CHF', RATES).approx).toBe(false);
	});

	it('treats a missing native currency as EUR', () => {
		expect(displayAmount(1_000_000, null, 'GBP', RATES)).toEqual({
			amount: 800_000,
			currency: 'GBP',
			approx: true
		});
	});

	it('never converts a native code the table does not know', () => {
		expect(displayAmount(500_000, 'AE', 'GBP', RATES)).toEqual({
			amount: 500_000,
			currency: 'AE',
			approx: false
		});
	});

	it('rounds a conversion to three significant figures and marks it approximate', () => {
		// 1,245,000 EUR → 996,000 GBP at 1.25 (already 3 s.f.).
		expect(displayAmount(1_245_000, 'EUR', 'GBP', RATES)).toEqual({
			amount: 996_000,
			currency: 'GBP',
			approx: true
		});
		// 22,500,000 AED → 5,625,000 EUR → 5,630,000.
		expect(displayAmount(22_500_000, 'AED', 'EUR', RATES).amount).toBe(5_630_000);
	});

	it('works with the static fallback table', () => {
		const shown = displayAmount(1_000_000, 'EUR', 'GBP', FALLBACK_RATES);
		expect(shown.approx).toBe(true);
		expect(shown.amount).toBe(859_000);
	});
});

describe('isCurrency', () => {
	it('accepts the four supported codes only', () => {
		expect(isCurrency('EUR')).toBe(true);
		expect(isCurrency('AED')).toBe(true);
		expect(isCurrency('CHF')).toBe(false);
		expect(isCurrency('eur')).toBe(false);
		expect(isCurrency(null)).toBe(false);
	});
});
