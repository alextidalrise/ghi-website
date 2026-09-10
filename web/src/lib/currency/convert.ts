/**
 * Display-side currency conversion: the maths behind "approx. £1,050,000".
 *
 * Pure and Sanity-free, like `rates.ts`. A `RateTable` is EUR per 1 unit of each currency,
 * so converting `from` → `to` is `amount × rates[from] ÷ rates[to]`. Converted figures are
 * indicative, never asking prices, so they are rounded to three significant figures before
 * they are shown (decision D-1 / D-6 in docs/currency-switcher-plan.md and the Step 3 brief).
 */

import { CURRENCIES, type Currency, type RateTable } from './rates';

/** Full names for the switcher's menu rows and its live-region announcement. */
export const CURRENCY_NAMES: Record<Currency, string> = {
	EUR: 'Euro',
	GBP: 'Pound sterling',
	USD: 'US dollar',
	AED: 'UAE dirham'
};

export function isCurrency(value: unknown): value is Currency {
	return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

/** Convert a native amount into another currency at the given table. No rounding. */
export function convertAmount(
	amount: number,
	from: Currency,
	to: Currency,
	rates: RateTable
): number {
	if (from === to) return amount;
	return (amount * rates[from]) / rates[to];
}

/**
 * Round to `digits` significant figures, half away from zero. 1,054,321 → 1,050,000;
 * 999,500 → 1,000,000; 2,250 → 2,250. Zero and non-finite values pass through unchanged.
 */
export function roundSignificant(value: number, digits = 3): number {
	if (value === 0 || !Number.isFinite(value)) return value;
	const magnitude = Math.floor(Math.log10(Math.abs(value)));
	const scale = 10 ** (magnitude - digits + 1);
	// Divide by the scale so the rounding happens on a small number (avoids float drift on
	// large scales), then multiply back and round once more to clear any residue.
	const rounded = Math.round(Math.abs(value) / scale) * scale;
	const result = Math.sign(value) * rounded;
	return scale >= 1 ? Math.round(result) : result;
}

/**
 * The figure a visitor who chose `to` should see for a native `amount`. Returns the
 * original amount, marked exact, when no conversion applies (same currency, or a native
 * code the table does not know); otherwise the converted amount rounded to three
 * significant figures, marked approximate.
 */
export function displayAmount(
	amount: number,
	from: string | null | undefined,
	to: string | null | undefined,
	rates: RateTable
): { amount: number; currency: string; approx: boolean } {
	const native = from ?? 'EUR';
	if (!isCurrency(native) || !isCurrency(to) || to === native) {
		return { amount, currency: native, approx: false };
	}
	return { amount: roundSignificant(convertAmount(amount, native, to, rates)), currency: to, approx: true };
}
