/**
 * Shared, reactive "is this a fine pointer device?" signal.
 *
 * The filter selectors render a native control as the SSR / touch / no-JS baseline
 * and upgrade to a bespoke listbox only on devices with a fine pointer (mouse,
 * trackpad, stylus). Touch keeps the native picker, which is best-in-class there.
 *
 * `ready` starts false on both server and client so the first client render matches
 * SSR (native baseline) — no hydration mismatch. It flips true after `ensurePointer()`
 * runs in an effect post-mount, at which point `fine` reflects the real device and the
 * components swap native → custom where appropriate.
 */
import { browser } from '$app/environment';

let fine = $state(false);
let ready = $state(false);
let started = false;

/** Idempotent: the first component to mount wires the media query; later calls no-op. */
export function ensurePointer(): void {
	if (started || !browser) return;
	started = true;
	const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
	fine = mq.matches;
	ready = true;
	mq.addEventListener('change', (event) => {
		fine = event.matches;
	});
}

export const pointer = {
	/** True once the device has been measured client-side. */
	get ready() {
		return ready;
	},
	/** True on fine-pointer devices (mouse/trackpad/stylus). */
	get fine() {
		return fine;
	},
	/** Convenience: show the bespoke listbox (measured AND fine-pointer). */
	get enhanced() {
		return ready && fine;
	}
};
