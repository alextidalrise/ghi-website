/**
 * Currency conversion rates for EUR-normalised price sort and filtering.
 *
 * The site stores each listing's price in its native currency. Price sort and the
 * min/max price facets must compare a single currency, so every native amount is
 * converted to a EUR-equivalent before it is compared. Display is unaffected — cards
 * still render the native price.
 *
 * This is a STATIC snapshot. Step 2 of the currency project replaces the source with a
 * Sanity settings document refreshed daily by a Vercel cron; keep this module free of
 * Sanity imports so that swap touches only the data, not the callers.
 *
 * Rates are "EUR per 1 unit of the currency", so `native * EUR_PER_UNIT[cur]` is the
 * EUR-equivalent. Sourced from the ECB euro reference rates on RATES_AS_OF. AED has no
 * ECB reference rate — it is pegged at 3.6725 AED per USD, so it is derived from USD.
 */

export const CURRENCIES = ['EUR', 'GBP', 'USD', 'AED'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** ECB euro reference rates, units of currency per 1 EUR, as published on RATES_AS_OF. */
const ECB_PER_EUR = { USD: 1.1652, GBP: 0.85898 } as const;
/** AED/USD peg — fixed by the UAE central bank. */
const AED_PER_USD = 3.6725;

export const RATES_AS_OF = '2026-09-09';

/** EUR per 1 unit of each currency. */
export const EUR_PER_UNIT: Record<Currency, number> = {
	EUR: 1,
	GBP: 1 / ECB_PER_EUR.GBP,
	USD: 1 / ECB_PER_EUR.USD,
	AED: 1 / (ECB_PER_EUR.USD * AED_PER_USD)
};

function isCurrency(value: string | null | undefined): value is Currency {
	return value != null && (CURRENCIES as readonly string[]).includes(value);
}

/**
 * EUR-equivalent of a native amount. Unknown or missing currency is treated as EUR
 * (×1) — the assumption the rest of the site already makes for a bare price.
 */
export function toEur(amount: number, currency?: string | null): number {
	return amount * (isCurrency(currency) ? EUR_PER_UNIT[currency] : 1);
}

/**
 * GROQ params for the EUR-normalised price expression (see PRICE_NUMERIC_EUR). Only the
 * non-EUR currencies need a param; EUR falls through to the literal 1 in the expression.
 */
export function rateQueryParams(): { rateGBP: number; rateUSD: number; rateAED: number } {
	return {
		rateGBP: EUR_PER_UNIT.GBP,
		rateUSD: EUR_PER_UNIT.USD,
		rateAED: EUR_PER_UNIT.AED
	};
}
