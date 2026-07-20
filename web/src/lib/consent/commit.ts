import { tick } from 'svelte';
import type { ConsentStore } from '$lib/analytics';
import { willReload } from './copy';

/**
 * How long the saving state stays on screen before a downgrade reloads the page.
 *
 * Withdrawing a granted category forces a reload (see ConsentStore.save). Reloading one
 * or two frames after the click reads as the page refreshing on its own, which is exactly
 * the jarring behaviour the brief asks us to design around — so the state is held long
 * enough to actually be read. Deliberately not tied to prefers-reduced-motion: this is a
 * legibility pause, not an animation.
 */
export const SAVING_HOLD_MS = 450;

/**
 * Record a decision, showing a saving state first when the store is going to reload.
 *
 * Shared by the banner and the preference panel so the two cannot drift: a decision made
 * in either place has to behave identically, and this is the only place that knows a
 * reload needs announcing.
 *
 * Granting never waits — accepting should feel instant.
 */
export async function commitConsent(
	consent: ConsentStore,
	next: { analytics: boolean; marketing: boolean },
	setSaving: (saving: boolean) => void
): Promise<void> {
	if (willReload({ analytics: consent.analytics, marketing: consent.marketing }, next)) {
		setSaving(true);
		await tick();
		await new Promise((resolve) => setTimeout(resolve, SAVING_HOLD_MS));
	}

	consent.save(next);
}
