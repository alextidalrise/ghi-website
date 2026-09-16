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
 * EUR-equivalent. USD and GBP come from the ECB euro reference rates on RATES_AS_OF.
 * AED has no ECB reference rate — it is pegged at 3.6725 AED per USD, so it is derived
 * from USD. RUB has no ECB reference rate either, and no peg: the ECB suspended its
 * rouble quote in March 2022, so the rouble is editor-maintained (see `rates.server.ts`
 * and the `exchangeRates` singleton) with the snapshot below as its floor.
 *
 * ## Adding a currency
 *
 * `CURRENCIES` is the DISPLAY set — every currency the switcher offers. It is a superset
 * of the listing currencies an editor can price in (`sanity/schemas/constants/enums.ts`),
 * because a visitor may want to read a euro price in roubles but no home is sold in them.
 * A new entry needs: a rate here, a name in `convert.ts`, a symbol and budget ladder in
 * `filterPrice.ts`, a row in `styles/currency.css`, and the code in the pre-paint regex
 * in `app.html`. A new *listing* currency additionally needs a branch in
 * `queries/priceNumeric.ts` and a param in `rateQueryParams()`.
 */

export const CURRENCIES = ['EUR', 'GBP', 'USD', 'AED', 'RUB'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** A full set of conversion rates: EUR per 1 unit of each currency (EUR is always 1). */
export type RateTable = Record<Currency, number>;

/** ECB euro reference rates, units of currency per 1 EUR, as published on RATES_AS_OF. */
const ECB_PER_EUR = { USD: 1.1652, GBP: 0.85898 } as const;
/** AED/USD peg — fixed by the UAE central bank. */
export const AED_PER_USD = 3.6725;
/**
 * Roubles per 1 EUR. Not an ECB figure: the ECB stopped publishing a rouble reference
 * rate on 1 March 2022, so nothing in the daily feed can refresh this. The cron leaves it
 * alone and an editor maintains `rubPerEur` on the `exchangeRates` singleton; this is the
 * floor used until they do. Snapshot: Central Bank of Russia, 16 September 2026.
 */
export const RUB_PER_EUR = 97.3;

export const RATES_AS_OF = '2026-09-09';
/** Publication date of {@link RUB_PER_EUR}, which moves on its own schedule. */
export const RUB_RATE_AS_OF = '2026-09-16';

/** The ECB-style quotes a `RateTable` is built from: "units of X per 1 EUR". */
export type PerEurQuotes = {
	usdPerEur: number;
	gbpPerEur: number;
	/** Optional: falls back to the {@link RUB_PER_EUR} snapshot when unset. */
	rubPerEur?: number;
};

/**
 * Build a EUR-per-unit `RateTable` from "units per 1 EUR" quotes. AED is derived from the
 * USD quote via the fixed peg rather than quoted separately. This is the single place the
 * peg and the reciprocals live, shared by the static fallback and the live server-side
 * source so the two can never diverge.
 */
export function ratesFromPerEur(perEur: PerEurQuotes): RateTable {
	return {
		EUR: 1,
		GBP: 1 / perEur.gbpPerEur,
		USD: 1 / perEur.usdPerEur,
		AED: 1 / (perEur.usdPerEur * AED_PER_USD),
		RUB: 1 / (perEur.rubPerEur ?? RUB_PER_EUR)
	};
}

/** Static snapshot used whenever a live table is unavailable. */
export const FALLBACK_RATES: RateTable = ratesFromPerEur({
	usdPerEur: ECB_PER_EUR.USD,
	gbpPerEur: ECB_PER_EUR.GBP,
	rubPerEur: RUB_PER_EUR
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
 * non-EUR *listing* currencies need a param; EUR falls through to the literal 1 in the
 * expression, and RUB is display-only (no listing is priced in roubles, so the expression
 * has no rouble branch to feed). Defaults to the static fallback when no live table is
 * threaded through.
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
