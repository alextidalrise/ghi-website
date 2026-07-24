import { defaultSignals, signalsFor, WAIT_FOR_UPDATE_MS } from './consentCookie';
import type { StoredConsent } from './types';

/**
 * The inline bootstrap script.
 *
 * This is the one piece of the implementation where ordering is a correctness
 * requirement rather than a preference: Google's consent defaults must execute before
 * the GTM container loads, or tags can fire — and set cookies — before we have said
 * anything about consent. Building it as a pure string function means that ordering is
 * asserted in `snippet.test.ts` rather than hoped for.
 *
 * It is injected server-side via `transformPageChunk` (see `server.ts`) so it lands in
 * <head> ahead of everything. A client-side module would run after hydration, which is
 * both far too late for the container and no longer strictly ordered against it.
 */

/**
 * Serialise a value for embedding in an inline script.
 *
 * `<` is escaped so no value can terminate the script element early. Nothing we embed
 * is attacker-controlled today — the signals come from a closed enum and the GTM id
 * from an environment variable — but this is the kind of guard that must exist before
 * it is needed, not after.
 */
function embed(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}

export type BootstrapOptions = {
	gtmId: string;
	/** The visitor's stored decision, if they have made one. */
	consent: StoredConsent | null;
	/** Adds GTM Preview markers so the container can keep debug traffic out of prod. */
	debug: boolean;
};

/**
 * Build the full inline `<script>` for an eligible page.
 *
 * Order within the script is deliberate and load-bearing:
 *   1. `dataLayer` exists before anything can push to it.
 *   2. Consent defaults — everything denied except security storage.
 *   3. `ads_data_redaction` on, so pre-consent ad requests carry no identifiers.
 *   4. A returning visitor's actual decision, as a separate `update`.
 *   5. Only then, the container.
 *
 * Steps 2 and 4 stay separate rather than collapsing into an already-granted default.
 * Google's contract is that `default` describes the pre-decision baseline and `update`
 * records that a decision happened; merging them misreports the consent state to
 * Consent Mode's own modelling. Both are synchronous, so separating them costs nothing.
 */
export function buildBootstrapScript({ gtmId, consent, debug }: BootstrapOptions): string {
	const lines = [
		'window.dataLayer=window.dataLayer||[];',
		'function gtag(){dataLayer.push(arguments);}',
		`gtag('consent','default',${embed({ ...defaultSignals(), wait_for_update: WAIT_FOR_UPDATE_MS })});`,
		"gtag('set','ads_data_redaction',true);"
	];

	if (consent) {
		lines.push(`gtag('consent','update',${embed(signalsFor(consent))});`);
		// Redaction is only lifted once the visitor has actually accepted marketing.
		lines.push(`gtag('set','ads_data_redaction',${consent.marketing ? 'false' : 'true'});`);
	}

	if (debug) {
		// Lets the container block production GA4 tags on a debug session, so QA can use
		// GTM Preview without polluting real reporting.
		lines.push(`dataLayer.push({ghi_environment:'debug'});`);
		lines.push("gtag('set',{debug_mode:true});");
	}

	lines.push(
		"(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});" +
			"var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';" +
			"j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;" +
			`f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${embed(gtmId)});`
	);

	return `<script>${lines.join('')}</script>`;
}

/**
 * What we emit when analytics is switched off.
 *
 * A comment rather than nothing at all, so QA can view source on any environment and
 * see immediately *why* there is no tracking, instead of wondering whether the build is
 * broken.
 */
export function buildDisabledComment(reason: string): string {
	const safe = reason.replace(/--+>?/g, '').replace(/</g, '');
	return `<!-- analytics off: ${safe} -->`;
}
