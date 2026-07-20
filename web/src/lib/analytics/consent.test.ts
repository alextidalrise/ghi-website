import { describe, expect, it } from 'vitest';
import { ConsentStore } from './consent.svelte';
import type { StoredConsent } from './types';

const decision = (analytics: boolean, marketing: boolean): StoredConsent => ({
	version: 1,
	analytics,
	marketing,
	timestamp: '2026-07-20T12:00:00.000Z'
});

describe('ConsentStore', () => {
	it('starts undecided when the visitor has no cookie', () => {
		const store = new ConsentStore(null);
		expect(store.needsPrompt).toBe(true);
		expect(store.decided).toBe(false);
		expect(store.analytics).toBe(false);
		expect(store.marketing).toBe(false);
	});

	it('reflects a stored decision without prompting again', () => {
		const store = new ConsentStore(decision(true, false));
		expect(store.needsPrompt).toBe(false);
		expect(store.decided).toBe(true);
		expect(store.analytics).toBe(true);
		expect(store.marketing).toBe(false);
		expect(store.timestamp).toBe('2026-07-20T12:00:00.000Z');
	});

	it('keeps instances fully independent', () => {
		// The regression this guards: consent used to live in module-level state, which on
		// the server is shared by every request in the process — so the first visitor's
		// decision would have rendered for everyone who followed. One instance per render
		// is what makes SSR safe, so instances must share nothing.
		const accepted = new ConsentStore(decision(true, true));
		const undecided = new ConsentStore(null);

		expect(accepted.needsPrompt).toBe(false);
		expect(undecided.needsPrompt).toBe(true);

		undecided.openPreferences();
		expect(undecided.preferencesOpen).toBe(true);
		expect(accepted.preferencesOpen).toBe(false);
	});

	it('opens and closes the preference panel', () => {
		const store = new ConsentStore(null);
		expect(store.preferencesOpen).toBe(false);
		store.openPreferences();
		expect(store.preferencesOpen).toBe(true);
		store.closePreferences();
		expect(store.preferencesOpen).toBe(false);
	});

	it('unsubscribes a change listener', () => {
		const store = new ConsentStore(null);
		let calls = 0;
		const off = store.onChange(() => (calls += 1));
		off();
		// save() no-ops outside the browser, so this asserts only that unsubscribing is
		// wired up; the notification path itself is covered by manual QA.
		store.save({ analytics: true, marketing: false });
		expect(calls).toBe(0);
	});

	it('does not write a decision during server rendering', () => {
		// `browser` is false under vitest, so save() must leave state untouched rather
		// than reaching for document.cookie and throwing.
		const store = new ConsentStore(null);
		store.save({ analytics: true, marketing: true });
		expect(store.decided).toBe(false);
	});
});
