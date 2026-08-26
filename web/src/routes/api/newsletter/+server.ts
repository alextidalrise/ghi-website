import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscribeToNewsletter } from '$lib/server/mailchimp';

// Footer newsletter signup. Adds the address to the Mailchimp audience as a double opt-in
// (`pending`) member; Mailchimp sends the confirmation email. See $lib/server/mailchimp.
//
// A buyer-guide request is a different intent — a lead requesting a specific PDF, not a
// newsletter sub — so it posts to /api/guide (HubSpot, the CRM), not here.
//
// ANALYTICS: deliberately silent here. When we add `sign_up`, emit it from the client's
// success branch (Footer.svelte) only, never from a derived success state, and update
// docs/analytics.md's event dictionary in the same change.

// Deliberately forgiving: catches the obvious typos without rejecting the long tail of
// valid addresses a stricter regex would.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request }) => {
	let email: unknown;

	try {
		({ email } = await request.json());
	} catch {
		return json({ error: 'Could not read your request. Please try again.' }, { status: 400 });
	}

	if (typeof email !== 'string' || !EMAIL.test(email.trim())) {
		return json({ error: 'Please enter a valid email address.' }, { status: 422 });
	}

	const result = await subscribeToNewsletter(email.trim());
	if (result.ok) return json({ ok: true });
	return json({ error: result.error }, { status: result.status });
};
