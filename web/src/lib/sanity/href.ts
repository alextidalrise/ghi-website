import { PRODUCTION_HOSTS } from '$lib/analytics/config';

/**
 * Campaign parameters on links to our own site.
 *
 * An internal link carrying `utm_*` is worse than useless here. Our own page-view data
 * never sees it — `safePageLocation` in `$lib/analytics/pageView` rebuilds
 * `page_location` from a strict allowlist and `utm_*` is not on it — while GA4 reads
 * campaign parameters off whatever `page_location` reaches it and treats them as the
 * start of a new acquisition. A visitor who arrived from organic search and then clicked
 * an internal CTA gets re-attributed to that CTA, and the real source is lost.
 *
 * The same argument applies to ad click identifiers: `gclid` and its siblings are
 * acquisition signals, and an internal link is not an acquisition. They also arrive by
 * accident more often than UTMs do, because an editor who copies a URL out of their own
 * browser after clicking an ad copies the click id with it.
 *
 * This is a render-time guard rather than a validation rule because the hrefs are
 * authored in Sanity: anyone can paste a tagged URL into a link field, and the studio has
 * no idea whether the destination is ours. Stripping where we render means it cannot
 * reach a visitor's address bar however it got into the dataset.
 */
const CAMPAIGN_PARAM =
	/^(utm_[a-z_]+|gclid|dclid|fbclid|msclkid|twclid|ttclid|gbraid|wbraid|gad_source|gad_campaignid|gclsrc|mc_cid|mc_eid|_gl)$/i;

/** Everything up to the first `:` — present only on an absolute href. */
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
/** The authority of an absolute or protocol-relative href. */
const AUTHORITY = /^(?:[a-z][a-z0-9+.-]*:)?\/\/([^/?#]*)/i;

/**
 * Does this href point at us?
 *
 * Site-relative hrefs (`/contact`, `?page=2`, `#section`) always do. Absolute ones only
 * when the host is one of ours — reusing the analytics host list rather than keeping a
 * second copy, since "our own hosts" is exactly the question both are asking.
 *
 * `mailto:` and `tel:` are neither internal nor http, so they are left entirely alone.
 */
export function isInternalHref(href: string): boolean {
	const trimmed = href.trim();
	const scheme = SCHEME.exec(trimmed)?.[1]?.toLowerCase();

	if (scheme && scheme !== 'http' && scheme !== 'https') return false;
	if (!scheme && !trimmed.startsWith('//')) return true;

	const authority = AUTHORITY.exec(trimmed)?.[1] ?? '';
	// Drop any userinfo before the host, and the port after it.
	const hostname = authority.split('@').pop()?.split(':')[0]?.toLowerCase() ?? '';
	return PRODUCTION_HOSTS.includes(hostname);
}

/**
 * Remove campaign parameters from an href that points at us, leaving everything else —
 * path, remaining query, fragment — byte-identical.
 *
 * External hrefs are returned untouched even when they are tagged to the eyebrows: a
 * partner's `utm_source=ghi` is *their* attribution and stripping it would break a
 * relationship we do not own. Only our own URLs are ours to clean.
 *
 * Returns the input unchanged unless something was actually removed, so an href that was
 * already clean can never be reshaped by `URLSearchParams` re-encoding.
 */
export function withoutCampaignParams(href: string): string {
	if (!isInternalHref(href)) return href;

	// Split the fragment off first: a `?` after a `#` belongs to the fragment, not the query.
	const hashAt = href.indexOf('#');
	const head = hashAt === -1 ? href : href.slice(0, hashAt);
	const hash = hashAt === -1 ? '' : href.slice(hashAt);

	const queryAt = head.indexOf('?');
	if (queryAt === -1) return href;

	const params = new URLSearchParams(head.slice(queryAt + 1));
	let removed = false;
	for (const key of [...params.keys()]) {
		if (CAMPAIGN_PARAM.test(key)) {
			params.delete(key);
			removed = true;
		}
	}
	if (!removed) return href;

	const query = params.toString();
	return `${head.slice(0, queryAt)}${query ? `?${query}` : ''}${hash}`;
}
