import type { SignupSource } from './mailchimp';

/**
 * Request parsing and abuse guards for /api/newsletter, kept apart from the endpoint so they
 * can be unit-tested without a request.
 */

// Deliberately forgiving: catches the obvious typos without rejecting the long tail of
// valid addresses a stricter regex would. Mailchimp rejects the fakes it recognises.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Country slugs as Sanity writes them. Anything else never reaches Mailchimp as a tag. */
const MARKET_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_MARKETS = 12;

const SOURCES: readonly SignupSource[] = ['footer', 'newsletter-page'];

/**
 * The hidden field bots fill in. The name must match no browser autofill heuristic: a trap
 * named `company` gets filled by Chrome's organisation autofill (which ignores
 * autocomplete="off"), silently discarding a real subscriber who is then told they're in.
 */
export const HONEYPOT_FIELD = 'nl_hp_leave_blank';

export type ParsedSignup =
	| {
			ok: true;
			bot: boolean;
			email: string;
			source: SignupSource;
			markets: string[];
			campaign: string | null;
	  }
	| { ok: false; error: string };

export function parseNewsletterSignup(body: unknown): ParsedSignup {
	const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

	const email = typeof input.email === 'string' ? input.email.trim() : '';
	if (!EMAIL.test(email)) return { ok: false, error: 'Please enter a valid email address.' };

	const honeypot = input[HONEYPOT_FIELD];
	const bot = typeof honeypot === 'string' && honeypot.trim() !== '';

	const source = SOURCES.includes(input.source as SignupSource)
		? (input.source as SignupSource)
		: 'footer';

	return {
		ok: true,
		bot,
		email,
		source,
		markets: parseMarkets(input.markets),
		campaign: sanitizeCampaign(input.campaign)
	};
}

/** Well-formed, unique country slugs; anything else never reaches Mailchimp as a tag. */
export function parseMarkets(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	const slugs = value.filter(
		(slug): slug is string => typeof slug === 'string' && slug.length <= 40 && MARKET_SLUG.test(slug)
	);
	return [...new Set(slugs)].slice(0, MAX_MARKETS);
}

/**
 * `utm_campaign` is visitor-controlled text that becomes a Mailchimp tag, so it is reduced to
 * a short slug: a hand-edited URL can't flood the audience with junk tags.
 */
export function sanitizeCampaign(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const slug = value
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40);
	return slug || null;
}

/**
 * A small per-IP sliding-window limit. It is per server instance, so on Vercel it slows a
 * single burst rather than enforcing a global cap. That is enough to stop a script hammering
 * one warm function, which is the realistic abuse for a signup form.
 */
export class SignupRateLimiter {
	private hits = new Map<string, number[]>();

	constructor(
		private readonly limit = 5,
		private readonly windowMs = 10 * 60 * 1000,
		private readonly now: () => number = Date.now
	) {}

	allow(key: string): boolean {
		const cutoff = this.now() - this.windowMs;
		const recent = (this.hits.get(key) ?? []).filter((at) => at > cutoff);
		if (recent.length >= this.limit) {
			this.hits.set(key, recent);
			return false;
		}
		recent.push(this.now());
		this.hits.set(key, recent);
		// Keep the map from growing without bound on a long-lived instance.
		if (this.hits.size > 5000) this.hits.clear();
		return true;
	}
}

/** One limiter per server instance, shared by /api/newsletter and the /newsletter action. */
export const signupLimiter = new SignupRateLimiter();

/** getClientAddress throws where the adapter cannot tell (e.g. some local setups). */
export function safeClientAddress(getClientAddress: () => string): string | null {
	try {
		return getClientAddress();
	} catch {
		return null;
	}
}
