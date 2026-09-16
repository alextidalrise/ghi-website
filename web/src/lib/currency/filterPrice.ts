/**
 * Presenting the price FILTER in the visitor's chosen currency (Step 4).
 *
 * The listing URL and the GROQ query are canonically EUR: every listing's price is
 * normalised to a EUR-equivalent (`PRICE_NUMERIC_EUR`) before it is compared, so the
 * `minPrice`/`maxPrice` search params are always euros. This module is the thin display
 * layer over that contract: it converts a visitor's chosen-currency figure to the EUR
 * that rides in the URL, and back again for display, and it builds the budget-band ladder
 * in whatever currency the switcher is set to.
 *
 * Pure and Sanity-free, like `convert.ts`. The chosen currency comes from the currency
 * store (`getCurrencyOptional().chosen`); `null`/`EUR` mean "present in euros", which is
 * the SSR default and preserves the pre-Step-4 behaviour exactly (no conversion, no
 * rounding of a typed euro figure).
 */

import { convertAmount, roundSignificant } from './convert';
import type { Currency, RateTable } from './rates';

/** Symbol placed before a filter figure. AED has no Latin symbol, so it prefixes its
    code and a space, matching how the dirham is written in English ("AED 2M"). */
const SYMBOL: Record<Currency, string> = {
	EUR: '€',
	GBP: '£',
	USD: '$',
	AED: 'AED ',
	RUB: '₽'
};

/**
 * Budget-band edges per currency, expressed in that currency's own round numbers rather
 * than a mechanical conversion of the euro edges — a GBP visitor reads "£500k", a dirham
 * visitor reads "AED 2M". The euro market's ladder is the default; AED is scaled to the
 * dirham's magnitude (~4× the euro) and RUB to the rouble's (~100× the euro) so their
 * rungs stay round.
 */
const LADDER_EDGES: Record<Currency, readonly [number, number, number, number]> = {
	EUR: [500_000, 1_000_000, 2_000_000, 5_000_000],
	GBP: [500_000, 1_000_000, 2_000_000, 5_000_000],
	USD: [500_000, 1_000_000, 2_000_000, 5_000_000],
	AED: [2_000_000, 5_000_000, 10_000_000, 20_000_000],
	RUB: [50_000_000, 100_000_000, 200_000_000, 500_000_000]
};

/**
 * Convert a chosen-currency amount to the EUR that rides in the URL. EUR passes through
 * untouched (exact, as before Step 4); other currencies convert and round to four
 * significant figures — enough precision for a coarse filter, tidy in a URL, and stable
 * on the round trip back through {@link displayFromEur}.
 */
export function eurFromDisplay(amount: number, currency: Currency, rates: RateTable): number {
	if (currency === 'EUR') return amount;
	return roundSignificant(convertAmount(amount, currency, 'EUR', rates), 4);
}

/**
 * Convert a EUR amount (from the URL) to the chosen currency for display. EUR passes
 * through untouched; other currencies convert and round to three significant figures, so
 * a round figure the visitor typed comes back as the same round figure.
 */
export function displayFromEur(eur: number, currency: Currency, rates: RateTable): number {
	if (currency === 'EUR') return eur;
	return roundSignificant(convertAmount(eur, 'EUR', currency, rates), 3);
}

/** The bare currency mark for an input adornment: "€", "£", "$", "AED" (no trailing space). */
export function currencyPrefix(currency: Currency): string {
	return SYMBOL[currency].trimEnd();
}

/** Compact money for a trigger, summary or band label: "£500k", "€1.25M", "AED 2M". */
export function shortMoney(value: number, currency: Currency): string {
	const symbol = SYMBOL[currency];
	const abs = Math.abs(value);
	if (abs >= 1_000_000) {
		const millions = value / 1_000_000;
		const text = Number.isInteger(millions)
			? String(millions)
			: millions.toFixed(2).replace(/\.?0+$/, '');
		return `${symbol}${text}M`;
	}
	if (abs >= 1000) return `${symbol}${Math.round(value / 1000)}k`;
	return `${symbol}${Math.round(value)}`;
}

/**
 * The compact value a price trigger/summary shows for a chosen-currency min/max pair:
 * "£500k–£1M", "£500k+", "Up to £1M", or "" when neither is set. Inputs are already in
 * the display currency (see {@link displayFromEur}).
 */
export function formatMoneyRange(
	min: number | null,
	max: number | null,
	currency: Currency
): string {
	if (min != null && max != null) return `${shortMoney(min, currency)}–${shortMoney(max, currency)}`;
	if (min != null) return `${shortMoney(min, currency)}+`;
	if (max != null) return `Up to ${shortMoney(max, currency)}`;
	return '';
}

/** A budget-band rung: a label in the chosen currency, and the EUR bounds for the query. */
export type BudgetBand = {
	/** Stable key (b1…b5), independent of currency, so a selection survives a switch. */
	value: string;
	/** Human label in the chosen currency, e.g. "£500k – £1M". */
	label: string;
	/** EUR lower bound for `minPrice` (null = open-ended below). */
	min: number | null;
	/** EUR upper bound for `maxPrice` (null = open-ended above). */
	max: number | null;
};

/**
 * The five budget bands in the chosen currency, each carrying the EUR bounds it emits into
 * the listing-search params. For EUR the bounds are the round edges unchanged, so the
 * default (as-listed) ladder is byte-for-byte the pre-Step-4 one.
 */
export function budgetBands(currency: Currency, rates: RateTable): BudgetBand[] {
	const edges = LADDER_EDGES[currency];
	const eur = (edge: number) => eurFromDisplay(edge, currency, rates);
	const bands: BudgetBand[] = [
		{ value: 'b1', label: `Up to ${shortMoney(edges[0], currency)}`, min: null, max: eur(edges[0]) }
	];
	for (let i = 0; i < 3; i += 1) {
		bands.push({
			value: `b${i + 2}`,
			label: `${shortMoney(edges[i], currency)} – ${shortMoney(edges[i + 1], currency)}`,
			min: eur(edges[i]),
			max: eur(edges[i + 1])
		});
	}
	bands.push({ value: 'b5', label: `${shortMoney(edges[3], currency)}+`, min: eur(edges[3]), max: null });
	return bands;
}
