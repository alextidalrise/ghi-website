import { describe, expect, it } from 'vitest';
import { impressionKey } from './listImpression';
import type { AnalyticsItem } from './types';

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
