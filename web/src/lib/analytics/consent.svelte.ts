import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { clearAnalyticsCookies } from './browserCookies';
import {
	CONSENT_COOKIE,
	CONSENT_MAX_AGE,
	createConsent,
	parseConsent,
	readCookie,
	signalsFor
} from './consentCookie';
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
	#hydrated = $state(false);
	#preferencesOpen = $state(false);
	#listeners = new Set<Listener>();

	constructor(initial: StoredConsent | null = null) {
		this.#stored = initial;
	}

	/**
	 * Adopt the decision stored in `document.cookie`.
	 *
	 * The server used to read the cookie and hand it in via the constructor, which put a
	 * per-visitor value into the SSR payload and made the page uncacheable. Reading it
	 * here keeps the document identical for everyone.
	 *
	 * Called from the root layout's `onMount`, i.e. after the first client render has
	 * already matched the server's. Doing it any earlier would make the client render a
	 * banner the server did not, which is a hydration mismatch.
	 */
	hydrate(): void {
		if (!browser || this.#hydrated) return;

		this.adopt(parseConsent(readCookie(document.cookie, CONSENT_COOKIE)));
	}

	/**
	 * Record what the visitor's stored decision turned out to be — including "none".
	 *
	 * The state transition behind `hydrate()`, split out so it can be driven without a
	 * DOM. `null` here means "we looked and there was no valid decision", which is a
	 * different thing from the pre-read state and is what turns the banner on.
	 */
	adopt(stored: StoredConsent | null): void {
		this.#stored = stored;
		this.#hydrated = true;
	}

	/** The cookie has been read. Until then the store cannot answer for the visitor. */
	get hydrated(): boolean {
		return this.#hydrated;
	}

	/** A valid, current-version decision exists. */
	get decided(): boolean {
		return this.#stored !== null;
	}

	/**
	 * The banner's condition: the visitor has not chosen yet.
	 *
	 * False until hydration, so the banner is absent from the server's HTML and from the
	 * first client render. That is what stops it flashing at a visitor who has already
	 * decided — previously avoided by reading the cookie server-side, which is exactly
	 * what made the page uncacheable. A first-time visitor sees it a tick after hydration
	 * instead of in the initial paint.
	 */
	get needsPrompt(): boolean {
		return this.#hydrated && this.#stored === null;
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
	 * defaults and no in-memory state — the bootstrap re-reads the now-withdrawn cookie
	 * and replays it before the container loads. Granting consent never reloads; that
	 * would be a hostile response to someone accepting.
	 */
	save(choice: ConsentCategories): void {
		if (!browser) return;

		const previous = this.#stored;
		const record = createConsent(choice);

		this.#write(record);
		this.#stored = record;
		// A decision recorded before the cookie read is itself an answer for this visitor.
		this.#hydrated = true;
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
		this.#hydrated = true;
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
 * Create the request-scoped store. Called once, from the root layout's script body.
 *
 * `initial` is null in normal operation — the server no longer reads the consent cookie,
 * because doing so made the HTML per-visitor and uncacheable. The layout calls
 * `hydrate()` on mount to pick the decision up from `document.cookie`. The parameter is
 * kept so tests can construct a store in a known state without touching the DOM.
 */
export function createConsentContext(initial: StoredConsent | null = null): ConsentStore {
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
