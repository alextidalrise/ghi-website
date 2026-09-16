/**
 * Central Bank of Russia daily fixing — the rouble's equivalent of the ECB feed.
 *
 * The ECB suspended its RUB reference rate on 1 March 2022 and every EU central bank
 * followed (the Czech CNB dropped it from its fixing; Poland's NBP last published one on
 * 8 March 2022). The issuer's own fixing is therefore the only authoritative daily quote
 * left, so the rouble is sourced here rather than from `./ecb`.
 *
 * The document lists one `<Valute>` per currency, quoted as roubles per `Nominal` units —
 * so the EUR entry is already "roubles per 1 EUR", which is exactly the shape
 * `ratesFromPerEur` wants. Two shapes differ from the ECB feed and the parser handles
 * both: the date is `DD.MM.YYYY`, and the amounts use a comma as the decimal separator.
 *
 * Parsed with a narrow regex rather than an XML dependency, like `./ecb`, which also side-
 * steps the document's windows-1251 encoding: every field read here is ASCII, so it
 * survives whatever decoding the fetch applies, and only the Cyrillic `<Name>` (which we
 * never read) would come back garbled.
 */
export const CBR_DAILY_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';

export type CbrDaily = {
	/** CBR publication date, normalised to YYYY-MM-DD. */
	asOf: string;
	/** Roubles per 1 EUR. */
	rubPerEur: number;
};

/** `16.09.2026` → `2026-09-16`, or null if the shape is not a plausible date. */
function toIsoDate(ddmmyyyy: string): string | null {
	const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(ddmmyyyy);
	if (!match) return null;
	const [, day, month, year] = match;
	if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) return null;
	return `${year}-${month}-${day}`;
}

/**
 * Parse the CBR daily XML into the euro quote and its publication date. Returns `null` if
 * the date or the quote is missing or unusable, so the caller can refuse to overwrite a
 * good rate with garbage — the same contract as {@link import('./ecb').parseEcbDaily}.
 */
export function parseCbrDaily(xml: string): CbrDaily | null {
	const asOf = toIsoDate(/ValCurs[^>]*\sDate="([\d.]+)"/.exec(xml)?.[1] ?? '');
	if (!asOf) return null;

	const entry =
		/<CharCode>EUR<\/CharCode>\s*<Nominal>(\d+)<\/Nominal>[\s\S]*?<Value>([\d,.]+)<\/Value>/.exec(
			xml
		);
	if (!entry) return null;

	const nominal = Number(entry[1]);
	// "97,3012" — a comma decimal separator, and never a thousands separator at these
	// magnitudes, so a straight swap is safe.
	const value = Number(entry[2].replace(',', '.'));
	if (!Number.isFinite(nominal) || nominal <= 0) return null;
	if (!Number.isFinite(value) || value <= 0) return null;

	return { asOf, rubPerEur: value / nominal };
}
