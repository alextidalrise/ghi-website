import { describe, expect, it } from 'vitest';
import { buildBootstrapScript, buildDisabledComment } from './snippet';
import type { StoredConsent } from './types';

const GTM = 'GTM-5KWMLHJP';

const consent = (analytics: boolean, marketing: boolean): StoredConsent => ({
	version: 1,
	analytics,
	marketing,
	timestamp: '2026-07-20T12:00:00.000Z'
});

const script = (overrides: Partial<Parameters<typeof buildBootstrapScript>[0]> = {}) =>
	buildBootstrapScript({ gtmId: GTM, consent: null, debug: false, ...overrides });

describe('buildBootstrapScript', () => {
	it('establishes the data layer before anything can push to it', () => {
		const out = script();
		expect(out.indexOf('window.dataLayer=window.dataLayer||[]')).toBeLessThan(
			out.indexOf("gtag('consent'")
		);
	});

	it('sets consent defaults before loading the container', () => {
		// The whole point of the inline script: no Google tag may run, or set a cookie,
		// before the denied-by-default consent state is established.
		const out = script();
		expect(out.indexOf("gtag('consent','default'")).toBeLessThan(out.indexOf('gtm.js'));
	});

	it('denies every storage type except security storage by default', () => {
		const out = script();
		expect(out).toContain('"analytics_storage":"denied"');
		expect(out).toContain('"ad_storage":"denied"');
		expect(out).toContain('"ad_user_data":"denied"');
		expect(out).toContain('"ad_personalization":"denied"');
		expect(out).toContain('"personalization_storage":"denied"');
		expect(out).toContain('"security_storage":"granted"');
	});

	it('waits 500ms for a pending consent update', () => {
		expect(script()).toContain('"wait_for_update":500');
	});

	it('redacts ad data before any decision is made', () => {
		expect(script()).toContain("gtag('set','ads_data_redaction',true)");
	});

	it('emits no consent update for a visitor who has not decided', () => {
		expect(script({ consent: null })).not.toContain("gtag('consent','update'");
	});

	describe('with a stored decision', () => {
		it('updates after the default and before the container', () => {
			const out = script({ consent: consent(true, false) });
			const def = out.indexOf("gtag('consent','default'");
			const update = out.indexOf("gtag('consent','update'");
			const loader = out.indexOf('gtm.js');
			expect(def).toBeLessThan(update);
			expect(update).toBeLessThan(loader);
		});

		it('grants only analytics storage for analytics-only consent', () => {
			const out = script({ consent: consent(true, false) });
			const update = out.slice(out.indexOf("gtag('consent','update'"));
			expect(update).toContain('"analytics_storage":"granted"');
			expect(update).toContain('"ad_storage":"denied"');
		});

		it('lifts ad redaction only once marketing is accepted', () => {
			expect(script({ consent: consent(true, true) })).toContain(
				"gtag('set','ads_data_redaction',false)"
			);
			expect(script({ consent: consent(true, false) })).not.toContain(
				"gtag('set','ads_data_redaction',false)"
			);
		});
	});

	it('interpolates the container id exactly once', () => {
		const out = script();
		expect(out.split(GTM)).toHaveLength(2);
	});

	it('adds debug markers only in debug mode', () => {
		expect(script({ debug: true })).toContain("ghi_environment:'debug'");
		expect(script({ debug: true })).toContain('debug_mode:true');
		expect(script()).not.toContain('debug_mode');
	});

	it('never lets an embedded value close the script element', () => {
		const out = buildBootstrapScript({
			gtmId: '</script><img src=x onerror=alert(1)>',
			consent: null,
			debug: false
		});
		expect(out).not.toContain('</script><img');
		expect(out).toContain('\\u003c/script');
		// Exactly one closing tag: the one we wrote.
		expect(out.split('</script>')).toHaveLength(2);
	});

	it('is a single self-contained script element', () => {
		const out = script();
		expect(out.startsWith('<script>')).toBe(true);
		expect(out.endsWith('</script>')).toBe(true);
	});

	it('never emits a noscript iframe, which could not respect consent', () => {
		expect(script()).not.toContain('noscript');
		expect(script()).not.toContain('ns.html');
	});
});

describe('buildDisabledComment', () => {
	it('explains why tracking is absent', () => {
		expect(buildDisabledComment('non-production host: localhost')).toBe(
			'<!-- analytics off: non-production host: localhost -->'
		);
	});

	it('cannot be broken out of by the reason text', () => {
		const out = buildDisabledComment('--><script>alert(1)</script>');
		expect(out).not.toContain('<script');
		expect(out.split('-->')).toHaveLength(2);
	});
});
