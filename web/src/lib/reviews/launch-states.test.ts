import { describe, expect, it } from 'vitest';
import { normalise } from './featurable';
import { shouldRender, shouldShowAggregate } from './gates';

const URL = 'https://search.google.com/local/reviews?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';

const mk = (n: number) => ({
	success: true,
	example: false,
	averageRating: 4.9,
	totalReviewCount: n,
	reviews: Array.from({ length: n }, (_, i) => ({
		reviewId: `r${i}`,
		reviewer: { displayName: `Buyer ${i}` },
		comment: 'Good.',
		starRating: 5,
		createTime: '2026-01-01T00:00:00.000Z'
	}))
});

describe('launch states, end to end', () => {
	it('0 reviews: nothing to render', () => {
		expect(shouldRender(normalise(mk(0), URL))).toBe(false);
	});
	it('1-2 reviews: still silent', () => {
		expect(shouldRender(normalise(mk(1), URL))).toBe(false);
		expect(shouldRender(normalise(mk(2), URL))).toBe(false);
	});
	it('3 reviews: renders, but no aggregate stamp', () => {
		const d = normalise(mk(3), URL)!;
		expect(shouldRender(d)).toBe(true);
		expect(shouldShowAggregate(d)).toBe(false);
	});
	it('5 reviews: renders with the aggregate stamp', () => {
		const d = normalise(mk(5), URL)!;
		expect(shouldRender(d)).toBe(true);
		expect(shouldShowAggregate(d)).toBe(true);
	});
	it('unbound widget serving example data: silent no matter how many', () => {
		expect(shouldRender(normalise({ ...mk(9), example: true }, null))).toBe(false);
	});
});
