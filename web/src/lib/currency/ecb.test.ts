import { describe, expect, it } from 'vitest';
import { parseEcbDaily } from './ecb';

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <Cube>
    <Cube time="2026-09-09">
      <Cube currency="USD" rate="1.1652"/>
      <Cube currency="JPY" rate="171.23"/>
      <Cube currency="GBP" rate="0.85898"/>
      <Cube currency="AED" rate="4.2793"/>
    </Cube>
  </Cube>
</gesmes:Envelope>`;

describe('parseEcbDaily', () => {
	it('extracts the date and the USD/GBP quotes', () => {
		expect(parseEcbDaily(SAMPLE)).toEqual({
			asOf: '2026-09-09',
			usdPerEur: 1.1652,
			gbpPerEur: 0.85898
		});
	});

	it('returns null when the date is missing', () => {
		expect(parseEcbDaily(SAMPLE.replace('time="2026-09-09"', ''))).toBeNull();
	});

	it('returns null when a required quote is missing', () => {
		expect(parseEcbDaily(SAMPLE.replace('currency="GBP" rate="0.85898"', ''))).toBeNull();
	});

	it('returns null on junk input rather than throwing', () => {
		expect(parseEcbDaily('not xml')).toBeNull();
		expect(parseEcbDaily('')).toBeNull();
	});
});
