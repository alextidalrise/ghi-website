import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Stubbed newsletter + buyer-guide signup. The footer newsletter form and the
// homepage buyer-guide cards both post here and render real
// idle/submitting/success/error states against it. When the HubSpot list is
// ready, replace the body of the `try` block with the HubSpot Forms API call
// (POST to https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid})
// and keep the same JSON success/error contract so the clients need no changes.
//
// ANALYTICS: deliberately silent. Because this endpoint returns `{ok:true}` without
// contacting HubSpot, neither the footer newsletter nor the buyer-guide cards emit any
// event — reporting a conversion for a subscription that was never delivered would be
// worse than reporting nothing. `buyer_guide_request` is likewise absent from `LeadType`
// in $lib/analytics/types.ts for the same reason.
//
// When this is wired up for real, add — in the same change:
//   • `sign_up` (NOT generate_lead) from Footer.svelte on a confirmed newsletter success
//   • `buyer_guide_request` to LeadType, and generate_lead from BuyerGuideCard.svelte
// Emit from the client's success branch only, never from a derived success state, and
// update docs/analytics.md's event dictionary to match.

// Deliberately forgiving: catches the obvious typos without rejecting the long
// tail of valid addresses a stricter regex would.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Which buyer guide an email is requesting, when posted from the homepage cards.
// Absent for a plain newsletter signup. Anything else is ignored as untrusted.
const GUIDES = ['spain', 'portugal'] as const;
type Guide = (typeof GUIDES)[number];

export const POST: RequestHandler = async ({ request }) => {
	let email: unknown;
	let guide: unknown;

	try {
		({ email, guide } = await request.json());
	} catch {
		return json({ error: 'Could not read your request. Please try again.' }, { status: 400 });
	}

	if (typeof email !== 'string' || !EMAIL.test(email.trim())) {
		return json({ error: 'Please enter a valid email address.' }, { status: 422 });
	}

	const requestedGuide: Guide | undefined = GUIDES.includes(guide as Guide)
		? (guide as Guide)
		: undefined;

	try {
		// TODO: forward `email.trim()` to HubSpot once the list ID is provisioned.
		// When `requestedGuide` is set, trigger the matching guide-delivery workflow
		// (HubSpot emails the PDF) instead of a plain list subscription.
		void requestedGuide;
		return json({ ok: true });
	} catch {
		return json(
			{ error: 'Something went wrong on our end. Please try again shortly.' },
			{ status: 502 }
		);
	}
};
