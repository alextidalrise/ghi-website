import type { ConsentCategories, ConsentSignals, StoredConsent } from './types';

/**
 * Consent persistence and Google Consent Mode v2 signal mapping.
 *
 * Everything here is pure — it takes and returns strings and plain objects — so the
 * cookie contract can be tested exhaustively in Node. The DOM writes live in
 * `consent.svelte.ts`; the server read lives in `server.ts`.
 */

export const CONSENT_COOKIE = 'ghi_consent';

/**
 * Bump when a material policy or category change must invalidate existing decisions.
 * `parseConsent` returns null for any lower version, which flips `needsPrompt` back on
 * and re-asks every visitor. Never reuse a version number for a different meaning.
 */
export const CONSENT_VERSION = 1;

/** 180 days, per the retention decision in the brief. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

/**
 * How long Google's tags wait for a `consent update` before firing on the defaults.
 * Largely academic for returning visitors — we read their decision server-side and emit
 * the update in the same synchronous block, before the loader. It matters only for a
 * first-time visitor whose decision is still pending a banner click.
 */
export const WAIT_FOR_UPDATE_MS = 500;

/** No stored decision means no consent. Never assume acceptance. */
export const NO_CONSENT: ConsentCategories = { analytics: false, marketing: false };

/**
 * The pre-decision baseline. `security_storage` is granted because it covers strictly
 * necessary behaviour the visitor cannot opt out of; everything else starts denied so
 * no Google cookie can be set before a choice is made.
 */
export function defaultSignals(): ConsentSignals {
	return {
		ad_storage: 'denied',
		ad_user_data: 'denied',
		ad_personalization: 'denied',
		analytics_storage: 'denied',
		personalization_storage: 'denied',
		security_storage: 'granted'
	};
}

/**
 * Map visitor-facing categories onto Google's signals.
 *
 * Analytics grants only `analytics_storage`. Marketing grants the three advertising
 * signals plus `personalization_storage` — grouping the latter keeps the choice honest,
 * since ad personalisation without personalisation storage is a distinction the visitor
 * would not recognise.
 */
export function signalsFor(consent: StoredConsent | ConsentCategories | null): ConsentSignals {
	if (!consent) return defaultSignals();

	const analytics = consent.analytics ? 'granted' : 'denied';
	const marketing = consent.marketing ? 'granted' : 'denied';

	return {
		ad_storage: marketing,
		ad_user_data: marketing,
		ad_personalization: marketing,
		analytics_storage: analytics,
		personalization_storage: marketing,
		// Necessary: always on, never offered as a choice.
		security_storage: 'granted'
	};
}

/**
 * Parse and validate a stored consent cookie.
 *
 * Returns null for anything we cannot fully trust — malformed JSON, wrong types, or a
 * superseded schema version. A null result means "no decision yet", which re-shows the
 * banner. Failing closed is the only safe direction here.
 */
export function parseConsent(raw: string | null | undefined): StoredConsent | null {
	if (!raw) return null;

	let parsed: unknown;
	try {
		parsed = JSON.parse(decodeURIComponent(raw));
	} catch {
		// Tolerate an un-encoded value (hand-edited cookie), but still fail closed.
		try {
			parsed = JSON.parse(raw);
		} catch {
			return null;
		}
	}

	if (typeof parsed !== 'object' || parsed === null) return null;

	const candidate = parsed as Record<string, unknown>;

	if (candidate.version !== CONSENT_VERSION) return null;
	if (typeof candidate.analytics !== 'boolean') return null;
	if (typeof candidate.marketing !== 'boolean') return null;
	if (typeof candidate.timestamp !== 'string') return null;
	if (Number.isNaN(Date.parse(candidate.timestamp))) return null;

	return {
		version: CONSENT_VERSION,
		analytics: candidate.analytics,
		marketing: candidate.marketing,
		timestamp: candidate.timestamp
	};
}

/** Build the record we persist for a decision. */
export function createConsent(choice: ConsentCategories, now: Date = new Date()): StoredConsent {
	return {
		version: CONSENT_VERSION,
		analytics: choice.analytics,
		marketing: choice.marketing,
		timestamp: now.toISOString()
	};
}

/** Serialise a decision to the cookie value (URL-encoded JSON). */
export function serializeConsent(choice: ConsentCategories, now: Date = new Date()): string {
	return encodeURIComponent(JSON.stringify(createConsent(choice, now)));
}

/**
 * Cookie attributes for `ghi_consent`.
 *
 * Deliberately NOT httpOnly: the consent UI is a client component and must be able to
 * read and rewrite the decision. The value is non-identifying by design — two booleans,
 * a version and a timestamp — so JS readability costs nothing.
 */
export function consentCookieOptions(url: { protocol: string }) {
	return {
		path: '/',
		sameSite: 'lax' as const,
		secure: url.protocol === 'https:',
		maxAge: CONSENT_MAX_AGE
	};
}

/** Read one cookie from a raw `document.cookie` or `Cookie:` header string. */
export function readCookie(cookieString: string, name: string): string | null {
	for (const part of cookieString.split(';')) {
		const eq = part.indexOf('=');
		if (eq === -1) continue;
		if (part.slice(0, eq).trim() !== name) continue;
		return part.slice(eq + 1).trim();
	}
	return null;
}
