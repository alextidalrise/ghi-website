import { browser } from '$app/environment';
import { clearAnalyticsCookies } from './browserCookies';
import {
	CONSENT_COOKIE,
	CONSENT_MAX_AGE,
	createConsent,
	signalsFor
} from './consentCookie';
import type { ConsentCategories, StoredConsent } from './types';

/**
 * Consent state and the public API the consent UI drives.
 *
 * This module owns the decision; the banner and preference panel own the presentation.
 * They are being built separately, so everything here is deliberately UI-agnostic — a
 * banner, a footer link, a settings page or the browser console can all drive it.
 *
 * Rune module, following the precedent in `src/lib/ui/pointer.svelte.ts`.
 */

let stored = $state<StoredConsent | null>(null);
let ready = $state(false);
let preferencesOpen = $state(false);

type Listener = (consent: StoredConsent) => void;
const listeners = new Set<Listener>();

/**
 * Seed state from the server-read cookie.
 *
 * Called in the root layout's script body — not `onMount` — so the first client render
 * already agrees with the server. That is what lets the future banner render without a
 * flash for a visitor who has already decided.
 */
export function initConsent(initial: StoredConsent | null): void {
	if (ready) return;
	stored = initial;
	ready = true;
}

export const consent = {
	/** `initConsent` has run. Until then, render nothing consent-related. */
	get ready() {
		return ready;
	},
	/** A valid, current-version decision exists. */
	get decided() {
		return stored !== null;
	},
	/** The banner's condition: we are initialised and the visitor has not chosen. */
	get needsPrompt() {
		return ready && stored === null;
	},
	get analytics() {
		return stored?.analytics ?? false;
	},
	get marketing() {
		return stored?.marketing ?? false;
	},
	/** The preference panel's condition. */
	get preferencesOpen() {
		return preferencesOpen;
	},
	get timestamp() {
		return stored?.timestamp ?? null;
	}
};

export function openPreferences(): void {
	preferencesOpen = true;
}

export function closePreferences(): void {
	preferencesOpen = false;
}

/** Notify on any change. Returns an unsubscribe function. */
export function onConsentChange(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function writeCookie(record: StoredConsent): void {
	const value = encodeURIComponent(JSON.stringify(record));
	const secure = location.protocol === 'https:' ? '; secure' : '';
	document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax${secure}`;
}

/**
 * Record a decision.
 *
 * Withdrawing a previously granted category reloads the page. Deleting `_ga` is not
 * enough on its own: the already-loaded gtag keeps the client id in memory and simply
 * rewrites the cookie on the next hit. A reload brings the page back with denied
 * defaults emitted server-side and no in-memory state. Granting consent never reloads —
 * that would be a hostile response to someone accepting.
 */
export function saveConsent(choice: ConsentCategories): void {
	if (!browser) return;

	const previous = stored;
	const record = createConsent(choice);

	writeCookie(record);
	stored = record;
	preferencesOpen = false;

	window.gtag?.('consent', 'update', signalsFor(record));
	window.gtag?.('set', 'ads_data_redaction', !record.marketing);

	const downgraded =
		(previous?.analytics && !record.analytics) || (previous?.marketing && !record.marketing);

	if (downgraded) clearAnalyticsCookies();

	for (const listener of listeners) listener(record);

	if (downgraded) location.reload();
}

export function acceptAll(): void {
	saveConsent({ analytics: true, marketing: true });
}

export function rejectAll(): void {
	saveConsent({ analytics: false, marketing: false });
}

/**
 * Withdraw all non-essential consent.
 *
 * Reloads by default so every tag restarts under the new state. Pass `{ reload: false }`
 * only where the caller is about to navigate anyway.
 */
export function withdrawConsent({ reload = true }: { reload?: boolean } = {}): void {
	if (!browser) return;

	const record = createConsent({ analytics: false, marketing: false });

	writeCookie(record);
	stored = record;
	preferencesOpen = false;

	window.gtag?.('consent', 'update', signalsFor(record));
	window.gtag?.('set', 'ads_data_redaction', true);
	clearAnalyticsCookies();

	for (const listener of listeners) listener(record);

	if (reload) location.reload();
}
