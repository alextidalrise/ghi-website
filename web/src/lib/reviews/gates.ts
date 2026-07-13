import type { ReviewsData } from './types';

/**
 * Below this, the section does not render at all. A brand of this kind showing two
 * reviews reads as less credible than one showing none, so the honest move is silence.
 * Golf Homes International's Google profile is new; this is the state it ships in.
 */
export const MIN_REVIEWS_TO_RENDER = 3;

/**
 * Below this the aggregate stamp is suppressed even though the reviews themselves show.
 * "4.9 · based on 4 reviews" undersells rather than reassures; the reviews can speak for
 * themselves until there's a number worth printing.
 */
export const MIN_REVIEWS_FOR_AGGREGATE = 5;

/** Enough to fill the rail and invite a swipe. More is scroll fatigue, not more proof. */
export const MAX_REVIEWS_SHOWN = 9;

export function shouldRender(data: ReviewsData | null): data is ReviewsData {
	return data !== null && data.reviews.length >= MIN_REVIEWS_TO_RENDER;
}

export function shouldShowAggregate(data: ReviewsData): boolean {
	return data.totalCount >= MIN_REVIEWS_FOR_AGGREGATE && data.averageRating > 0;
}
