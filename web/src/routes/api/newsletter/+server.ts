import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscribeToNewsletter, type SignupSource } from '$lib/server/mailchimp';
import { parseNewsletterSignup, safeClientAddress, signupLimiter } from '$lib/server/newsletterSignup';

// Newsletter signup, shared by the footer form and the /newsletter page. Adds the address to
// the Mailchimp audience as `subscribed` (single opt-in); see $lib/server/mailchimp for how
// consent is recorded without a confirmation email.
//
// A buyer-guide request is a different intent — a lead requesting a specific PDF, not a
// newsletter sub — so it posts to /api/guide (HubSpot, the CRM), not here.
//
// ANALYTICS: deliberately silent here. `trackSignUp` fires from each form's client success
// branch, never from a derived success state; see docs/analytics.md.

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Could not read your request. Please try again.' }, { status: 400 });
	}

	const parsed = parseNewsletterSignup(body);
	if (!parsed.ok) return json({ error: parsed.error }, { status: 422 });

	// A filled honeypot is a bot. Answer exactly as a success would, so it learns nothing.
	if (parsed.bot) return json({ ok: true });

	const ip = safeClientAddress(getClientAddress);
	if (ip && !signupLimiter.allow(ip)) {
		return json(
			{ error: 'Too many attempts from this connection. Please try again in a few minutes.' },
			{ status: 429 }
		);
	}

	const result = await subscribeToNewsletter({
		email: parsed.email,
		source: parsed.source satisfies SignupSource,
		markets: parsed.markets,
		campaign: parsed.campaign,
		ip
	});
	if (result.ok) return json({ ok: true });
	return json({ error: result.error }, { status: result.status });
};
