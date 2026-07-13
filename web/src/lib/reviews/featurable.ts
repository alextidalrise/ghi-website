import { MAX_REVIEWS_SHOWN } from './gates';
import type { Review, ReviewsData, ReviewsProvider } from './types';

/**
 * Featurable's free, unauthenticated widget feed. It is the bridge source: Google's own
 * Business Profile API needs a profile verified and active for 60+ days plus a manual
 * access approval, so it cannot serve a new profile. Featurable holds the Google OAuth
 * relationship and we consume its JSON, which also keeps us clear of the Maps Platform
 * terms that forbid storing Google review text.
 *
 * Note the host: featurable.com/api/v1/... 308-redirects. Call api.featurable.com directly.
 */
const ENDPOINT = 'https://api.featurable.com/v1/widgets';

/** Featurable's own cache refreshes on the order of a day, so this is purely to keep us
    off their (unpublished) rate limits under traffic. Per-instance and in-memory, which
    is all a serverless deploy can honour anyway. */
const TTL_MS = 30 * 60 * 1000;

type FeaturableReview = {
	reviewId: string;
	reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean };
	comment?: string;
	starRating?: number;
	createTime?: string;
};

type FeaturableResponse = {
	success?: boolean;
	totalReviewCount?: number;
	averageRating?: number;
	/**
	 * Deliberately unused. Featurable derives this from Google's `writeAReviewUri`, so it
	 * points at a sign-in wall that asks the visitor to *write* a review — not read one.
	 * Their README calls it a profile link; their source says otherwise. The outbound link
	 * is built from the Place ID instead (see reviewsUrl.ts). Kept in the type as a warning.
	 */
	profileUrl?: string;
	reviews?: FeaturableReview[];
	/**
	 * TRUE when the widget is not yet bound to a real Google location — the payload is
	 * then Featurable's demo content ("EXAMPLE REVIEW: I was hesitant to invest in this
	 * product at first..."), complete with a fabricated 4.8 average and 123-review count.
	 * Shipping that would be a catastrophe on a property site, so it is a hard gate.
	 */
	example?: boolean;
};

let cache: { at: number; data: ReviewsData | null } | null = null;

function mapReview(raw: FeaturableReview): Review | null {
	const text = raw.comment?.trim();
	// Google allows star-only reviews. They count toward the average but there is nothing
	// to quote, so they never become a panel.
	if (!text) return null;

	const rating = Math.round(raw.starRating ?? 0);
	if (rating < 1 || rating > 5) return null;

	const photo = raw.reviewer?.profilePhotoUrl?.trim();

	return {
		id: raw.reviewId,
		authorName: raw.reviewer?.displayName?.trim() || 'A Google user',
		authorPhotoUrl: photo || null,
		rating,
		text,
		publishedAt: raw.createTime ?? ''
	};
}

export function normalise(payload: FeaturableResponse, reviewsUrl: string | null): ReviewsData | null {
	if (!payload?.success || payload.example) return null;

	const reviews = (payload.reviews ?? [])
		.map(mapReview)
		.filter((r): r is Review => r !== null)
		.slice(0, MAX_REVIEWS_SHOWN);

	if (reviews.length === 0) return null;

	return {
		// The source's own average and count, never derived from the reviews we happen to
		// have fetched — those are a filtered subset and would understate the truth.
		averageRating: payload.averageRating ?? 0,
		totalCount: payload.totalReviewCount ?? reviews.length,
		// Built from the Place ID, never taken from the payload. See reviewsUrl.ts.
		reviewsUrl,
		reviews
	};
}

export function createFeaturableProvider(widgetId: string, reviewsUrl: string | null): ReviewsProvider {
	return {
		name: 'featurable',
		async getReviews(fetch) {
			if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

			let data: ReviewsData | null = null;
			try {
				const res = await fetch(`${ENDPOINT}/${widgetId}`, {
					headers: { accept: 'application/json' }
				});
				if (res.ok) data = normalise(await res.json(), reviewsUrl);
			} catch {
				// A reviews outage must never take a page down with it. The section is a
				// supporting band; the enquiry form on the same page is the thing that earns.
				data = null;
			}

			cache = { at: Date.now(), data };
			return data;
		}
	};
}

/** Test seam: the module-level cache would otherwise leak between cases. */
export function __resetCache() {
	cache = null;
}
