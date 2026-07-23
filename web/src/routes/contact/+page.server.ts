import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '$lib/listing/breadcrumbs';
import { loadReviews } from '$lib/reviews';
import { fetchHomepagePartnerLogos, fetchPartnerIntroduction } from '$lib/sanity/queries/partners';
import { fetchContactPage } from '$lib/sanity/queries';
import { PARTNER_INTRO_PARAM } from '$lib/partners/partners';
import { resolveContactContent } from '$lib/sanity/transforms/pageContent';

const BASE_PATH = '/contact';

// The page carries a form action, so it renders server-side rather than prerendering.
export const prerender = false;

// Pragmatic check: a single @ with text either side and a dotted domain. The server is
// the source of truth; the client revalidates only to skip an obvious-typo round-trip.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const load: PageServerLoad = async ({ url, fetch }) => {
	const canonicalUrl = `${url.origin}${BASE_PATH}`;

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'Contact', href: BASE_PATH }
	];

	// The advisor network, rendered as the real partner logo wall (shared with the
	// homepage). Empty in datasets without logos; the component falls back to labelled
	// cells, so the section never renders broken images or an empty grid.
	//
	// `?partner=<slug>` is an introduction request, written by partnerIntroHref from the
	// partner cards and the listing enquiry shelf. Resolving it here is what makes the CTA
	// keep its promise: the form names the specialist instead of opening blank. An unknown
	// or stale slug resolves to null and the page falls back to the generic form.
	const [partnerLogos, reviews, partnerIntro, rawPage] = await Promise.all([
		fetchHomepagePartnerLogos(),
		loadReviews(fetch),
		fetchPartnerIntroduction(url.searchParams.get(PARTNER_INTRO_PARAM)),
		fetchContactPage()
	]);

	const content = resolveContactContent(rawPage);

	const title = content.seo?.seoTitle?.trim() || 'Contact | Golf Homes International';
	const description =
		content.seo?.metaDescription?.trim() ||
		'Speak to the Golf Homes International team about golf property in Spain and Portugal. Message us on WhatsApp, call, or send an enquiry and we will reply within a working day.';
	const seo = {
		title,
		description,
		ogTitle: content.seo?.openGraphTitle?.trim() || title,
		ogDescription: content.seo?.openGraphDescription?.trim() || description,
		canonicalUrl,
		noindex: content.seo?.noindex ?? false
	};

	return {
		breadcrumbs,
		seo,
		content,
		partnerLogos,
		partnerIntro,
		reviews,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};

export const actions: Actions = {
	// Enquiry capture. Posts straight to HubSpot's form submission endpoint server-side
	// (no tracking script on the page), mirroring the /soon notify action. The endpoint
	// is public — it needs only the portal ID + the form's GUID, both supplied via env:
	//   HUBSPOT_PORTAL_ID, HUBSPOT_ENQUIRY_FORM_GUID
	// The HubSpot form behind that GUID must expose: firstname, email, phone, message.
	enquire: async ({ request, url, getClientAddress }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const phone = String(data.get('phone') ?? '').trim();
		const message = String(data.get('message') ?? '').trim();
		const partnerSlug = String(data.get(PARTNER_INTRO_PARAM) ?? '').trim();

		// Echo the submitted values back so the form repopulates on any failure. The partner
		// is not echoed: it lives in the URL, which survives a failed post.
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
				'Enquiry form not configured: set HUBSPOT_PORTAL_ID and HUBSPOT_ENQUIRY_FORM_GUID'
			);
			return fail(503, {
				values,
				error: 'The enquiry form is briefly unavailable. Please message us on WhatsApp or call, and we will pick it up right away.'
			});
		}

		const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;

		// An introduction request is re-resolved from the slug rather than trusted from a
		// hidden field, so the name that reaches the team is the one Sanity holds. The HubSpot
		// form exposes only firstname/email/phone/message, so it rides in the message body: no
		// new HubSpot field to provision, and the enquiry arrives with its context intact.
		const partner = await fetchPartnerIntroduction(partnerSlug);
		const submittedMessage = partner
			? `Introduction requested: ${partner.name}${partner.category ? ` (${partner.category})` : ''}\n\n${message}`
			: message;

		const fields = [
			{ objectTypeId: '0-1', name: 'firstname', value: name },
			{ objectTypeId: '0-1', name: 'email', value: email },
			{ objectTypeId: '0-1', name: 'message', value: submittedMessage }
		];
		if (phone) fields.push({ objectTypeId: '0-1', name: 'phone', value: phone });

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					fields,
					context: {
						pageUri: url.href,
						pageName: 'Golf Homes International — Contact enquiry',
						ipAddress: getClientAddress()
					}
				})
			});

			if (!response.ok) {
				const detail = await response.text();
				console.error(`HubSpot enquiry submit failed (${response.status}): ${detail}`);
				return fail(502, {
					values,
					error: 'Something went wrong on our end. Please try again, or reach us on WhatsApp.'
				});
			}
		} catch (cause) {
			console.error('HubSpot enquiry submit threw', cause);
			return fail(502, {
				values,
				error: 'Something went wrong on our end. Please try again, or reach us on WhatsApp.'
			});
		}

		return { success: true };
	}
};
