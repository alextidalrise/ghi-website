import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Stubbed newsletter signup. The footer form posts here and renders real
// idle/submitting/success/error states against it. When the HubSpot list is
// ready, replace the body of the `try` block with the HubSpot Forms API call
// (POST to https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid})
// and keep the same JSON success/error contract so the client needs no changes.

// Deliberately forgiving: catches the obvious typos without rejecting the long
// tail of valid addresses a stricter regex would.
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

	try {
		// TODO: forward `email.trim()` to HubSpot once the list ID is provisioned.
		return json({ ok: true });
	} catch {
		return json(
			{ error: 'Something went wrong on our end. Please try again shortly.' },
			{ status: 502 }
		);
	}
};
