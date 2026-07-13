import { describe, expect, it } from 'vitest';
import { createFixtureProvider } from './fixtures';
import { buildReviewsUrl } from './reviewsUrl';

const REAL_PLACE_ID = 'ChIJ7cv00DwsDogRAMDACa2m4K8';

describe('Place ID takeover', () => {
	it('uses the sentinel only while no Place ID is configured', async () => {
		const data = await createFixtureProvider(buildReviewsUrl(undefined)).getReviews(fetch);
		expect(data?.reviewsUrl).toBe(
			'https://search.google.com/local/reviews?placeid=SET_GOOGLE_PLACE_ID'
		);
	});

	it('the real Place ID takes over the moment it is set', async () => {
		const data = await createFixtureProvider(buildReviewsUrl(REAL_PLACE_ID)).getReviews(fetch);
		expect(data?.reviewsUrl).toBe(
			`https://search.google.com/local/reviews?placeid=${REAL_PLACE_ID}`
		);
		expect(data?.reviewsUrl).not.toContain('SET_GOOGLE_PLACE_ID');
	});
});
