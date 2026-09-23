import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fetchMarkets } from '$lib/sanity/queries/markets';
import {
	addMarketTags,
	preferencesToken,
	subscribeToNewsletter,
	verifyPreferencesToken
} from '$lib/server/mailchimp';
import {
	HONEYPOT_FIELD,
	parseMarkets,
	parseNewsletterSignup,
	safeClientAddress,
	signupLimiter
} from '$lib/server/newsletterSignup';

// The sign-up page linked from Instagram. It carries a form action, so it renders
// server-side rather than prerendering.
export const prerender = false;

const PATH = '/newsletter';

export const load: PageServerLoad = async ({ url }) => {
	// Countries render as the optional market choices. A new country publishes through the
	// `nav` purge tag every page already carries (the header lists countries too), so this
	// list never goes stale on its own.
	const markets = await fetchMarkets();

	const title = 'Newsletter | Golf Homes International';
	const description =
		'New golf homes as they come to market, and a regular letter on the places we cover. Sign up by email; unsubscribe any time.';

	return {
		markets: markets.map(({ name, slug }) => ({ name, slug })),
		seo: {
			title,
			description,
			canonicalUrl: `${url.origin}${PATH}`,
			// A campaign destination with no search job. It stays out of the sitemap as well,
			// so the little crawl budget the site has goes to its listings and guides.
			noindex: true
		}
	};
};

// Two steps. `subscribe` takes only the email, so Subscribe sits right under the field and
// clears the first screen on small phones. `markets` then asks which countries interest the
// new subscriber and tags them; it is optional and gated by the signed token `subscribe`
// returns, so it can only tag the address that just signed up.
export const actions: Actions = {
	subscribe: async ({ request, getClientAddress }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');

		const parsed = parseNewsletterSignup({
			email,
			[HONEYPOT_FIELD]: data.get(HONEYPOT_FIELD),
			source: 'newsletter-page',
			campaign: data.get('campaign')
		});

		if (!parsed.ok) return fail(422, { email, error: parsed.error, invalidEmail: true });
		// A bot gets the same answer as a person, token included, so it learns nothing. Its
		// token tags nobody: the address was never added.
		if (parsed.bot) return subscribed(parsed.email);

		const ip = safeClientAddress(getClientAddress);
		if (ip && !signupLimiter.allow(ip)) {
			return fail(429, {
				email,
				error: 'Too many attempts from this connection. Please try again in a few minutes.'
			});
		}

		const result = await subscribeToNewsletter({
			email: parsed.email,
			source: parsed.source,
			campaign: parsed.campaign,
			ip
		});
		if (!result.ok) {
			// 422 means Mailchimp refused the address itself; anything else is ours, so the
			// field must not be marked as the visitor's mistake.
			return fail(result.status, { email, error: result.error, invalidEmail: result.status === 422 });
		}

		return subscribed(parsed.email);
	},

	markets: async ({ request }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const token = String(data.get('token') ?? '');
		const markets = parseMarkets(data.getAll('markets'));
		// Echoed on failure so the step re-renders with its choices intact.
		const retry = { step: 'markets' as const, email, token, markets };

		if (!verifyPreferencesToken(email, token)) {
			return fail(403, {
				...retry,
				error: 'This page has expired. You are still subscribed; reload to choose countries.'
			});
		}

		const result = await addMarketTags(email, markets);
		if (!result.ok) return fail(result.status, { ...retry, error: result.error });

		return { saved: true, markets };
	}
};

function subscribed(email: string) {
	return { success: true, email, token: preferencesToken(email) ?? '' };
}
