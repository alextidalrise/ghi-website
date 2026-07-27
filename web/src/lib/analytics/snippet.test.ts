import { describe, expect, it } from 'vitest';
import { signalsFor } from './consentCookie';
import { buildBootstrapScript, buildDisabledComment } from './snippet';
import type { ConsentCategories } from './types';

const GTM = 'GTM-5KWMLHJP';

const script = (overrides: Partial<Parameters<typeof buildBootstrapScript>[0]> = {}) =>
	buildBootstrapScript({ gtmId: GTM, debug: false, ...overrides });

/** A well-formed cookie value, exactly as `serializeConsent` would write it. */
const cookieFor = (analytics: boolean, marketing: boolean, overrides: object = {}) =>
	encodeURIComponent(
		JSON.stringify({
			version: 1,
			analytics,
			marketing,
			timestamp: '2026-07-20T12:00:00.000Z',
			...overrides
		})
	);

type Call = { command: string; args: unknown[] };

/**
 * Execute the emitted bootstrap against stub globals and report what reached the
 * dataLayer.
 *
 * The consent replay for a returning visitor now happens in the browser, so asserting on
 * the *text* of the script would no longer prove anything about what Google actually
 * receives — a typo inside the cookie reader would still satisfy every string check.
 * These tests run the thing instead.
 *
 * `dataLayer` is handed in as its own binding as well as on `window`: the script declares
 * `window.dataLayer` and then pushes via a bare `dataLayer` reference, which resolves to a
 * global in a browser but not inside `new Function`. Passing the same array under both
 * names reproduces the browser's behaviour faithfully.
 */
function run(html: string, cookie = ''): { calls: Call[]; loaded: string[] } {
	const body = html.replace(/^<script>/, '').replace(/<\/script>$/, '');

	const dataLayer: unknown[] = [];
	const loaded: string[] = [];

	const firstScript = {
		parentNode: {
			insertBefore: (node: { src?: string }) => loaded.push(node.src ?? '')
		}
	};

	const document = {
		cookie,
		readyState: 'complete',
		getElementsByTagName: () => [firstScript],
		createElement: () => ({}) as Record<string, unknown>
	};

	const window: Record<string, unknown> = { dataLayer };

	new Function('window', 'document', 'dataLayer', body)(window, document, dataLayer);

	const calls = dataLayer.map((entry) => {
		const args = Array.from(entry as ArrayLike<unknown>);
		return { command: String(args[0]), args: args.slice(1) };
	});

	return { calls, loaded };
}

const updates = (calls: Call[]) =>
	calls.filter((c) => c.command === 'consent' && c.args[0] === 'update');

const redactions = (calls: Call[]) =>
	calls.filter((c) => c.command === 'set' && c.args[0] === 'ads_data_redaction');

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
		const { calls } = run(script());
		const defaults = calls.find((c) => c.command === 'consent' && c.args[0] === 'default');

		expect(defaults?.args[1]).toMatchObject({
			analytics_storage: 'denied',
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
			personalization_storage: 'denied',
			security_storage: 'granted'
		});
	});

	it('waits 500ms for a pending consent update', () => {
		expect(script()).toContain('"wait_for_update":500');
	});

	it('redacts ad data before any decision is made', () => {
		expect(redactions(run(script()).calls)[0]?.args[1]).toBe(true);
	});

	it('loads the container exactly once, from the given id', () => {
		const { loaded } = run(script());
		expect(loaded).toHaveLength(1);
		expect(loaded[0]).toContain(`id=${GTM}`);
	});

	describe('the visitor has not decided', () => {
		it('emits no consent update when no cookie is present', () => {
			expect(updates(run(script(), '').calls)).toHaveLength(0);
		});

		it('emits no consent update when other cookies exist but ours does not', () => {
			expect(updates(run(script(), '_ga=GA1.1.123; other=x').calls)).toHaveLength(0);
		});

		it('leaves ad redaction on', () => {
			const { calls } = run(script(), '');
			expect(redactions(calls).at(-1)?.args[1]).toBe(true);
		});
	});

	describe('a returning visitor, read from the cookie', () => {
		it('updates after the default and before the container is inserted', () => {
			const { calls } = run(script(), `ghi_consent=${cookieFor(true, false)}`);
			const defaultAt = calls.findIndex((c) => c.command === 'consent' && c.args[0] === 'default');
			const updateAt = calls.findIndex((c) => c.command === 'consent' && c.args[0] === 'update');

			expect(defaultAt).toBeGreaterThanOrEqual(0);
			expect(updateAt).toBeGreaterThan(defaultAt);
			// And ahead of the container in the emitted source, which is what actually
			// guarantees no tag fires on the defaults for a visitor who already decided.
			const out = script();
			expect(out.indexOf("gtag('consent','update'")).toBeLessThan(out.indexOf('gtm.js'));
		});

		it('grants only analytics storage for analytics-only consent', () => {
			const { calls } = run(script(), `ghi_consent=${cookieFor(true, false)}`);
			expect(updates(calls)[0]?.args[1]).toMatchObject({
				analytics_storage: 'granted',
				ad_storage: 'denied',
				ad_user_data: 'denied',
				ad_personalization: 'denied',
				personalization_storage: 'denied',
				security_storage: 'granted'
			});
		});

		it('lifts ad redaction only once marketing is accepted', () => {
			const accepted = run(script(), `ghi_consent=${cookieFor(true, true)}`);
			expect(redactions(accepted.calls).at(-1)?.args[1]).toBe(false);

			const analyticsOnly = run(script(), `ghi_consent=${cookieFor(true, false)}`);
			expect(redactions(analyticsOnly.calls).at(-1)?.args[1]).toBe(true);
		});

		it('finds the cookie among others, in any position', () => {
			const { calls } = run(
				script(),
				`_ga=GA1.1.123; ghi_consent=${cookieFor(true, true)}; _gid=x`
			);
			expect(updates(calls)).toHaveLength(1);
		});

		it('accepts a hand-edited, un-encoded cookie value', () => {
			const raw = JSON.stringify({
				version: 1,
				analytics: true,
				marketing: false,
				timestamp: '2026-07-20T12:00:00.000Z'
			});
			expect(updates(run(script(), `ghi_consent=${raw}`).calls)).toHaveLength(1);
		});

		/* The guard against the two implementations drifting apart. The category -> signal
		   mapping now exists twice: once as `signalsFor`, and once as generated inline JS.
		   Every combination must agree, or a visitor's real choice and what Google is told
		   would quietly diverge. */
		it.each([
			[true, true],
			[true, false],
			[false, true],
			[false, false]
		])('matches signalsFor() exactly (analytics=%s, marketing=%s)', (analytics, marketing) => {
			const { calls } = run(script(), `ghi_consent=${cookieFor(analytics, marketing)}`);
			const choice: ConsentCategories = { analytics, marketing };

			expect(updates(calls)[0]?.args[1]).toEqual(signalsFor(choice));
		});
	});

	describe('an untrustworthy cookie fails closed', () => {
		/* Mirrors parseConsent's validation. Being more permissive here than the parser is
		   the dangerous direction: Google would act on a decision the application still
		   considers absent, and would go on prompting for. */
		it.each([
			['malformed JSON', 'ghi_consent=not-json'],
			['a superseded version', `ghi_consent=${cookieFor(true, true, { version: 0 })}`],
			[
				'a missing version',
				`ghi_consent=${encodeURIComponent('{"analytics":true,"marketing":true,"timestamp":"2026-07-20T12:00:00.000Z"}')}`
			],
			['non-boolean categories', `ghi_consent=${cookieFor(true, true, { analytics: 'yes' })}`],
			['a missing timestamp', `ghi_consent=${cookieFor(true, true, { timestamp: undefined })}`],
			['an unparseable timestamp', `ghi_consent=${cookieFor(true, true, { timestamp: 'never' })}`],
			['a JSON null', `ghi_consent=${encodeURIComponent('null')}`],
			['an empty value', 'ghi_consent=']
		])('ignores %s', (_label, cookie) => {
			const { calls } = run(script(), cookie);
			expect(updates(calls)).toHaveLength(0);
			expect(redactions(calls).at(-1)?.args[1]).toBe(true);
		});

		it('still loads the container', () => {
			// A bad cookie must not take analytics down with it — it just means no update.
			expect(run(script(), 'ghi_consent=not-json').loaded).toHaveLength(1);
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

	/* The reason this refactor exists: an edge cache may serve one visitor's document to
	   the next, so the bytes must not depend on who asked. */
	it('does not vary with the visitor', () => {
		expect(script()).toBe(script());
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
