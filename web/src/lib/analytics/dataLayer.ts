import { browser } from '$app/environment';
import { sanitizeEvent } from './sanitize';
import type { AnalyticsMode } from './config';
import type { DataLayerEvent } from './types';

/**
 * The single door to `window.dataLayer`.
 *
 * Deliberately thin — all the judgement lives in `sanitize.ts`, which is pure and fully
 * tested. What remains here is the SSR guard, the dev-versus-production reaction to a
 * violation, and the per-navigation session reset.
 *
 * Nothing outside `src/lib/analytics/` may touch `window.dataLayer`; `sanitize.test.ts`
 * enforces that with a grep assertion.
 */

let mode: AnalyticsMode = 'off';

type DataLayerModel = {
	reset(): void;
};

/** Callbacks that clear per-page state (impression keys, lead fingerprints, …). */
const sessionResets = new Set<() => void>();

/** Called once from the root layout with the server-resolved gate. */
export function configureAnalytics(next: AnalyticsMode): void {
	mode = next;
}

export function analyticsEnabled(): boolean {
	return mode !== 'off';
}

/** Register state to be cleared at the start of each navigation. */
export function onSessionReset(reset: () => void): void {
	sessionResets.add(reset);
}

/** Clear per-page dedupe state. Called by `trackPageView` on every navigation. */
export function resetSession(): void {
	for (const reset of sessionResets) reset();
}

/**
 * Push an event, after stripping anything unsafe or empty.
 *
 * In development a violation throws, so a leak breaks the page at the call site while
 * someone is looking at it. In production the offending keys are dropped and the rest is
 * sent: losing a dimension is a much smaller loss than losing a conversion count.
 */
export function push(event: DataLayerEvent): void {
	// Server-rendered code paths call the same typed helpers; there is no data layer there.
	if (!browser) return;

	const { event: clean, violations } = sanitizeEvent(event);

	if (violations.length > 0) {
		const detail = violations.map((v) => `${v.key} (${v.kind})`).join(', ');
		const message = `[analytics] dropped unsafe field(s) on ${event?.event}: ${detail}`;

		if (import.meta.env.DEV) {
			console.error(message, event);
			throw new Error(message);
		}
	}

	if (!clean) return;
	if (!analyticsEnabled()) return;

	window.dataLayer = window.dataLayer ?? [];

	// GTM keeps data-layer values in an abstract model for the lifetime of the page.
	// Without clearing that model, parameters from an earlier event leak into later ones;
	// Version 2 variables also merge arrays, so a one-item select_item can retain the rest
	// of a previous view_item_list. Reset immediately before every application event so
	// each payload is evaluated in isolation.
	window.dataLayer.push(function (this: DataLayerModel) {
		this.reset();
	});

	// The reset also clears our debug marker. Restore it before the event so the GTM
	// blocking exception continues to protect the production GA4 property during QA.
	if (mode === 'debug') {
		window.dataLayer.push({ ghi_environment: 'debug' });
	}

	window.dataLayer.push(clean);
}
