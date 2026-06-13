import { redirect, type Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';
import { fetchNavTaxonomy, type NavTaxonomy } from '$lib/sanity/queries';

const EMPTY_NAV: NavTaxonomy = {
	countries: [],
	locations: [],
	communities: [],
	primaryCountrySlug: 'spain'
};

// Paths that must stay reachable even during a launch takeover: the holding page
// itself, plus internal tooling, the API, and the Sanity preview entry points.
const TAKEOVER_EXEMPT = ['/soon', '/internal', '/api', '/preview'];

const BYPASS_COOKIE = 'launch_bypass';

// A shared secret (LAUNCH_BYPASS_TOKEN) lets the team route around the takeover on a
// live deployment: visit any URL with `?preview=<token>` once to drop a bypass cookie,
// then browse the full site normally. The public never has the token, so they stay
// pinned to the holding page. Locally LAUNCH_MODE is unset, so the gate is off entirely
// and the site is fully open in development. Rotate the token (and redeploy) to revoke
// every outstanding bypass at once.
function hasLaunchBypass(url: URL, cookies: Cookies): boolean {
	const token = env.LAUNCH_BYPASS_TOKEN;
	if (!token) return false;

	if (url.searchParams.get('preview') === token) {
		cookies.set(BYPASS_COOKIE, token, {
			path: '/',
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});
		return true;
	}

	return cookies.get(BYPASS_COOKIE) === token;
}

export const load: LayoutServerLoad = async ({ locals: { preview }, url, route, cookies }) => {
	// The holding route renders bare (no nav/footer), so it needs no taxonomy — and
	// skipping the Sanity call keeps it standing even if the dataset is empty/unreachable.
	if (route.id === '/soon') {
		return { preview, nav: EMPTY_NAV };
	}

	// LAUNCH_MODE flips the whole site to the holding page while keeping every real
	// route buildable and reachable behind it (clear the flag to go live). The team can
	// still reach the full site via a bypass token; the public cannot.
	if (env.LAUNCH_MODE === 'true' && !hasLaunchBypass(url, cookies)) {
		const exempt = TAKEOVER_EXEMPT.some(
			(p) => url.pathname === p || url.pathname.startsWith(`${p}/`)
		);
		if (!exempt) {
			redirect(307, '/soon');
		}
	}

	const nav = await fetchNavTaxonomy();

	return { preview, nav };
};
