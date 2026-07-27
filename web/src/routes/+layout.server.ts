import { redirect, type Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';
import { fetchHeaderNav, fetchFooter } from '$lib/sanity/queries';

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
	// Trim both sides: env UIs (and shells) often leave stray quotes/whitespace/newlines
	// on the value, which would silently break an otherwise-correct token.
	const token = env.LAUNCH_BYPASS_TOKEN?.trim();
	const provided = url.searchParams.get('preview')?.trim();
	const cookieValue = cookies.get(BYPASS_COOKIE)?.trim();

	if (!token) return false;

	if (provided === token) {
		cookies.set(BYPASS_COOKIE, token, {
			path: '/',
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});
		return true;
	}

	return cookieValue === token;
}

export const load: LayoutServerLoad = async ({
	locals: { preview, analytics },
	url,
	route,
	cookies
}) => {
	/* Deliberately does NOT read the consent cookie. Doing so put the visitor's decision
	   into the SSR data payload, which made the HTML different for every visitor and so
	   impossible to cache at the edge — and TTFB is what caps this site's PageSpeed
	   scores. The store now reads the cookie in the browser instead (see
	   ConsentStore.hydrate), and the banner stays hidden until it has, so a returning
	   visitor still never sees it flash.
	   `mode` is safe to keep: it is a property of the host and route, not the visitor —
	   with the one exception of a debug session, whose response analyticsHandle marks
	   no-store. */
	const analyticsState = { mode: analytics?.mode ?? 'off' };

	// The holding route renders bare (no nav/footer), so it needs no taxonomy — and
	// skipping the Sanity call keeps it standing even if the dataset is empty/unreachable.
	if (route.id === '/soon') {
		return { preview, footer: null, headerNav: null, analytics: analyticsState };
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

	const [footer, headerNav] = await Promise.all([fetchFooter(), fetchHeaderNav()]);

	return { preview, footer, headerNav, analytics: analyticsState };
};
