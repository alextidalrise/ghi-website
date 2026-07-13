/**
 * Where "Read all reviews" points.
 *
 * Google offers several links to a business profile and they are emphatically not
 * interchangeable:
 *
 * - `search.google.com/local/reviews?placeid=…` — the reviews panel. Login-free, opens on
 *   the reviews themselves, stays in the browser on mobile. This is the one we want.
 * - `search.google.com/local/writereview?placeid=…` — redirects to an accounts.google.com
 *   sign-in wall. Correct for a "leave us a review" CTA, fatal for a "read them" one.
 * - `google.com/maps/place/?q=place_id:…` — lands on a *map*, with reviews behind a tab.
 *   Routes EEA/UK visitors through a cookie-consent interstitial first, and on mobile it's
 *   a universal link, so it opens the Maps app. Maps place pages also carry a "People also
 *   search for" carousel — i.e. rival agents, with their ratings, one tap away.
 *
 * Vendor payloads can't be trusted to tell these apart: Featurable's `profileUrl` is
 * derived from Google's `writeAReviewUri`, despite their docs calling it a profile link.
 * So we build the URL ourselves from the Place ID and ignore theirs.
 *
 * The Place ID is safe to keep: it is the one piece of Places data Google's terms permit
 * storing indefinitely.
 *
 * Caveat worth knowing: `/local/reviews` is long-standing but undocumented. The documented
 * alternative is the Maps link — which is the worse destination on every axis above. We're
 * choosing an undocumented-but-right URL over a documented-but-wrong one, deliberately.
 */
const REVIEWS_PANEL = 'https://search.google.com/local/reviews';

/** Google Place IDs are opaque; guard only against junk that would build a broken link. */
function isPlausiblePlaceId(id: string): boolean {
	return /^[A-Za-z0-9_-]{10,}$/.test(id);
}

export function buildReviewsUrl(placeId: string | undefined): string | null {
	const id = placeId?.trim();
	if (!id || !isPlausiblePlaceId(id)) return null;
	return `${REVIEWS_PANEL}?placeid=${encodeURIComponent(id)}`;
}
