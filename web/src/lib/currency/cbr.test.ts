import { describe, expect, it } from 'vitest';
import { parseCbrDaily } from './cbr';

/** Trimmed from a real response: the EUR entry, one multi-unit neighbour, one preceding. */
const SAMPLE =
	'<?xml version="1.0" encoding="windows-1251"?>' +
	'<ValCurs Date="16.09.2026" name="Foreign Currency Market">' +
	'<Valute ID="R01235"><NumCode>840</NumCode><CharCode>USD</CharCode><Nominal>1</Nominal>' +
	'<Name>Dollar</Name><Value>84,2362</Value><VunitRate>84,2362</VunitRate></Valute>' +
	'<Valute ID="R01239"><NumCode>978</NumCode><CharCode>EUR</CharCode><Nominal>1</Nominal>' +
	'<Name>Evro</Name><Value>97,3012</Value><VunitRate>97,3012</VunitRate></Valute>' +
	'<Valute ID="R01240"><NumCode>818</NumCode><CharCode>EGP</CharCode><Nominal>10</Nominal>' +
	'<Name>Pounds</Name><Value>16,1788</Value><VunitRate>1,61788</VunitRate></Valute>' +
	'</ValCurs>';

describe('parseCbrDaily', () => {
	it('extracts the euro quote and normalises the date', () => {
		expect(parseCbrDaily(SAMPLE)).toEqual({ asOf: '2026-09-16', rubPerEur: 97.3012 });
	});

	it('reads the comma decimal separator the feed uses', () => {
		expect(parseCbrDaily(SAMPLE)?.rubPerEur).toBeCloseTo(97.3012, 6);
	});

	it('divides by Nominal, so a multi-unit quote would still come back per 1 EUR', () => {
		const perTen = SAMPLE.replace(
			'<CharCode>EUR</CharCode><Nominal>1</Nominal>',
			'<CharCode>EUR</CharCode><Nominal>10</Nominal>'
		).replace('<Value>97,3012</Value>', '<Value>973,012</Value>');
		expect(parseCbrDaily(perTen)?.rubPerEur).toBeCloseTo(97.3012, 6);
	});

	// Every field the parser reads is ASCII, so a mis-decoded windows-1251 body (the
	// Cyrillic <Name> arriving as mojibake or replacement characters) must not matter.
	it('survives a mis-decoded body', () => {
		expect(parseCbrDaily(SAMPLE.replace('Evro', '����'))).toEqual({
			asOf: '2026-09-16',
			rubPerEur: 97.3012
		});
	});

	it('returns null when the date is missing or malformed', () => {
		expect(parseCbrDaily(SAMPLE.replace('Date="16.09.2026"', ''))).toBeNull();
		expect(parseCbrDaily(SAMPLE.replace('16.09.2026', '2026-09-16'))).toBeNull();
		expect(parseCbrDaily(SAMPLE.replace('16.09.2026', '16.19.2026'))).toBeNull();
	});

	it('returns null when the euro quote is missing or unusable', () => {
		expect(parseCbrDaily(SAMPLE.replace('<CharCode>EUR</CharCode>', '<CharCode>XXX</CharCode>'))).toBeNull();
		expect(parseCbrDaily(SAMPLE.replace('<Value>97,3012</Value>', '<Value>0</Value>'))).toBeNull();
	});

	it('returns null on junk input rather than throwing', () => {
		expect(parseCbrDaily('not xml')).toBeNull();
		expect(parseCbrDaily('')).toBeNull();
	});
});
