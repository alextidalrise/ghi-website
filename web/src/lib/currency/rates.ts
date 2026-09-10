/**
 * Currency conversion rates for EUR-normalised price sort and filtering.
 *
 * The site stores each listing's price in its native currency. Price sort and the
 * min/max price facets must compare a single currency, so every native amount is
 * converted to a EUR-equivalent before it is compared. Display is unaffected — cards
 * still render the native price.
 *
 * This module is deliberately free of Sanity imports and side-effect-free: the live
 * rates (a daily-refreshed Sanity settings doc) are read by `rates.server.ts` and passed
 * IN to the helpers here as a `RateTable`. `FALLBACK_RATES` is the static snapshot the
 * helpers default to when no live table is supplied (tests, non-request code paths, and
 * any failure to read the doc). Callers that pass nothing keep working unchanged.
 *
 * Rates are "EUR per 1 unit of the currency", so `native * table[cur]` is the
 * EUR-equivalent. Sourced from the ECB euro reference rates on RATES_AS_OF. AED has no
 * ECB reference rate — it is pegged at 3.6725 AED per USD, so it is derived from USD.
 */

export const CURRENCIES = ['EUR', 'GBP', 'USD', 'AED'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** A full set of conversion rates: EUR per 1 unit of each currency (EUR is always 1). */
export type RateTable = Record<Currency, number>;

/** ECB euro reference rates, units of currency per 1 EUR, as published on RATES_AS_OF. */
const ECB_PER_EUR = { USD: 1.1652, GBP: 0.85898 } as const;
/** AED/USD peg — fixed by the UAE central bank. */
export const AED_PER_USD = 3.6725;

export const RATES_AS_OF = '2026-09-09';

/**
 * Build a EUR-per-unit `RateTable` from ECB-style "units per 1 EUR" quotes. AED is
 * derived from the USD quote via the fixed peg rather than quoted separately. This is the
 * single place the peg and the reciprocal live, shared by the static fallback and the
 * live server-side source so the two can never diverge.
 */
export function ratesFromPerEur(perEur: { usdPerEur: number; gbpPerEur: number }): RateTable {
	return {
		EUR: 1,
		GBP: 1 / perEur.gbpPerEur,
		USD: 1 / perEur.usdPerEur,
		AED: 1 / (perEur.usdPerEur * AED_PER_USD)
	};
}

/** Static snapshot used whenever a live table is unavailable. */
export const FALLBACK_RATES: RateTable = ratesFromPerEur({
	usdPerEur: ECB_PER_EUR.USD,
	gbpPerEur: ECB_PER_EUR.GBP
});

/** @deprecated Retained for existing imports — same object as {@link FALLBACK_RATES}. */
export const EUR_PER_UNIT: RateTable = FALLBACK_RATES;

function isCurrency(value: string | null | undefined): value is Currency {
	return value != null && (CURRENCIES as readonly string[]).includes(value);
}

/**
 * EUR-equivalent of a native amount. Unknown or missing currency is treated as EUR
 * (×1) — the assumption the rest of the site already makes for a bare price.
 */
export function toEur(
	amount: number,
	currency?: string | null,
	rates: RateTable = FALLBACK_RATES
): number {
	return amount * (isCurrency(currency) ? rates[currency] : 1);
}

/**
 * GROQ params for the EUR-normalised price expression (see PRICE_NUMERIC_EUR). Only the
 * non-EUR currencies need a param; EUR falls through to the literal 1 in the expression.
 * Defaults to the static fallback when no live table is threaded through.
 */
export function rateQueryParams(
	rates: RateTable = FALLBACK_RATES
): { rateGBP: number; rateUSD: number; rateAED: number } {
	return {
		rateGBP: rates.GBP,
		rateUSD: rates.USD,
		rateAED: rates.AED
	};
}
