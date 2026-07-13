import { describe, expect, it } from 'vitest';
import { normalise } from './featurable';
import { shouldRender, shouldShowAggregate } from './gates';
import { buildReviewsUrl } from './reviewsUrl';

const PLACE_ID = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
const URL = buildReviewsUrl(PLACE_ID);

/** A faithful trim of the live payload from an unbound widget. The reviews are
    Featurable's demo content and the 4.8/123 aggregate is fabricated. */
const EXAMPLE_PAYLOAD = {
	success: true,
	totalReviewCount: 123,
	averageRating: 4.8,
	profileUrl: 'https://google.com',
	example: true,
	reviews: [
		{
			reviewId: '1',
			reviewer: { displayName: 'Isabella Li', profilePhotoUrl: '', isAnonymous: false },
			comment:
				"EXAMPLE REVIEW: I was hesitant to invest in this product at first, but I'm so glad I did.",
			starRating: 5,
			createTime: '2026-06-22T20:57:28.467Z'
		}
	]
};

const REAL_PAYLOAD = {
	success: true,
	totalReviewCount: 47,
	averageRating: 4.9,
	// What Featurable actually sends: a *write-a-review* link, derived from Google's
	// `writeAReviewUri`, which redirects to an accounts.google.com sign-in wall.
	profileUrl: 'https://search.google.com/local/writereview?placeid=ChIJxxxx',
	example: false,
	reviews: [
		{
			reviewId: 'a',
			reviewer: {
				displayName: 'Richard Hollis',
				profilePhotoUrl: 'https://lh3.googleusercontent.com/a/x',
				isAnonymous: false
			},
			comment: 'Patient, candid, and no pressure at any stage.',
			starRating: 5,
			createTime: '2026-03-14T09:20:00.000Z'
		},
		{
			reviewId: 'b',
			reviewer: { displayName: 'Mark Thompson', profilePhotoUrl: '', isAnonymous: false },
			comment: 'Straightforward and professional.',
			starRating: 4,
			createTime: '2026-01-22T14:05:00.000Z'
		},
		{
			reviewId: 'c',
			reviewer: { displayName: '', profilePhotoUrl: '', isAnonymous: true },
			comment: 'Excellent.',
			starRating: 5,
			createTime: '2025-11-08T11:30:00.000Z'
		}
	]
};

describe('featurable normalise', () => {
	it('rejects the example payload outright', () => {
		// The single most important assertion in this file. An unbound widget serves
		// fabricated five-star reviews about a "product"; rendering them on a property
		// site would be both absurd and dishonest.
		expect(normalise(EXAMPLE_PAYLOAD, URL)).toBeNull();
	});

	it('rejects an unsuccessful payload', () => {
		expect(normalise({ success: false }, URL)).toBeNull();
	});

	it('maps a real payload', () => {
		const data = normalise(REAL_PAYLOAD, URL);
		expect(data).not.toBeNull();
		expect(data?.averageRating).toBe(4.9);
		expect(data?.totalCount).toBe(47);
		expect(data?.reviews).toHaveLength(3);
		expect(data?.reviews[0]).toMatchObject({
			id: 'a',
			authorName: 'Richard Hollis',
			authorPhotoUrl: 'https://lh3.googleusercontent.com/a/x',
			rating: 5
		});
	});

	it('never lets the vendor write-a-review link become the outbound link', () => {
		// The bug this guards: Featurable's `profileUrl` is Google's writeAReviewUri, which
		// lands on a sign-in wall asking the visitor to *leave* a review. Wiring "Read all
		// reviews" to it would be the worst possible destination for that button.
		const data = normalise(REAL_PAYLOAD, URL);
		expect(data?.reviewsUrl).toBe(URL);
		expect(data?.reviewsUrl).not.toContain('writereview');
		expect(data?.reviewsUrl).not.toBe(REAL_PAYLOAD.profileUrl);
	});

	it('leaves the link absent rather than guessing when no Place ID is set', () => {
		expect(normalise(REAL_PAYLOAD, null)?.reviewsUrl).toBeNull();
	});

	it('falls back to a neutral name and a null photo rather than rendering blanks', () => {
		const data = normalise(REAL_PAYLOAD, URL);
		expect(data?.reviews[1].authorPhotoUrl).toBeNull();
		expect(data?.reviews[2].authorName).toBe('A Google user');
	});

	it('drops star-only reviews, which have nothing to quote', () => {
		const data = normalise(
			{
				...REAL_PAYLOAD,
				reviews: [
					...REAL_PAYLOAD.reviews,
					{ reviewId: 'd', reviewer: { displayName: 'Quiet Buyer' }, starRating: 5, comment: '   ' }
				]
			},
			URL
		);
		expect(data?.reviews.map((r) => r.id)).not.toContain('d');
	});

	it('keeps the source aggregate rather than deriving one from the fetched subset', () => {
		// We show up to 9 reviews but the profile may hold hundreds. Averaging what we
		// happen to have fetched would misstate the rating — and, under the Business
		// Profile terms, deriving aggregates from fetched content is expressly disallowed.
		const data = normalise({ ...REAL_PAYLOAD, averageRating: 4.9, totalReviewCount: 47 }, URL);
		expect(data?.averageRating).toBe(4.9);
		expect(data?.totalCount).toBe(47);
	});

	it('returns null when every review is star-only', () => {
		expect(
			normalise({ ...REAL_PAYLOAD, reviews: [{ reviewId: 'x', starRating: 5, comment: '' }] }, URL)
		).toBeNull();
	});
});

describe('buildReviewsUrl', () => {
	it('builds Googles login-free reviews panel, not a Maps link', () => {
		expect(URL).toBe(`https://search.google.com/local/reviews?placeid=${PLACE_ID}`);
		expect(URL).not.toContain('maps');
		expect(URL).not.toContain('writereview');
	});

	it('returns null for a missing or junk Place ID rather than a broken link', () => {
		expect(buildReviewsUrl(undefined)).toBeNull();
		expect(buildReviewsUrl('')).toBeNull();
		expect(buildReviewsUrl('   ')).toBeNull();
		expect(buildReviewsUrl('short')).toBeNull();
		expect(buildReviewsUrl('has spaces and punctuation!')).toBeNull();
	});
});

describe('gates', () => {
	const base = { averageRating: 4.9, totalCount: 47, reviewsUrl: URL, reviews: [] };
	const review = {
		id: '1',
		authorName: 'A',
		authorPhotoUrl: null,
		rating: 5,
		text: 't',
		publishedAt: ''
	};

	it('does not render below three reviews', () => {
		expect(shouldRender(null)).toBe(false);
		expect(shouldRender({ ...base, reviews: [review, review] })).toBe(false);
		expect(shouldRender({ ...base, reviews: [review, review, review] })).toBe(true);
	});

	it('withholds the aggregate stamp until the count is worth printing', () => {
		expect(shouldShowAggregate({ ...base, totalCount: 4 })).toBe(false);
		expect(shouldShowAggregate({ ...base, totalCount: 5 })).toBe(true);
		expect(shouldShowAggregate({ ...base, totalCount: 50, averageRating: 0 })).toBe(false);
	});
});
