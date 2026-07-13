/**
 * The shape every reviews source is normalised into. Components only ever see this,
 * never a vendor payload — so swapping Featurable for the Google Business Profile API
 * (once the profile clears 60 days and Basic API access is approved) touches one file.
 */

export type Review = {
	/** Stable id from the source; used only as an {#each} key. */
	id: string;
	/** Display name as the reviewer set it. "A Google user" when anonymous. */
	authorName: string;
	/** Google-hosted avatar. Null when absent — a monogram stands in, never a broken img. */
	authorPhotoUrl: string | null;
	/** Whole stars, 1–5. */
	rating: number;
	/** Review body. Never empty: star-only reviews are dropped, having nothing to quote. */
	text: string;
	/** ISO 8601. Rendered as a relative date ("3 months ago"). */
	publishedAt: string;
};

export type ReviewsData = {
	/** The source's own average. Never derived by us — see the note in featurable.ts. */
	averageRating: number;
	/** Total reviews on the profile, which is larger than `reviews.length`. */
	totalCount: number;
	/**
	 * Google's login-free reviews panel for the profile — the section's one outbound link.
	 * Built from the Place ID (see reviewsUrl.ts), never from the vendor payload: Featurable
	 * populates its `profileUrl` from Google's `writeAReviewUri`, which redirects to an
	 * accounts.google.com sign-in wall. Linking "Read all reviews" at that would ask a buyer
	 * to log in and *write* one.
	 *
	 * Null when no Place ID is configured; the link then simply doesn't render.
	 */
	reviewsUrl: string | null;
	reviews: Review[];
};

/**
 * Returns null when there is nothing worth showing — no reviews, placeholder data, or a
 * failed fetch. Null is a normal outcome, not an error: the section simply doesn't render.
 */
export type ReviewsProvider = {
	name: string;
	getReviews(fetch: typeof globalThis.fetch): Promise<ReviewsData | null>;
};
