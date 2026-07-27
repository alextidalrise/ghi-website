import { CONSENT_COOKIE, CONSENT_VERSION, defaultSignals, signalsFor, WAIT_FOR_UPDATE_MS } from './consentCookie';

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
	/** Adds GTM Preview markers so the container can keep debug traffic out of prod. */
	debug: boolean;
};

/**
 * The `consent update` payload, as a JavaScript expression over two local booleans.
 *
 * Derived from `signalsFor` rather than written out by hand. The returning-visitor
 * update has to be computed in the browser now (see `buildStoredConsentReader`), which
 * means the category -> signal mapping exists both as TypeScript and as a string of
 * inline JS. Generating the second from the first is what stops them drifting: add a
 * signal to `signalsFor` and it appears here automatically, mapped to whichever category
 * actually drives it.
 *
 * The caller names the two booleans in the emitted scope, so this never has to assume
 * anything about the surrounding code.
 */
function consentUpdateExpression(analyticsVar: string, marketingVar: string): string {
	const granted = signalsFor({ analytics: true, marketing: true });
	const analyticsOnly = signalsFor({ analytics: true, marketing: false });
	const denied = signalsFor({ analytics: false, marketing: false });

	const entries = Object.keys(granted).map((key) => {
		const signal = key as keyof typeof granted;

		// Never varies with the decision — security_storage, which is always granted.
		if (granted[signal] === denied[signal]) {
			return `${signal}:${JSON.stringify(granted[signal])}`;
		}

		// Which category turns it on? Analytics-only grants tell the two groups apart.
		const driver = analyticsOnly[signal] === 'granted' ? analyticsVar : marketingVar;
		return `${signal}:(${driver}?'granted':'denied')`;
	});

	return `{${entries.join(',')}}`;
}

/**
 * Read the stored decision from `document.cookie` and replay it as a consent update.
 *
 * This used to be embedded server-side from the request's cookie, which made the HTML
 * different for every visitor and so impossible to cache at the edge. Reading it in the
 * browser instead makes the document identical for everyone — the decision is applied
 * from the cookie the visitor already has.
 *
 * It stays *synchronous and inline*, in the same block and still ahead of the container
 * loader, so the ordering guarantee is unchanged: a returning visitor's real decision is
 * on the dataLayer before GTM can fire a single tag. Nothing here waits for hydration.
 *
 * The validation deliberately mirrors `parseConsent` field for field. Being more lenient
 * than the parser would be the dangerous direction — GTM would act on a decision the
 * application considers invalid and is still prompting for.
 */
function buildStoredConsentReader(): string {
	return (
		'(function(){try{' +
		`var m=document.cookie.match(/(?:^|;\\s*)${CONSENT_COOKIE}=([^;]*)/);` +
		'if(!m)return;' +
		'var v=m[1],c;' +
		// Tolerate a hand-edited, un-encoded cookie exactly as parseConsent does.
		'try{c=JSON.parse(decodeURIComponent(v));}catch(e){c=JSON.parse(v);}' +
		`if(!c||c.version!==${CONSENT_VERSION})return;` +
		"if(typeof c.analytics!=='boolean'||typeof c.marketing!=='boolean')return;" +
		"if(typeof c.timestamp!=='string'||isNaN(Date.parse(c.timestamp)))return;" +
		`gtag('consent','update',${consentUpdateExpression('c.analytics', 'c.marketing')});` +
		// Redaction is only lifted once the visitor has actually accepted marketing.
		"gtag('set','ads_data_redaction',!c.marketing);" +
		'}catch(e){}})();'
	);
}

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
 *
 * Step 4 reads the cookie in the browser rather than being written in from the request.
 * That is what makes the document identical for every visitor and therefore cacheable at
 * the edge — see `buildStoredConsentReader`. It is still synchronous and still ahead of
 * step 5, so the ordering guarantee above is unchanged.
 */
export function buildBootstrapScript({ gtmId, debug }: BootstrapOptions): string {
	const lines = [
		'window.dataLayer=window.dataLayer||[];',
		'function gtag(){dataLayer.push(arguments);}',
		`gtag('consent','default',${embed({ ...defaultSignals(), wait_for_update: WAIT_FOR_UPDATE_MS })});`,
		"gtag('set','ads_data_redaction',true);"
	];

	lines.push(buildStoredConsentReader());

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
