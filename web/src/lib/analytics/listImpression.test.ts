import { describe, expect, it } from 'vitest';
import {
	impressionKey,
	impressionObserverThreshold,
	impressionThreshold,
	isSufficientlyVisible
} from './listImpression';
import type { AnalyticsItem } from './types';

const VIEWPORT = 800;

/** A rect as getBoundingClientRect would report it, positioned relative to the viewport. */
const rect = (top: number, height: number) => ({ top, height, bottom: top + height });

const items = (...ids: string[]): AnalyticsItem[] => ids.map((item_id) => ({ item_id }));

describe('impressionKey', () => {
	it('is stable for the same list and contents', () => {
		expect(impressionKey('featured', items('GHI1', 'GHI2'))).toBe(
			impressionKey('featured', items('GHI1', 'GHI2'))
		);
	});

	it('changes when the contents change, so pagination reports again', () => {
		expect(impressionKey('search_results', items('GHI1', 'GHI2'))).not.toBe(
			impressionKey('search_results', items('GHI3', 'GHI4'))
		);
	});

	it('changes when the same listings appear in a different list', () => {
		expect(impressionKey('featured', items('GHI1'))).not.toBe(
			impressionKey('similar', items('GHI1'))
		);
	});

	it('distinguishes a reordered list, which is a different impression', () => {
		expect(impressionKey('featured', items('GHI1', 'GHI2'))).not.toBe(
			impressionKey('featured', items('GHI2', 'GHI1'))
		);
	});

	it('distinguishes a subset from a superset', () => {
		expect(impressionKey('featured', items('GHI1'))).not.toBe(
			impressionKey('featured', items('GHI1', 'GHI2'))
		);
	});

	it('handles an empty list', () => {
		expect(impressionKey('featured', [])).toBe('featured|');
	});
});

describe('impressionThreshold', () => {
	it('asks for 30% of a list shorter than the viewport', () => {
		expect(impressionThreshold(400, VIEWPORT)).toBe(120);
	});

	it('caps at a quarter of the viewport for a list taller than the screen', () => {
		// A 24-card results grid on a phone is several viewports tall. Requiring 30% of
		// the element would demand more pixels than the screen has, so it could never
		// fire — the bug this cap exists to prevent.
		expect(impressionThreshold(4000, VIEWPORT)).toBe(200);
	});
});

describe('impressionObserverThreshold', () => {
	it('uses the 30% element ratio for a short list', () => {
		expect(impressionObserverThreshold(400, VIEWPORT)).toBe(0.3);
	});

	it('derives a reachable ratio for a grid taller than ten viewports', () => {
		// Only 200px must be visible. A fixed 0.1 observer threshold would require 960px
		// and can never be crossed in an 800px viewport.
		expect(impressionObserverThreshold(9600, VIEWPORT)).toBeCloseTo(200 / 9600);
		expect(impressionObserverThreshold(9600, VIEWPORT)).toBeLessThan(0.1);
	});

	it('uses a valid inert threshold for a zero-height list', () => {
		expect(impressionObserverThreshold(0, VIEWPORT)).toBe(1);
	});
});

describe('isSufficientlyVisible', () => {
	it('reports a short rail once enough of it is on screen', () => {
		expect(isSufficientlyVisible(rect(600, 400), VIEWPORT)).toBe(true); // 200px of 400
		expect(isSufficientlyVisible(rect(750, 400), VIEWPORT)).toBe(false); // 50px of 400
	});

	it('reports a very tall grid that genuinely fills the screen', () => {
		// 4000px grid scrolled so it covers the whole viewport: impossible to reach 30%
		// of the element, but unmistakably being looked at.
		expect(isSufficientlyVisible(rect(-1000, 4000), VIEWPORT)).toBe(true);
	});

	it('does not report a tall grid that has only just appeared', () => {
		expect(isSufficientlyVisible(rect(700, 4000), VIEWPORT)).toBe(false); // 100px showing
	});

	it('does not report a list that is off screen entirely', () => {
		expect(isSufficientlyVisible(rect(900, 400), VIEWPORT)).toBe(false); // below the fold
		expect(isSufficientlyVisible(rect(-500, 400), VIEWPORT)).toBe(false); // scrolled past
	});

	it('does not report a zero-height list', () => {
		expect(isSufficientlyVisible(rect(100, 0), VIEWPORT)).toBe(false);
	});
});
