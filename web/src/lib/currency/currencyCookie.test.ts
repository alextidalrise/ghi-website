import { describe, expect, it } from 'vitest';
import {
	CURRENCY_COOKIE,
	CURRENCY_MAX_AGE,
	readCurrencyCookie,
	serializeCurrencyCookie
} from './currencyCookie';

describe('readCurrencyCookie', () => {
	it('finds the code among other cookies', () => {
		expect(readCurrencyCookie('ghi_consent=%7B%7D; ghi_currency=GBP; _ga=1')).toBe('GBP');
		expect(readCurrencyCookie('ghi_currency=AED')).toBe('AED');
	});

	it('rejects anything but the four supported codes', () => {
		expect(readCurrencyCookie('ghi_currency=CHF')).toBeNull();
		expect(readCurrencyCookie('ghi_currency=gbp')).toBeNull();
		expect(readCurrencyCookie('ghi_currency=')).toBeNull();
		expect(readCurrencyCookie('ghi_currency=GBP;extra')).toBe('GBP');
	});

	it('ignores a look-alike name and an empty header', () => {
		expect(readCurrencyCookie('x_ghi_currency=GBP')).toBeNull();
		expect(readCurrencyCookie('')).toBeNull();
		expect(readCurrencyCookie(null)).toBeNull();
	});

	it('agrees with the pre-paint regex in app.html', () => {
		// Kept in lockstep by hand; this pins the inline pattern's behaviour.
		const inline = /(?:^|;\s*)ghi_currency=(EUR|GBP|USD|AED)(?:;|$)/;
		for (const header of ['ghi_currency=USD', 'a=b; ghi_currency=EUR', 'ghi_currency=XXX', '']) {
			expect(readCurrencyCookie(header)).toBe(inline.exec(header)?.[1] ?? null);
		}
	});
});

describe('serializeCurrencyCookie', () => {
	it('writes a year-long, site-wide, lax cookie', () => {
		expect(serializeCurrencyCookie('GBP', true)).toBe(
			`${CURRENCY_COOKIE}=GBP; path=/; max-age=${CURRENCY_MAX_AGE}; samesite=lax; secure`
		);
		expect(CURRENCY_MAX_AGE).toBe(31_536_000);
	});

	it('omits secure on plain http (local dev)', () => {
		expect(serializeCurrencyCookie('EUR', false)).not.toContain('secure');
	});

	it('clears with a zero max-age', () => {
		expect(serializeCurrencyCookie(null, true)).toBe(
			`${CURRENCY_COOKIE}=; path=/; max-age=0; samesite=lax; secure`
		);
	});
});
