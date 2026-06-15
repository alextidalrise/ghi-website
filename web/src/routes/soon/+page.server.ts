import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';
import { fetchSiteSettingsHero } from '$lib/sanity/queries/settings';
import { resolveHomepageHeroImage } from '$lib/sanity/transforms/taxonomyHero';

// The holding page carries a form action, so it must render server-side, not prerender.
export const prerender = false;

// Hero comes from siteSettings.homepageHero (auto AVIF/WebP + srcset), the same image
// the homepage uses. Resolves to null if unset/unreachable; the page falls back to the
// optimized static asset so the gate always renders.
export const load: PageServerLoad = async () => {
	const hero = resolveHomepageHeroImage(await fetchSiteSettingsHero());
	return { hero };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	// Notify-me capture. Posts the email straight to HubSpot's form submission endpoint
	// (server-side, no tracking script on the page). The endpoint is public — it needs
	// only the portal ID + the form's GUID, both supplied via env:
	//   HUBSPOT_PORTAL_ID, HUBSPOT_NOTIFY_FORM_GUID
	notify: async ({ request, url, getClientAddress }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();

		if (!EMAIL_RE.test(email)) {
			return fail(400, { email, error: 'Please enter a valid email address.' });
		}

		const portalId = env.HUBSPOT_PORTAL_ID;
		const formGuid = env.HUBSPOT_NOTIFY_FORM_GUID;

		if (!portalId || !formGuid) {
			// Misconfiguration: never show a success state we can't back up.
			console.error('Notify form not configured: set HUBSPOT_PORTAL_ID and HUBSPOT_NOTIFY_FORM_GUID');
			return fail(503, {
				email,
				error: 'Sign-up is briefly unavailable. Please try again shortly.'
			});
		}

		const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					fields: [{ objectTypeId: '0-1', name: 'email', value: email }],
					context: {
						pageUri: url.href,
						pageName: 'Golf Homes International — Launching soon',
						ipAddress: getClientAddress()
					}
				})
			});

			if (!response.ok) {
				const detail = await response.text();
				console.error(`HubSpot notify submit failed (${response.status}): ${detail}`);
				return fail(502, {
					email,
					error: 'Something went wrong on our end. Please try again.'
				});
			}
		} catch (cause) {
			console.error('HubSpot notify submit threw', cause);
			return fail(502, {
				email,
				error: 'Something went wrong on our end. Please try again.'
			});
		}

		return { success: true };
	}
};
