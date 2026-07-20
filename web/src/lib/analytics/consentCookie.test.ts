import { describe, expect, it } from 'vitest';
import {
	CONSENT_VERSION,
	consentCookieOptions,
	createConsent,
	defaultSignals,
	parseConsent,
	readCookie,
	serializeConsent,
	signalsFor
} from './consentCookie';

const AT = new Date('2026-07-20T12:00:00.000Z');

describe('parseConsent', () => {
	it('round-trips a serialised decision', () => {
		const raw = serializeConsent({ analytics: true, marketing: false }, AT);
		expect(parseConsent(raw)).toEqual({
			version: CONSENT_VERSION,
			analytics: true,
			marketing: false,
			timestamp: '2026-07-20T12:00:00.000Z'
		});
	});

	it('accepts an un-encoded value, so a hand-edited cookie still reads', () => {
		const raw = JSON.stringify(createConsent({ analytics: true, marketing: true }, AT));
		expect(parseConsent(raw)?.analytics).toBe(true);
	});

	it('returns null when there is no cookie', () => {
		expect(parseConsent(undefined)).toBeNull();
		expect(parseConsent(null)).toBeNull();
		expect(parseConsent('')).toBeNull();
	});

	it('fails closed on malformed JSON', () => {
		expect(parseConsent('not-json')).toBeNull();
		expect(parseConsent('{"analytics":')).toBeNull();
	});

	it('fails closed on a non-object payload', () => {
		expect(parseConsent(encodeURIComponent('"a string"'))).toBeNull();
		expect(parseConsent(encodeURIComponent('null'))).toBeNull();
		expect(parseConsent(encodeURIComponent('[]'))).toBeNull();
	});

	it('fails closed when a category is missing or the wrong type', () => {
		const base = { version: CONSENT_VERSION, timestamp: AT.toISOString() };
		expect(parseConsent(JSON.stringify({ ...base, marketing: false }))).toBeNull();
		expect(parseConsent(JSON.stringify({ ...base, analytics: 'yes', marketing: false }))).toBeNull();
		expect(parseConsent(JSON.stringify({ ...base, analytics: 1, marketing: 0 }))).toBeNull();
	});

	it('fails closed on a superseded policy version, so the visitor is re-asked', () => {
		const stale = JSON.stringify({
			version: CONSENT_VERSION - 1,
			analytics: true,
			marketing: true,
			timestamp: AT.toISOString()
		});
		expect(parseConsent(stale)).toBeNull();
	});

	it('fails closed on an unparseable timestamp', () => {
		const bad = JSON.stringify({
			version: CONSENT_VERSION,
			analytics: true,
			marketing: false,
			timestamp: 'whenever'
		});
		expect(parseConsent(bad)).toBeNull();
	});
});

describe('signalsFor', () => {
	it('denies everything except security storage before a decision', () => {
		expect(signalsFor(null)).toEqual(defaultSignals());
		expect(defaultSignals()).toEqual({
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
			analytics_storage: 'denied',
			personalization_storage: 'denied',
			security_storage: 'granted'
		});
	});

	it('grants only analytics_storage for analytics-only consent', () => {
		const signals = signalsFor({ analytics: true, marketing: false });
		expect(signals.analytics_storage).toBe('granted');
		expect(signals.ad_storage).toBe('denied');
		expect(signals.ad_user_data).toBe('denied');
		expect(signals.ad_personalization).toBe('denied');
		expect(signals.personalization_storage).toBe('denied');
	});

	it('grants the advertising signals for marketing-only consent', () => {
		const signals = signalsFor({ analytics: false, marketing: true });
		expect(signals.analytics_storage).toBe('denied');
		expect(signals.ad_storage).toBe('granted');
		expect(signals.ad_user_data).toBe('granted');
		expect(signals.ad_personalization).toBe('granted');
		expect(signals.personalization_storage).toBe('granted');
	});

	it('grants everything for accept-all', () => {
		const signals = signalsFor({ analytics: true, marketing: true });
		expect(Object.values(signals).every((state) => state === 'granted')).toBe(true);
	});

	it('always grants security storage, which is not a visitor choice', () => {
		expect(signalsFor({ analytics: false, marketing: false }).security_storage).toBe('granted');
	});
});

describe('consentCookieOptions', () => {
	it('sets Secure over https and not over http', () => {
		expect(consentCookieOptions({ protocol: 'https:' }).secure).toBe(true);
		expect(consentCookieOptions({ protocol: 'http:' }).secure).toBe(false);
	});

	it('scopes to the whole site for 180 days with Lax', () => {
		const options = consentCookieOptions({ protocol: 'https:' });
		expect(options.path).toBe('/');
		expect(options.sameSite).toBe('lax');
		expect(options.maxAge).toBe(60 * 60 * 24 * 180);
	});
});

describe('readCookie', () => {
	it('finds a cookie among others', () => {
		const header = 'launch_bypass=abc; ghi_consent=%7B%22a%22%3A1%7D; other=x';
		expect(readCookie(header, 'ghi_consent')).toBe('%7B%22a%22%3A1%7D');
	});

	it('does not match on a name prefix', () => {
		expect(readCookie('ghi_consent_debug=1', 'ghi_consent')).toBeNull();
	});

	it('returns null for an absent cookie or an empty header', () => {
		expect(readCookie('a=1; b=2', 'ghi_consent')).toBeNull();
		expect(readCookie('', 'ghi_consent')).toBeNull();
	});
});
