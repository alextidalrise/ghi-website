import { fail, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Pragmatic check: a single @ with text either side and a dotted domain. The server is
// the source of truth; the client revalidates only to skip an obvious-typo round-trip.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shape of the action result, surfaced to the EnquiryRail via the page `form` prop. */
export type EnquiryFormResult = {
	success?: boolean;
	floorplanRequested?: boolean;
	values?: { name: string; email: string; phone: string; message: string };
	fieldErrors?: Record<string, string>;
	error?: string;
};

/**
 * Shared enquiry handler for every listing detail route (property, development, unit),
 * driving the EnquiryRail. Posts straight to HubSpot's form submission endpoint
 * server-side (no tracking script on the page), mirroring the /contact enquire action
 * and reusing the same form GUID:
 *   HUBSPOT_PORTAL_ID, HUBSPOT_ENQUIRY_FORM_GUID
 * The HubSpot form behind that GUID must expose: firstname, email, phone, message, and —
 * for the floorplan request path — floorplan_requested. The listing reference is folded
 * into the message text rather than a dedicated property, so it surfaces with the enquiry
 * on the contact timeline and in the notification email. The floorplan-delivery email is a
 * HubSpot workflow keyed off floorplan_requested, with the ref read from the message.
 */
export async function handleListingEnquiry(
	event: RequestEvent
): Promise<EnquiryFormResult | ReturnType<typeof fail>> {
	const { request, url, getClientAddress } = event;
	const data = await request.formData();
	const name = String(data.get('name') ?? '').trim();
	const email = String(data.get('email') ?? '').trim();
	const phone = String(data.get('phone') ?? '').trim();
	const message = String(data.get('message') ?? '').trim();
	const listingRef = String(data.get('listing_reference') ?? '').trim();
	const floorplanRequested = String(data.get('floorplan_requested') ?? '') === 'true';

	// Echo the submitted values back so the form repopulates on any failure.
	const values = { name, email, phone, message };

	const fieldErrors: Record<string, string> = {};
	if (!name) fieldErrors.name = 'Please tell us your name.';
	if (!EMAIL_RE.test(email)) fieldErrors.email = 'Please enter a valid email address.';
	if (!message) fieldErrors.message = 'Please add a short message so we know how to help.';

	if (Object.keys(fieldErrors).length > 0) {
		return fail(400, { values, fieldErrors });
	}

	const portalId = env.HUBSPOT_PORTAL_ID;
	const formGuid = env.HUBSPOT_ENQUIRY_FORM_GUID;

	if (!portalId || !formGuid) {
		// Misconfiguration: never show a success state we cannot back up.
		console.error(
			'Listing enquiry not configured: set HUBSPOT_PORTAL_ID and HUBSPOT_ENQUIRY_FORM_GUID'
		);
		return fail(503, {
			values,
			error: 'The enquiry form is briefly unavailable. Please message us on WhatsApp or call, and we will pick it up right away.'
		});
	}

	const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;

	// Fold the listing reference into the message (no dedicated HubSpot property), so it
	// reads next to the enquiry on the timeline and in the notification email.
	const messageBody = listingRef ? `${message}\n\n— Listing reference: ${listingRef}` : message;

	const fields = [
		{ objectTypeId: '0-1', name: 'firstname', value: name },
		{ objectTypeId: '0-1', name: 'email', value: email },
		{ objectTypeId: '0-1', name: 'message', value: messageBody }
	];
	if (phone) fields.push({ objectTypeId: '0-1', name: 'phone', value: phone });
	// Only sent on the floorplan path, so general enquiries don't require the property to
	// carry the field. The HubSpot form must define floorplan_requested for this to land.
	if (floorplanRequested) {
		fields.push({ objectTypeId: '0-1', name: 'floorplan_requested', value: 'true' });
	}

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				fields,
				context: {
					pageUri: url.href,
					pageName: floorplanRequested
						? 'Golf Homes International — Floorplan request'
						: 'Golf Homes International — Listing enquiry',
					ipAddress: getClientAddress()
				}
			})
		});

		if (!response.ok) {
			const detail = await response.text();
			console.error(`HubSpot listing enquiry submit failed (${response.status}): ${detail}`);
			return fail(502, {
				values,
				error: 'Something went wrong on our end. Please try again, or reach us on WhatsApp.'
			});
		}
	} catch (cause) {
		console.error('HubSpot listing enquiry submit threw', cause);
		return fail(502, {
			values,
			error: 'Something went wrong on our end. Please try again, or reach us on WhatsApp.'
		});
	}

	return { success: true, floorplanRequested };
}
