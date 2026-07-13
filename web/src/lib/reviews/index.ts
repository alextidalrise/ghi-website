import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { createFeaturableProvider } from './featurable';
import { createFixtureProvider } from './fixtures';
import { shouldRender } from './gates';
import { buildReviewsUrl } from './reviewsUrl';
import type { ReviewsData, ReviewsProvider } from './types';

export { MAX_REVIEWS_SHOWN, MIN_REVIEWS_FOR_AGGREGATE, MIN_REVIEWS_TO_RENDER } from './gates';
export type { Review, ReviewsData } from './types';

/**
 * Source selection, in order:
 *
 * 1. `FEATURABLE_WIDGET_ID` set        → the live Google feed (production).
 * 2. `REVIEWS_FIXTURES=true`           → fixtures, for previewing the design on a deploy.
 * 3. dev with neither set              → fixtures, so the section is visible locally.
 * 4. otherwise                         → no provider; the section does not render.
 *
 * Case 4 is the state production ships in until the Google profile is verified, bound to
 * the Featurable widget, and has collected its first reviews. That is by design: the
 * section lights itself up when it has something true to say, and stays silent until then.
 */
function selectProvider(): ReviewsProvider | null {
	// The outbound link is built here, from the Place ID — never taken from the vendor
	// payload, which points at a write-a-review sign-in wall. Unset means the section still
	// renders, just without a "Read all reviews" link.
	const reviewsUrl = buildReviewsUrl(env.GOOGLE_PLACE_ID);

	const widgetId = env.FEATURABLE_WIDGET_ID?.trim();
	if (widgetId) return createFeaturableProvider(widgetId, reviewsUrl);
	if (env.REVIEWS_FIXTURES === 'true' || dev) return createFixtureProvider(reviewsUrl);
	return null;
}

/**
 * Returns null whenever there is nothing worth showing — no provider, no reviews, a
 * placeholder payload, a failed fetch, or simply too few reviews to be credible.
 *
 * The too-few-reviews floor is enforced *here*, not in the components: it is the one place
 * every surface passes through, so no future caller can accidentally put a lone review on
 * a page. Components need only ask "is this null?".
 */
export async function loadReviews(fetch: typeof globalThis.fetch): Promise<ReviewsData | null> {
	const provider = selectProvider();
	if (!provider) return null;

	const data = await provider.getReviews(fetch);
	return shouldRender(data) ? data : null;
}
