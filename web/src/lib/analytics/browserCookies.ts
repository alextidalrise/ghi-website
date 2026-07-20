/**
 * Removal of Google's first-party cookies when consent is withdrawn.
 *
 * The name matcher is pure and tested; the writer is a thin DOM wrapper.
 */

/**
 * Cookies Google sets once analytics or advertising consent is granted.
 *
 * `_ga` is the client id, `_ga_*` the per-stream session state, `_gcl_*` the advertising
 * click identifiers. `_gid` is not set by GA4 itself but appears in some GTM
 * configurations, so it is included rather than left behind.
 */
const GOOGLE_COOKIE = /^(_ga$|_ga_|_gid$|_gat|_gcl_)/;

/** Which cookies in a `document.cookie` string belong to Google. */
export function analyticsCookieNames(cookieString: string): string[] {
	const names: string[] = [];

	for (const part of cookieString.split(';')) {
		const eq = part.indexOf('=');
		const name = (eq === -1 ? part : part.slice(0, eq)).trim();
		if (name && GOOGLE_COOKIE.test(name)) names.push(name);
	}

	return names;
}

/**
 * Every domain scope a cookie might have been set on.
 *
 * A cookie can only be deleted from the scope that set it, and JavaScript cannot read a
 * cookie's domain back. GA sets `_ga` on the registrable domain, so deleting it while on
 * `www.golfhomesinternational.com` requires targeting `.golfhomesinternational.com` too.
 * Clearing every plausible scope is safe — a delete against a scope holding no cookie is
 * a no-op.
 */
export function cookieDomainScopes(hostname: string): (string | undefined)[] {
	const labels = hostname.split('.');
	const scopes: (string | undefined)[] = [undefined, hostname];

	// Walk up to, but not including, the bare TLD.
	for (let i = 1; i < labels.length - 1; i += 1) {
		scopes.push(`.${labels.slice(i).join('.')}`);
	}

	return scopes;
}

/** Expire every Google cookie this document can reach. */
export function clearAnalyticsCookies(): void {
	if (typeof document === 'undefined') return;

	const names = analyticsCookieNames(document.cookie);
	const scopes = cookieDomainScopes(location.hostname);

	for (const name of names) {
		for (const scope of scopes) {
			const domain = scope ? `; domain=${scope}` : '';
			document.cookie = `${name}=; path=/; max-age=0${domain}`;
		}
	}
}
