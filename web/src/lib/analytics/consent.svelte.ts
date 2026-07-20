import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { clearAnalyticsCookies } from './browserCookies';
import { CONSENT_COOKIE, CONSENT_MAX_AGE, createConsent, signalsFor } from './consentCookie';
import type { ConsentCategories, StoredConsent } from './types';

/**
 * Consent state and the public API the consent UI drives.
 *
 * This module owns the decision; the banner and preference panel own the presentation.
 * They are built separately, so everything here is deliberately UI-agnostic — a banner, a
 * footer link, a settings page or the browser console can all drive it.
 *
 * State lives on a per-request instance held in Svelte context, NOT at module level.
 * On the server a module is shared by every request in the process, so module-level
 * state would let the first visitor's decision determine what is rendered for everyone
 * who followed until the next deploy. Context is created fresh per render, which makes
 * each SSR pass independent.
 */

type Listener = (consent: StoredConsent) => void;

export class ConsentStore {
	#stored = $state<StoredConsent | null>(null);
	#preferencesOpen = $state(false);
	#listeners = new Set<Listener>();

	constructor(initial: StoredConsent | null = null) {
		this.#stored = initial;
	}

	/** A valid, current-version decision exists. */
	get decided(): boolean {
		return this.#stored !== null;
	}

	/** The banner's condition: the visitor has not chosen yet. */
	get needsPrompt(): boolean {
		return this.#stored === null;
	}

	get analytics(): boolean {
		return this.#stored?.analytics ?? false;
	}

	get marketing(): boolean {
		return this.#stored?.marketing ?? false;
	}

	/** The preference panel's condition. */
	get preferencesOpen(): boolean {
		return this.#preferencesOpen;
	}

	get timestamp(): string | null {
		return this.#stored?.timestamp ?? null;
	}

	openPreferences(): void {
		this.#preferencesOpen = true;
	}

	closePreferences(): void {
		this.#preferencesOpen = false;
	}

	/** Notify on any change. Returns an unsubscribe function. */
	onChange(listener: Listener): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	#write(record: StoredConsent): void {
		const secure = location.protocol === 'https:' ? '; secure' : '';
		const value = encodeURIComponent(JSON.stringify(record));
		document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax${secure}`;
	}

	#announce(record: StoredConsent): void {
		for (const listener of this.#listeners) listener(record);
	}

	/**
	 * Record a decision.
	 *
	 * Withdrawing a previously granted category reloads the page. Deleting `_ga` is not
	 * enough on its own: the already-loaded gtag keeps the client id in memory and simply
	 * rewrites the cookie on the next hit. A reload brings the page back with denied
	 * defaults emitted server-side and no in-memory state. Granting consent never reloads
	 * — that would be a hostile response to someone accepting.
	 */
	save(choice: ConsentCategories): void {
		if (!browser) return;

		const previous = this.#stored;
		const record = createConsent(choice);

		this.#write(record);
		this.#stored = record;
		this.#preferencesOpen = false;

		window.gtag?.('consent', 'update', signalsFor(record));
		window.gtag?.('set', 'ads_data_redaction', !record.marketing);

		const downgraded =
			(previous?.analytics === true && !record.analytics) ||
			(previous?.marketing === true && !record.marketing);

		if (downgraded) clearAnalyticsCookies();
		this.#announce(record);
		if (downgraded) location.reload();
	}

	acceptAll(): void {
		this.save({ analytics: true, marketing: true });
	}

	rejectAll(): void {
		this.save({ analytics: false, marketing: false });
	}

	/**
	 * Withdraw all non-essential consent.
	 *
	 * Reloads by default so every tag restarts under the new state. Pass
	 * `{ reload: false }` only where the caller is about to navigate anyway.
	 */
	withdraw({ reload = true }: { reload?: boolean } = {}): void {
		if (!browser) return;

		const record = createConsent({ analytics: false, marketing: false });

		this.#write(record);
		this.#stored = record;
		this.#preferencesOpen = false;

		window.gtag?.('consent', 'update', signalsFor(record));
		window.gtag?.('set', 'ads_data_redaction', true);
		clearAnalyticsCookies();

		this.#announce(record);
		if (reload) location.reload();
	}
}

const CONSENT_KEY = Symbol('ghi.consent');

/**
 * Create the request-scoped store. Called once, from the root layout's script body, with
 * the consent cookie the server already read — so the first client render agrees with the
 * markup and the banner never flashes for a visitor who has already decided.
 */
export function createConsentContext(initial: StoredConsent | null): ConsentStore {
	return setContext(CONSENT_KEY, new ConsentStore(initial));
}

/**
 * Read the consent store. Must be called during component initialisation, like any
 * context. Throws rather than returning a detached instance: a consent UI silently
 * driving a store nobody is rendering would be worse than a loud failure.
 */
export function getConsent(): ConsentStore {
	const store = getContext<ConsentStore | undefined>(CONSENT_KEY);
	if (!store) {
		throw new Error(
			'getConsent() called outside the consent context — is createConsentContext() still in the root layout?'
		);
	}
	return store;
}
