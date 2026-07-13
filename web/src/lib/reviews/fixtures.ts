import { buildReviewsUrl } from './reviewsUrl';
import type { ReviewsData, ReviewsProvider } from './types';

/**
 * Stand-in reviews for local development and preview, shaped exactly like the live
 * Featurable payload. Deliberately varied: a very long review (the panel must clamp it),
 * a one-line review (the panel must not collapse), a 4-star among the 5s, and no avatars
 * on some — all four are real states the Google feed produces.
 *
 * The photo-less reviewers are not an oversight. Plenty of Google accounts carry no
 * avatar, and the monogram fallback is a path that has to be exercised, not assumed.
 */
const FIXTURE: Omit<ReviewsData, 'reviewsUrl'> = {
	averageRating: 4.9,
	totalCount: 47,
	reviews: [
		{
			id: 'fixture-1',
			authorName: 'Richard Hollis',
			authorPhotoUrl: null,
			rating: 5,
			text: "We'd been looking on and off for the better part of two years and had all but given up on finding something that worked for both of us. What made the difference here was that nobody pushed. James listened, told us honestly when a property wasn't right for what we'd described, and twice talked us out of viewings he didn't think were worth the flight. When we did find the house in Nueva Andalucía it felt like a decision we'd made rather than one we'd been sold. The paperwork on the Spanish side was handled far better than we expected and we were kept informed the whole way through.",
			publishedAt: '2026-03-14T09:20:00.000Z'
		},
		{
			id: 'fixture-2',
			authorName: 'Mark Thompson',
			authorPhotoUrl: null,
			rating: 5,
			text: 'Bought an apartment in Vilamoura through the team. Straightforward, professional, and genuinely knowledgeable about the area rather than just the listings. Would use again.',
			publishedAt: '2026-01-22T14:05:00.000Z'
		},
		{
			id: 'fixture-3',
			authorName: 'Emma Davies',
			authorPhotoUrl: null,
			rating: 5,
			text: "Sotogrande is a difficult market to read from the UK and we'd have made an expensive mistake without the guidance we got. Patient, candid, and no pressure at any stage.",
			publishedAt: '2025-11-08T11:30:00.000Z'
		},
		{
			id: 'fixture-4',
			authorName: 'Andrew Sinclair',
			authorPhotoUrl: null,
			rating: 4,
			text: "Very good service overall and we're happy with the villa. The only reason for four rather than five is that the completion timeline slipped by about a month, though to be fair that sat with the developer rather than with GHI, and they chased it constantly on our behalf.",
			publishedAt: '2025-09-30T16:45:00.000Z'
		},
		{
			id: 'fixture-5',
			authorName: 'Caroline Webb',
			authorPhotoUrl: null,
			rating: 5,
			text: 'Exceptional from first call to handover.',
			publishedAt: '2025-08-19T08:10:00.000Z'
		},
		{
			id: 'fixture-6',
			authorName: 'Peter Whitfield',
			authorPhotoUrl: null,
			rating: 5,
			text: "I'd been warned about buying abroad by more or less everyone I know, and I understand why — but this was the most transparent property transaction I have been part of, in Spain or in England. Every cost was set out up front and none of them moved.",
			publishedAt: '2025-07-02T13:55:00.000Z'
		}
	]
};

/**
 * A stand-in so the "Read all reviews" link still renders before GOOGLE_PLACE_ID exists —
 * fixtures are here to show the whole design, and an unset env var shouldn't quietly delete
 * a piece of it.
 *
 * Deliberately a self-describing sentinel rather than a real Place ID. A valid sample (say
 * Google's own docs ID) would produce a link that silently *works* — opening some unrelated
 * business's reviews in Sydney with no hint anything was wrong. This one renders the link,
 * says exactly what's missing to anyone who inspects the href, and fails visibly if clicked.
 *
 * It applies only to the fixture provider. In production a missing Place ID means no link at
 * all, which is the safe failure.
 */
const PLACE_ID_SENTINEL = 'SET_GOOGLE_PLACE_ID';

export function createFixtureProvider(reviewsUrl: string | null): ReviewsProvider {
	return {
		name: 'fixture',
		async getReviews() {
			return { ...FIXTURE, reviewsUrl: reviewsUrl ?? buildReviewsUrl(PLACE_ID_SENTINEL) };
		}
	};
}
