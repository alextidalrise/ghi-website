import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { CURRENCY_NAMES } from './convert';
import { readCurrencyCookie, serializeCurrencyCookie } from './currencyCookie';
import { FALLBACK_RATES, RATES_AS_OF, type Currency, type RateTable } from './rates';

/**
 * The visitor's display currency and the public API the switcher drives.
 *
 * Modelled on `analytics/consent.svelte.ts`, for the same reason: public pages are
 * edge-cached as visitor-invariant HTML, so the server never reads the cookie and the
 * choice is applied in the browser. Every price is pre-rendered in every currency (see
 * `Price.svelte`) and a `data-currency` attribute on <html> selects the visible one, so
 * applying the choice is a one-attribute flip — no re-render, no flash. A tiny inline
 * script in app.html sets the attribute from the cookie before first paint; this store
 * takes over after hydration.
 *
 * State lives on a per-request instance held in Svelte context, NOT at module level: on
 * the server a module is shared by every request in the process, so module-level state
 * would let one visitor's choice leak into the next visitor's render.
 */

export const CURRENCY_ATTRIBUTE = 'data-currency';

export type RatesContext = { rates: RateTable; asOf: string };

const FALLBACK_CONTEXT: RatesContext = { rates: FALLBACK_RATES, asOf: RATES_AS_OF };

export class CurrencyStore {
	#chosen = $state<Currency | null>(null);
	#hydrated = $state(false);
	#announcement = $state('');
	readonly rates: RateTable;
	readonly asOf: string;

	constructor(context: RatesContext = FALLBACK_CONTEXT, initial: Currency | null = null) {
		this.rates = context.rates;
		this.asOf = context.asOf;
		this.#chosen = initial;
	}

	/**
	 * Adopt the choice stored in `document.cookie`. Called from the root layout's
	 * `onMount`, after the first client render has matched the server's — the menu's
	 * checked row is the only markup that depends on it, and the menu is closed then.
	 */
	hydrate(): void {
		if (!browser || this.#hydrated) return;
		this.adopt(readCurrencyCookie(document.cookie));
		// Normally already set by the pre-paint script; a belt for a missing brace.
		this.#applyAttribute();
	}

	/** DOM-free state transition behind `hydrate()`. */
	adopt(chosen: Currency | null): void {
		this.#chosen = chosen;
		this.#hydrated = true;
	}

	get hydrated(): boolean {
		return this.#hydrated;
	}

	/** The chosen display currency, or null for "as listed". */
	get chosen(): Currency | null {
		return this.#chosen;
	}

	/** The latest change, for a polite live region. Empty until the visitor acts. */
	get announcement(): string {
		return this.#announcement;
	}

	/**
	 * Record a choice. `null` returns to each listing's own currency. Writes the cookie,
	 * flips the root attribute (which re-selects every pre-rendered price via CSS) and
	 * announces the change. Never navigates or reloads.
	 */
	select(currency: Currency | null): void {
		if (!browser) return;
		this.#chosen = currency;
		this.#hydrated = true;
		document.cookie = serializeCurrencyCookie(currency, location.protocol === 'https:');
		this.#applyAttribute();
		this.#announcement = currency
			? `Prices shown in ${CURRENCY_NAMES[currency].toLowerCase()}. Converted prices are approximate.`
			: "Prices shown in each listing's own currency.";
	}

	#applyAttribute(): void {
		const root = document.documentElement;
		if (this.#chosen) root.setAttribute(CURRENCY_ATTRIBUTE, this.#chosen);
		else root.removeAttribute(CURRENCY_ATTRIBUTE);
	}
}

/** Exported for SSR tests, which provide the store via `render(..., { context })`. */
export const CURRENCY_CONTEXT_KEY = Symbol('ghi.currency');
const CURRENCY_KEY = CURRENCY_CONTEXT_KEY;

/**
 * Create the request-scoped store. Called once, from the root layout's script body, with
 * the live rate table the layout load already ships (`data.rates`, `data.ratesAsOf`).
 */
export function createCurrencyContext(
	context: Partial<RatesContext> = {},
	initial: Currency | null = null
): CurrencyStore {
	return setContext(
		CURRENCY_KEY,
		new CurrencyStore(
			{ rates: context.rates ?? FALLBACK_RATES, asOf: context.asOf ?? RATES_AS_OF },
			initial
		)
	);
}

/**
 * Read the store. Must be called during component initialisation. Throws rather than
 * returning a detached instance: a switcher silently driving a store nobody provided
 * would be worse than a loud failure.
 */
export function getCurrency(): CurrencyStore {
	const store = getContext<CurrencyStore | undefined>(CURRENCY_KEY);
	if (!store) {
		throw new Error(
			'getCurrency() called outside the currency context — is createCurrencyContext() still in the root layout?'
		);
	}
	return store;
}

/**
 * The rate table for rendering prices. Tolerant, unlike `getCurrency()`: a price rendered
 * outside the root layout (a component test, a preview) falls back to the static snapshot
 * instead of failing, because a price is content and must always render.
 */
export function getCurrencyRates(): RatesContext {
	const store = getContext<CurrencyStore | undefined>(CURRENCY_KEY);
	return store ? { rates: store.rates, asOf: store.asOf } : FALLBACK_CONTEXT;
}
