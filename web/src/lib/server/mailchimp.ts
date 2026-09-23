import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

/**
 * Newsletter subscription via the Mailchimp Marketing API. Server-only (the file lives under
 * `$lib/server`, which SvelteKit refuses to import into client code) because the API key is a
 * secret and must never reach the browser.
 *
 * Returns a discriminated result rather than throwing, mirroring the HubSpot handlers'
 * contract, so the endpoint maps cleanly onto the idle/submitting/success/error states the
 * forms render.
 *
 * Single opt-in (2026-09-23, owner decision). Members are added as `subscribed` straight
 * away; there is no confirmation email. That email used to be the consent record, so the
 * record now lives on the member instead: `ip_signup` + `timestamp_signup` say who agreed and
 * when, the `Source:` tag says on which form, and both forms show the consent line beside the
 * button. Keep all three if this is ever refactored. Without them there is no evidence of consent.
 *
 * Segmentation uses tags, not interest groups: a tag is created by name on first use, so a
 * new market in Sanity needs no Mailchimp setup and no id mapping in env.
 *
 * Config, all via env (none committed — see web/.env.example):
 *   MAILCHIMP_API_KEY       — the secret key. Its trailing `-usXX` is the datacenter.
 *   MAILCHIMP_AUDIENCE_ID   — the target audience (list) id.
 *   MAILCHIMP_SERVER_PREFIX — optional; overrides the datacenter derived from the key.
 */

export type SubscribeResult = { ok: true } | { ok: false; status: number; error: string };

/** Which form the address came from. Recorded as a tag, so it must stay human-readable. */
export type SignupSource = 'footer' | 'newsletter-page';

export type SubscribeInput = {
	email: string;
	source: SignupSource;
	/** The visitor's IP, recorded as consent evidence. */
	ip?: string | null;
	/** Market (country) slugs the visitor ticked. Already validated by the caller. */
	markets?: string[];
	/** Sanitised `utm_campaign`, when the visit carried one. */
	campaign?: string | null;
};

const GENERIC_ERROR = 'Something went wrong on our end. Please try again shortly.';

const SOURCE_LABELS: Record<SignupSource, string> = {
	footer: 'Footer',
	'newsletter-page': 'Newsletter page'
};

/** The tags a new sign-up carries. Exported for tests. */
export function signupTags({ source, markets = [], campaign }: SubscribeInput): string[] {
	return [
		`Source: ${SOURCE_LABELS[source]}`,
		...markets.map((slug) => `Market: ${slug}`),
		...(campaign ? [`Campaign: ${campaign}`] : [])
	];
}

type Config = { endpoint: string; authorization: string };

function config(): Config | null {
	const apiKey = env.MAILCHIMP_API_KEY;
	const audienceId = env.MAILCHIMP_AUDIENCE_ID;
	// The datacenter is the segment after the last `-` in the key (e.g. `us21`). Allow an
	// explicit override in case the key format ever changes.
	const serverPrefix = env.MAILCHIMP_SERVER_PREFIX || apiKey?.split('-').pop();
	if (!apiKey || !audienceId || !serverPrefix) return null;

	return {
		endpoint: `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
		// Basic auth: any username, the key as the password. btoa is fine here — this runs
		// only on the server, never against a browser's non-Latin1 constraints.
		authorization: `Basic ${btoa(`anystring:${apiKey}`)}`
	};
}

export async function subscribeToNewsletter(input: SubscribeInput): Promise<SubscribeResult> {
	const settings = config();
	if (!settings) {
		// Misconfiguration: never show a success state we cannot back up.
		console.error('Newsletter not configured: set MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID');
		return {
			ok: false,
			status: 503,
			error: 'Sign-up is briefly unavailable. Please try again shortly.'
		};
	}

	const { endpoint, authorization } = settings;
	const headers = { authorization, 'content-type': 'application/json' };
	const tags = signupTags(input);
	const consent = consentFields(input.ip);

	try {
		let response = await post(endpoint, headers, input.email, tags, consent);
		let detail = await rejection(response);

		// The consent fields are evidence, not the sign-up. If Mailchimp won't take one (it has
		// been strict about IP formats and timestamps), sign the visitor up without it rather
		// than failing them, and log it so the evidence gap is visible.
		const badConsent = rejectedFields(detail).filter((f) => f in consent);
		if (badConsent.length > 0) {
			console.error('Mailchimp refused consent fields; retrying without them:', badConsent, detail);
			for (const field of badConsent) delete consent[field as keyof typeof consent];
			response = await post(endpoint, headers, input.email, tags, consent);
			detail = await rejection(response);
		}

		if (response.ok) return { ok: true };

		// Mailchimp answers 400 "Member Exists" when the address is already on the audience —
		// whether subscribed, still pending, or previously unsubscribed. Report success in every
		// case: the visitor did the one thing the form lets them do, and reflecting their actual
		// subscription state back would leak it to anyone who can type an address into the box.
		if (response.status === 400 && detail.title === 'Member Exists') {
			await updateExistingMember(`${endpoint}/${memberHash(input.email)}`, headers, tags, consent);
			return { ok: true };
		}

		console.error(`Mailchimp subscribe failed (${response.status}):`, detail);

		// Only blame the address when Mailchimp does: "Invalid Resource" covers every field,
		// so it means "check your email" only when the email is the field it names, or when
		// it names none and says the address looks fake or invalid.
		const fields = rejectedFields(detail);
		const addressAtFault =
			fields.includes('email_address') ||
			(fields.length === 0 && /fake|invalid/i.test(detail.detail ?? ''));
		if (response.status === 400 && detail.title === 'Invalid Resource' && addressAtFault) {
			return { ok: false, status: 422, error: 'Please check your email address and try again.' };
		}

		return { ok: false, status: 502, error: GENERIC_ERROR };
	} catch (cause) {
		console.error('Mailchimp subscribe threw', cause);
		return { ok: false, status: 502, error: GENERIC_ERROR };
	}
}

type Rejection = { title?: string; detail?: string; errors?: Array<{ field?: string; message?: string }> };

async function post(
	endpoint: string,
	headers: Record<string, string>,
	email: string,
	tags: string[],
	consent: Record<string, string>
): Promise<Response> {
	return fetch(endpoint, {
		method: 'POST',
		headers,
		body: JSON.stringify({ email_address: email, status: 'subscribed', tags, ...consent })
	});
}

async function rejection(response: Response): Promise<Rejection> {
	if (response.ok) return {};
	return (await response.json().catch(() => ({}))) as Rejection;
}

function rejectedFields(detail: Rejection): string[] {
	return (detail.errors ?? []).map((e) => e.field ?? '').filter(Boolean);
}

/**
 * Consent evidence in the shapes Mailchimp itself returns: an IPv4 address (an IPv4-mapped
 * IPv6 address is unwrapped) and a second-precision UTC timestamp, `2026-09-23T09:14:02+00:00`.
 * Exported for tests.
 */
export function consentFields(ip: string | null | undefined, now = new Date()): Record<string, string> {
	const address = ip?.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, '');
	return {
		...(address ? { ip_signup: address } : {}),
		timestamp_signup: now.toISOString().slice(0, 19) + '+00:00'
	};
}

/** Mailchimp addresses a member by the MD5 of their lowercased email. */
export function memberHash(email: string): string {
	return createHash('md5').update(email.trim().toLowerCase()).digest('hex');
}

/**
 * Best-effort follow-up for an address already on the audience. The visitor has already
 * been told they're subscribed, so a failure here is only logged.
 *
 * - Always adds the new tags, so a returning subscriber's market choice is kept.
 * - Promotes `pending` members to `subscribed`: they signed up under the old double opt-in
 *   and never clicked the email, and submitting this form is fresh consent.
 * - Never touches `unsubscribed` or `cleaned` members. Unsubscribing is final unless they
 *   rejoin through Mailchimp's own form, and a cleaned address bounced.
 */
async function updateExistingMember(
	memberUrl: string,
	headers: Record<string, string>,
	tags: string[],
	consent: Record<string, string>
): Promise<void> {
	try {
		const tagged = await fetch(`${memberUrl}/tags`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ tags: tags.map((name) => ({ name, status: 'active' })) })
		});
		if (!tagged.ok) console.error(`Mailchimp tag update failed (${tagged.status})`);

		const current = await fetch(`${memberUrl}?fields=status`, { headers });
		const { status } = (await current.json().catch(() => ({}))) as { status?: string };
		if (status !== 'pending') return;

		const promoted = await fetch(memberUrl, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ status: 'subscribed', ...consent })
		});
		if (!promoted.ok) console.error(`Mailchimp pending→subscribed failed (${promoted.status})`);
	} catch (cause) {
		console.error('Mailchimp existing-member update threw', cause);
	}
}

/**
 * The country question comes after sign-up (so Subscribe sits directly under the email
 * field), which means a second request has to tag the member who just subscribed. The
 * token is that request's proof: an HMAC of the address and a timestamp, keyed with the
 * Mailchimp API key (server-only). It stops the follow-up step from being used to tag any
 * address someone types, and it expires, so an old page can't replay it.
 */
const TOKEN_TTL_MS = 60 * 60 * 1000;

function sign(email: string, issuedAt: number): string | null {
	const key = env.MAILCHIMP_API_KEY;
	if (!key) return null;
	return createHmac('sha256', key)
		.update(`${email.trim().toLowerCase()}|${issuedAt}`)
		.digest('base64url');
}

export function preferencesToken(email: string, now = Date.now()): string | null {
	const mac = sign(email, now);
	return mac ? `${now}.${mac}` : null;
}

export function verifyPreferencesToken(email: string, token: string, now = Date.now()): boolean {
	const [issued, mac] = token.split('.');
	const issuedAt = Number(issued);
	if (!mac || !Number.isFinite(issuedAt) || now - issuedAt > TOKEN_TTL_MS || issuedAt > now) {
		return false;
	}
	const expected = sign(email, issuedAt);
	if (!expected) return false;
	const a = Buffer.from(mac);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Adds `Market:` tags to an existing member: the after-sign-up country step. A member
 * Mailchimp doesn't know (404) is reported as success, like "Member Exists" on sign-up,
 * so the step never reveals whether an address is on the list.
 */
export async function addMarketTags(email: string, markets: string[]): Promise<SubscribeResult> {
	const settings = config();
	if (!settings) {
		return { ok: false, status: 503, error: 'Saving is briefly unavailable. Please try again shortly.' };
	}
	if (markets.length === 0) return { ok: true };

	try {
		const response = await fetch(`${settings.endpoint}/${memberHash(email)}/tags`, {
			method: 'POST',
			headers: { authorization: settings.authorization, 'content-type': 'application/json' },
			body: JSON.stringify({
				tags: markets.map((slug) => ({ name: `Market: ${slug}`, status: 'active' }))
			})
		});
		if (response.ok || response.status === 404) return { ok: true };
		console.error(`Mailchimp market tags failed (${response.status})`);
		return { ok: false, status: 502, error: GENERIC_ERROR };
	} catch (cause) {
		console.error('Mailchimp market tags threw', cause);
		return { ok: false, status: 502, error: GENERIC_ERROR };
	}
}
