import { describe, expect, it } from 'vitest';
import {
	budgetBands,
	currencyPrefix,
	displayFromEur,
	eurFromDisplay,
	formatMoneyRange,
	shortMoney
} from './filterPrice';

// 1 GBP = 1.25 EUR, 1 USD = 0.8 EUR, 1 AED = 0.25 EUR: clean reciprocals for readable sums.
const rates = { EUR: 1, GBP: 1.25, USD: 0.8, AED: 0.25, RUB: 0.01 };

describe('eurFromDisplay / displayFromEur', () => {
	it('passes EUR through untouched in both directions', () => {
		// No conversion and no rounding: a typed euro figure is exact, as before Step 4.
		expect(eurFromDisplay(1_234_567, 'EUR', rates)).toBe(1_234_567);
		expect(displayFromEur(1_234_567, 'EUR', rates)).toBe(1_234_567);
	});

	it('converts a chosen-currency figure to EUR for the URL', () => {
		expect(eurFromDisplay(1_000_000, 'GBP', rates)).toBe(1_250_000);
		expect(eurFromDisplay(500_000, 'GBP', rates)).toBe(625_000);
		expect(eurFromDisplay(2_000_000, 'AED', rates)).toBe(500_000);
	});

	it('converts a EUR figure back to the chosen currency for display', () => {
		expect(displayFromEur(1_250_000, 'GBP', rates)).toBe(1_000_000);
		expect(displayFromEur(500_000, 'AED', rates)).toBe(2_000_000);
	});

	it('round-trips a round figure back to itself', () => {
		// The reason display rounds to 3 s.f. and EUR to 4: a figure the visitor typed comes
		// back unchanged when they reopen the filter, even at an awkward real-world rate.
		const real = { EUR: 1, GBP: 1 / 0.85898, USD: 1 / 1.1652, AED: 1 / (1.1652 * 3.6725), RUB: 1 / 97.3 };
		for (const currency of ['GBP', 'USD', 'AED'] as const) {
			for (const typed of [500_000, 1_000_000, 2_000_000, 5_000_000]) {
				const eur = eurFromDisplay(typed, currency, real);
				expect(displayFromEur(eur, currency, real)).toBe(typed);
			}
		}
	});
});

describe('shortMoney', () => {
	it('abbreviates with the currency symbol', () => {
		expect(shortMoney(500_000, 'GBP')).toBe('£500k');
		expect(shortMoney(1_000_000, 'USD')).toBe('$1M');
		expect(shortMoney(1_250_000, 'EUR')).toBe('€1.25M');
		expect(shortMoney(2_000_000, 'AED')).toBe('AED 2M');
	});
});

describe('formatMoneyRange', () => {
	it('renders the four min/max shapes in the chosen currency', () => {
		expect(formatMoneyRange(500_000, 1_000_000, 'GBP')).toBe('£500k–£1M');
		expect(formatMoneyRange(500_000, null, 'GBP')).toBe('£500k+');
		expect(formatMoneyRange(null, 1_000_000, 'GBP')).toBe('Up to £1M');
		expect(formatMoneyRange(null, null, 'GBP')).toBe('');
	});
});

describe('budgetBands', () => {
	it('keeps the euro ladder byte-for-byte identical to the pre-Step-4 bands', () => {
		expect(budgetBands('EUR', rates)).toEqual([
			{ value: 'b1', label: 'Up to €500k', min: null, max: 500_000 },
			{ value: 'b2', label: '€500k – €1M', min: 500_000, max: 1_000_000 },
			{ value: 'b3', label: '€1M – €2M', min: 1_000_000, max: 2_000_000 },
			{ value: 'b4', label: '€2M – €5M', min: 2_000_000, max: 5_000_000 },
			{ value: 'b5', label: '€5M+', min: 5_000_000, max: null }
		]);
	});

	it('labels the ladder in the chosen currency but keeps EUR bounds for the query', () => {
		const gbp = budgetBands('GBP', rates);
		expect(gbp.map((band) => band.label)).toEqual([
			'Up to £500k',
			'£500k – £1M',
			'£1M – £2M',
			'£2M – £5M',
			'£5M+'
		]);
		// £500k–£1M rides in the URL as its EUR equivalent, €625k–€1.25M.
		expect(gbp[1]).toMatchObject({ min: 625_000, max: 1_250_000 });
		// Stable keys let a chosen band survive a currency switch.
		expect(gbp.map((band) => band.value)).toEqual(['b1', 'b2', 'b3', 'b4', 'b5']);
	});

	it('scales the dirham ladder to its own magnitude', () => {
		const aed = budgetBands('AED', rates);
		expect(aed.map((band) => band.label)).toEqual([
			'Up to AED 2M',
			'AED 2M – AED 5M',
			'AED 5M – AED 10M',
			'AED 10M – AED 20M',
			'AED 20M+'
		]);
		expect(aed[0].max).toBe(500_000); // AED 2M = €500k
	});
});

describe('the rouble', () => {
	// ~97 RUB to the euro, so the euro ladder converted mechanically would read
	// "₽48.65M – ₽97.3M". The rouble gets its own round rungs instead.
	const rubRates = { EUR: 1, GBP: 1.25, USD: 0.8, AED: 0.25, RUB: 1 / 97.3 };

	it('uses its own round edges rather than converted euro ones', () => {
		const labels = budgetBands('RUB', rubRates).map((band) => band.label);
		expect(labels).toEqual([
			'Up to ₽50M',
			'₽50M – ₽100M',
			'₽100M – ₽200M',
			'₽200M – ₽500M',
			'₽500M+'
		]);
	});

	it('still emits euro bounds, so the rungs line up with the euro market', () => {
		const [, second] = budgetBands('RUB', rubRates);
		expect(second.min).toBeCloseTo(513_900, 0);
		expect(second.max).toBeCloseTo(1_028_000, 0);
	});

	it('takes the rouble sign as its input adornment', () => {
		expect(currencyPrefix('RUB')).toBe('₽');
	});
});
