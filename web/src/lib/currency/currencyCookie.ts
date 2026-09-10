/**
 * The visitor's chosen display currency, as a cookie.
 *
 * `ghi_currency=GBP` — a bare ISO code, nothing else, written only when the visitor picks a
 * currency (a preference cookie, listed on /cookies). It is NEVER read on the server: pages
 * are edge-cached as visitor-invariant HTML, so the choice is applied in the browser — by
 * the pre-paint script in app.html before first paint, and by `CurrencyStore` afterwards.
 * The regex here and the one inline in app.html must agree.
 */

import { isCurrency } from './convert';
import type { Currency } from './rates';

export const CURRENCY_COOKIE = 'ghi_currency';
/** One year, per decision D-3. */
export const CURRENCY_MAX_AGE = 60 * 60 * 24 * 365;

/** The chosen currency in a raw `document.cookie` / `Cookie:` string, or null. */
export function readCurrencyCookie(cookieHeader: string | null | undefined): Currency | null {
	if (!cookieHeader) return null;
	const match = new RegExp(`(?:^|;\\s*)${CURRENCY_COOKIE}=([A-Z]{3})(?:;|$)`).exec(cookieHeader);
	const value = match?.[1];
	return isCurrency(value) ? value : null;
}

/** The `Set-Cookie`-shaped string to assign to `document.cookie`. `null` clears the cookie. */
export function serializeCurrencyCookie(value: Currency | null, secure: boolean): string {
	const maxAge = value ? CURRENCY_MAX_AGE : 0;
	return `${CURRENCY_COOKIE}=${value ?? ''}; path=/; max-age=${maxAge}; samesite=lax${secure ? '; secure' : ''}`;
}
