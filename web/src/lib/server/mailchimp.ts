import { env } from '$env/dynamic/private';

/**
 * Newsletter subscription via the Mailchimp Marketing API. Server-only (the file lives under
 * `$lib/server`, which SvelteKit refuses to import into client code) because the API key is a
 * secret and must never reach the browser.
 *
 * Returns a discriminated result rather than throwing, mirroring the HubSpot handlers'
 * contract, so the endpoint maps cleanly onto the idle/submitting/success/error states the
 * footer form already renders.
 *
 * Double opt-in: members are added as `pending`, so Mailchimp emails a confirmation link
 * before anyone is actually subscribed. That confirmation is the audience's consent record —
 * the EU (Spain/Portugal) buyers this list targets — so it is a deliberate choice, not a
 * default to flip to `subscribed` without a GDPR conversation.
 *
 * Config, all via env (none committed — see web/.env.example):
 *   MAILCHIMP_API_KEY       — the secret key. Its trailing `-usXX` is the datacenter.
 *   MAILCHIMP_AUDIENCE_ID   — the target audience (list) id.
 *   MAILCHIMP_SERVER_PREFIX — optional; overrides the datacenter derived from the key.
 */

export type SubscribeResult = { ok: true } | { ok: false; status: number; error: string };

const GENERIC_ERROR = 'Something went wrong on our end. Please try again shortly.';

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
	const apiKey = env.MAILCHIMP_API_KEY;
	const audienceId = env.MAILCHIMP_AUDIENCE_ID;
	// The datacenter is the segment after the last `-` in the key (e.g. `us21`). Allow an
	// explicit override in case the key format ever changes.
	const serverPrefix = env.MAILCHIMP_SERVER_PREFIX || apiKey?.split('-').pop();

	if (!apiKey || !audienceId || !serverPrefix) {
		// Misconfiguration: never show a success state we cannot back up.
		console.error('Newsletter not configured: set MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID');
		return {
			ok: false,
			status: 503,
			error: 'Sign-up is briefly unavailable. Please try again shortly.'
		};
	}

	const endpoint = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				// Basic auth: any username, the key as the password. btoa is fine here — this
				// runs only on the server, never against a browser's non-Latin1 constraints.
				authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({ email_address: email, status: 'pending' })
		});

		if (response.ok) return { ok: true };

		// Mailchimp answers 400 "Member Exists" when the address is already on the audience —
		// whether subscribed, still pending, or previously unsubscribed. Report success in every
		// case: the visitor did the one thing the form lets them do, and reflecting their actual
		// subscription state back would leak it to anyone who can type an address into the box.
		const detail: { title?: string } = await response.json().catch(() => ({}));
		if (response.status === 400 && detail?.title === 'Member Exists') {
			return { ok: true };
		}

		console.error(`Mailchimp subscribe failed (${response.status}):`, detail);
		return { ok: false, status: 502, error: GENERIC_ERROR };
	} catch (cause) {
		console.error('Mailchimp subscribe threw', cause);
		return { ok: false, status: 502, error: GENERIC_ERROR };
	}
}
