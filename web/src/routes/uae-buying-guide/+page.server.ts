import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fetchMarkets } from '$lib/sanity/queries/markets';
import { subscribeToNewsletter } from '$lib/server/mailchimp';
import {
	HONEYPOT_FIELD,
	parseNewsletterSignup,
	safeClientAddress,
	signupLimiter
} from '$lib/server/newsletterSignup';

// The landing page for the UAE buying guide, a lead magnet. A request adds the visitor to
// the Mailchimp audience with a `Guide: UAE buying guide` tag, and a Customer Journey on
// that tag emails them the download link. The site never sends the PDF itself. Setup and
// the moving parts: docs/uae-guide-lead-magnet.md.
export const prerender = false;

const PATH = '/uae-buying-guide';

/** The journey's trigger is `Guide: <this>`. Renaming it silently stops every delivery. */
const GUIDE = 'UAE buying guide';

/** The page has two forms, one under the headline and one at the end. */
const PLACEMENTS = ['hero', 'closing'] as const;
type Placement = (typeof PLACEMENTS)[number];

export const load: PageServerLoad = async ({ url }) => {
	// Only for the flag on the cover mock-up. The flag is the country's Sanity field, like
	// every other flag on the site; without it the cover simply goes without.
	const markets = await fetchMarkets();
	const flagUrl = markets.find((market) => market.slug === 'uae')?.flagUrl ?? null;

	return {
		flagUrl,
		seo: {
			title: 'Free UAE Buying Guide for International Buyers | Golf Homes International',
			description:
				'How to buy a golf home in Dubai or Abu Dhabi from abroad: the eight steps, every buying cost, mortgages, tax, wills and residency. A free PDF, sent by email.',
			canonicalUrl: `${url.origin}${PATH}`,
			// A campaign destination, like /newsletter: kept out of the index and the sitemap
			// so the site's small crawl budget goes to its listings.
			noindex: true
		}
	};
};

export const actions: Actions = {
	request: async ({ request, getClientAddress }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const placement = parsePlacement(data.get('placement'));

		const parsed = parseNewsletterSignup({
			email,
			[HONEYPOT_FIELD]: data.get(HONEYPOT_FIELD),
			source: 'uae-guide',
			campaign: data.get('campaign')
		});

		if (!parsed.ok) {
			return fail(422, { email, placement, error: parsed.error, invalidEmail: true });
		}
		// A bot is told it worked, and learns nothing. Nothing was sent.
		if (parsed.bot) return { success: true, email: parsed.email, placement };

		const ip = safeClientAddress(getClientAddress);
		if (ip && !signupLimiter.allow(ip)) {
			return fail(429, {
				email,
				placement,
				error: 'Too many attempts from this connection. Please try again in a few minutes.'
			});
		}

		const result = await subscribeToNewsletter({
			email: parsed.email,
			source: parsed.source,
			markets: ['uae'],
			guide: GUIDE,
			campaign: parsed.campaign,
			ip
		});
		if (!result.ok) {
			// 422 means Mailchimp refused the address itself. Anything else is our fault, so
			// the field is not marked as the visitor's mistake.
			return fail(result.status, {
				email,
				placement,
				error: result.error,
				invalidEmail: result.status === 422
			});
		}

		return { success: true, email: parsed.email, placement };
	}
};

function parsePlacement(value: FormDataEntryValue | null): Placement {
	return PLACEMENTS.includes(value as Placement) ? (value as Placement) : 'hero';
}
