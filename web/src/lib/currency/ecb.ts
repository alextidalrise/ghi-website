/**
 * ECB euro foreign-exchange reference rates — the daily feed the rates cron pulls.
 *
 * The ECB publishes one small XML file each TARGET business day (~16:00 CET). It quotes
 * "units of currency per 1 EUR" for a fixed basket. We only need USD and GBP: AED has no ECB
 * quote and is derived from the USD peg downstream (see `$lib/currency/rates`).
 *
 * Parsed with a narrow regex rather than an XML dependency — the document shape is stable and
 * tiny, and this keeps the module pure and free of runtime deps so it can be unit-tested.
 */
export const ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

export type EcbDaily = {
	/** ECB publication date, YYYY-MM-DD. */
	asOf: string;
	/** US dollars per 1 EUR. */
	usdPerEur: number;
	/** Pounds sterling per 1 EUR. */
	gbpPerEur: number;
};

function rateFor(xml: string, currency: string): number {
	const match = xml.match(new RegExp(`currency=["']${currency}["']\\s+rate=["']([\\d.]+)["']`));
	return match ? Number(match[1]) : Number.NaN;
}

/**
 * Parse the ECB daily XML into the two quotes we need plus the publication date. Returns
 * `null` if the date or either quote is missing or unusable, so the caller can refuse to
 * overwrite good rates with garbage.
 */
export function parseEcbDaily(xml: string): EcbDaily | null {
	const asOf = xml.match(/time=["'](\d{4}-\d{2}-\d{2})["']/)?.[1];
	const usdPerEur = rateFor(xml, 'USD');
	const gbpPerEur = rateFor(xml, 'GBP');

	if (!asOf) return null;
	if (!Number.isFinite(usdPerEur) || usdPerEur <= 0) return null;
	if (!Number.isFinite(gbpPerEur) || gbpPerEur <= 0) return null;

	return { asOf, usdPerEur, gbpPerEur };
}
