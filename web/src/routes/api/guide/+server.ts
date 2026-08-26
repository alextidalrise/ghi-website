import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Buyer-guide request from the homepage cards. This is a lead, not a newsletter sub: the
// visitor asked us to send a specific PDF and enters the sales pipeline, so it goes to
// HubSpot (the CRM), mirroring the /contact and listing-enquiry handlers — not to Mailchimp.
// A HubSpot workflow keyed off the `buyer_guide` field emails the matching guide. The plain
// footer newsletter posts to /api/newsletter (Mailchimp) instead.
//
// Config (both via env — see web/.env.example):
//   HUBSPOT_PORTAL_ID, HUBSPOT_GUIDE_FORM_GUID
// The HubSpot form behind that GUID must expose `email` and `buyer_guide`.
//
// ANALYTICS: deliberately silent here. When wired, add `buyer_guide_request` to LeadType and
// emit `generate_lead` from BuyerGuideCard.svelte's success branch only — never a derived
// state — updating docs/analytics.md's event dictionary in the same change.

// Deliberately forgiving: catches the obvious typos without rejecting the long tail of
// valid addresses a stricter regex would.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Which guide the email is requesting. Anything else is rejected as untrusted input.
const GUIDES = ['spain', 'portugal'] as const;
type Guide = (typeof GUIDES)[number];

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
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
	if (!GUIDES.includes(guide as Guide)) {
		return json({ error: 'Please choose a guide.' }, { status: 422 });
	}
	const requestedGuide = guide as Guide;

	const portalId = env.HUBSPOT_PORTAL_ID;
	const formGuid = env.HUBSPOT_GUIDE_FORM_GUID;

	if (!portalId || !formGuid) {
		// Misconfiguration: never show a success state we cannot back up.
		console.error(
			'Guide request not configured: set HUBSPOT_PORTAL_ID and HUBSPOT_GUIDE_FORM_GUID'
		);
		return json(
			{ error: 'The guide is briefly unavailable. Please try again shortly.' },
			{ status: 503 }
		);
	}

	const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				fields: [
					{ objectTypeId: '0-1', name: 'email', value: email.trim() },
					{ objectTypeId: '0-1', name: 'buyer_guide', value: requestedGuide }
				],
				context: {
					pageUri: url.href,
					pageName: `Golf Homes International — ${requestedGuide} buyer guide request`,
					ipAddress: getClientAddress()
				}
			})
		});

		if (!response.ok) {
			const detail = await response.text();
			console.error(`HubSpot guide submit failed (${response.status}): ${detail}`);
			return json(
				{ error: 'Something went wrong on our end. Please try again shortly.' },
				{ status: 502 }
			);
		}
	} catch (cause) {
		console.error('HubSpot guide submit threw', cause);
		return json(
			{ error: 'Something went wrong on our end. Please try again shortly.' },
			{ status: 502 }
		);
	}

	return json({ ok: true });
};
