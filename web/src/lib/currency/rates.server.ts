/**
 * Server-side source for the live exchange rates (Step 2 of the currency project).
 *
 * Reads the published `exchangeRates` singleton and turns it into the `RateTable` the pure
 * helpers in `./rates` consume. The document stores the two ECB "units per 1 EUR" quotes
 * the daily cron writes (`gbpPerEur`, `usdPerEur`); AED is derived from the USD peg. Any of
 * the three currencies can be pinned with a per-rate override (EUR-per-unit), which the cron
 * never touches and which wins here.
 *
 * This is the ONLY currency module allowed to touch Sanity. It never throws: a missing doc,
 * malformed numbers, or a fetch failure fall back to the static snapshot so a rates problem
 * can never take a page load down — the worst case is yesterday's (or the snapshot's) rates.
 *
 * A direct published-client read, deliberately not `fetchPublic`: rates are always the
 * published values (never drafts, even in preview), and this runs from a hooks handle
 * outside the request's cache-tag context.
 */
import { publicClient } from '../sanity/client';
import {
	FALLBACK_RATES,
	RATES_AS_OF,
	ratesFromPerEur,
	type Currency,
	type RateTable
} from './rates';

export const EXCHANGE_RATES_DOC_ID = 'exchangeRates';

export type ExchangeRates = {
	rates: RateTable;
	/** ECB publication date the base rates were sourced from (or the snapshot date). */
	asOf: string;
	source: 'sanity' | 'fallback';
};

type ExchangeRatesDoc = {
	gbpPerEur?: number | null;
	usdPerEur?: number | null;
	asOf?: string | null;
	gbpOverride?: number | null;
	usdOverride?: number | null;
	aedOverride?: number | null;
};

const EXCHANGE_RATES_QUERY = /* groq */ `*[_id == "${EXCHANGE_RATES_DOC_ID}"][0]{
  gbpPerEur, usdPerEur, asOf, gbpOverride, usdOverride, aedOverride
}`;

/** A usable positive, finite rate — guards against null, 0, NaN and negatives. */
function isPositive(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

const FALLBACK: ExchangeRates = { rates: FALLBACK_RATES, asOf: RATES_AS_OF, source: 'fallback' };

/**
 * Turn a raw `exchangeRates` document into an `ExchangeRates`, applying per-rate overrides
 * over the derived base. Exported for unit testing without a Sanity round-trip. Returns the
 * static fallback if the required base quotes are missing or unusable.
 */
export function exchangeRatesFromDoc(doc: ExchangeRatesDoc | null | undefined): ExchangeRates {
	if (!doc || !isPositive(doc.gbpPerEur) || !isPositive(doc.usdPerEur)) return FALLBACK;

	const base = ratesFromPerEur({ usdPerEur: doc.usdPerEur, gbpPerEur: doc.gbpPerEur });
	const override = (value: unknown, derived: number): number =>
		isPositive(value) ? value : derived;

	const rates: RateTable = {
		EUR: 1,
		GBP: override(doc.gbpOverride, base.GBP),
		USD: override(doc.usdOverride, base.USD),
		AED: override(doc.aedOverride, base.AED)
	} satisfies Record<Currency, number>;

	return { rates, asOf: typeof doc.asOf === 'string' ? doc.asOf : RATES_AS_OF, source: 'sanity' };
}

/** Fetch the live rates. Never throws — falls back to the static snapshot on any problem. */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
	try {
		const doc = await publicClient.fetch<ExchangeRatesDoc | null>(EXCHANGE_RATES_QUERY);
		return exchangeRatesFromDoc(doc);
	} catch {
		return FALLBACK;
	}
}
