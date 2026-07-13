import { describe, expect, it } from 'vitest';
import { readingMinutes, readingLabel, splitTitleEmphasis } from './format';
import { buildCategoryFilters, isInsightCategory, insightKickerLabel } from './categories';
import { insightsIndexHref } from './routes';
import { buildInsightToc } from './index';
import { buildInsightFaqJsonLd, collectFaqItems } from './seo';
import type { InsightCard, InsightSection } from './types';

const card = (overrides: Partial<InsightCard>): InsightCard => ({
	_id: overrides._id ?? 'id',
	...overrides
});

describe('readingMinutes', () => {
	it('honours an explicit override', () => {
		expect(readingMinutes({ readingTimeOverride: 8, bodyChars: 200 })).toBe(8);
	});

	it('derives from body length at ~200wpm and floors at 1 minute', () => {
		// ~1100 chars ≈ 200 words ≈ 1 minute; 3300 chars ≈ 3 minutes.
		expect(readingMinutes({ bodyChars: 3300 })).toBe(3);
		expect(readingMinutes({ bodyChars: 0 })).toBe(1);
		expect(readingMinutes({})).toBe(1);
	});

	it('formats a label', () => {
		expect(readingLabel({ bodyChars: 3300 })).toBe('3 min read');
	});
});

describe('isInsightCategory', () => {
	it('accepts known categories and rejects everything else', () => {
		expect(isInsightCategory('market')).toBe(true);
		expect(isInsightCategory('golf')).toBe(true);
		expect(isInsightCategory('bogus')).toBe(false);
		expect(isInsightCategory(null)).toBe(false);
	});
});

describe('insightKickerLabel', () => {
	it('returns the short label for a known category', () => {
		expect(insightKickerLabel('market')).toBe('Market');
		expect(insightKickerLabel('lifestyle')).toBe('Lifestyle');
	});
});

describe('buildCategoryFilters', () => {
	it('leads with All (total count) and drops categories with no articles, in order', () => {
		const cards = [
			card({ _id: 'a', insightCategory: 'market' }),
			card({ _id: 'b', insightCategory: 'market' }),
			card({ _id: 'c', insightCategory: 'golf' })
		];
		const filters = buildCategoryFilters(cards);
		expect(filters.map((f) => [f.value, f.count])).toEqual([
			[null, 3],
			['market', 2],
			['golf', 1]
		]);
	});
});

describe('insightsIndexHref', () => {
	it('builds clean index URLs from category and limit', () => {
		expect(insightsIndexHref()).toBe('/insights');
		expect(insightsIndexHref({ category: null })).toBe('/insights');
		expect(insightsIndexHref({ category: 'golf' })).toBe('/insights?category=golf');
		expect(insightsIndexHref({ category: 'golf', limit: 18 })).toBe('/insights?category=golf&limit=18');
	});
});

describe('buildInsightToc', () => {
	it('keeps only sections with both a heading and an anchor', () => {
		const sections: InsightSection[] = [
			{ heading: 'Intro', anchor: 'intro', body: [] },
			{ heading: 'No anchor', anchor: null, body: [] },
			{ heading: null, anchor: 'orphan', body: [] },
			{ heading: 'FAQ', anchor: 'faq', body: [] }
		];
		expect(buildInsightToc(sections)).toEqual([
			{ anchor: 'intro', heading: 'Intro' },
			{ anchor: 'faq', heading: 'FAQ' }
		]);
	});
});

describe('FAQ structured data', () => {
	const sections: InsightSection[] = [
		{
			heading: 'FAQ',
			anchor: 'faq',
			body: [
				{
					_type: 'insightFaq',
					_key: 'f1',
					items: [
						{ question: 'Q1?', answer: 'A1.' },
						{ question: '', answer: 'ignored — no question' }
					]
				}
			]
		}
	];

	it('collects only fully-answered questions across sections', () => {
		expect(collectFaqItems(sections)).toEqual([{ question: 'Q1?', answer: 'A1.' }]);
	});

	it('emits FAQPage JSON-LD when questions exist, null otherwise', () => {
		const jsonLd = buildInsightFaqJsonLd(sections) as Record<string, unknown>;
		expect(jsonLd['@type']).toBe('FAQPage');
		expect((jsonLd.mainEntity as unknown[]).length).toBe(1);
		expect(buildInsightFaqJsonLd([{ heading: 'x', anchor: 'x', body: [] }])).toBeNull();
	});
});

describe('splitTitleEmphasis', () => {
	const title = 'Living by the Fairways: The Quiet Luxury of Golf Course Living';

	it('splits the headline around the italic phrase', () => {
		expect(splitTitleEmphasis(title, 'Golf Course Living')).toEqual([
			{ text: 'Living by the Fairways: The Quiet Luxury of ', emphasis: false },
			{ text: 'Golf Course Living', emphasis: true }
		]);
	});

	it('emphasises a phrase in the middle, keeping the tail', () => {
		expect(splitTitleEmphasis(title, 'The Quiet Luxury')).toEqual([
			{ text: 'Living by the Fairways: ', emphasis: false },
			{ text: 'The Quiet Luxury', emphasis: true },
			{ text: ' of Golf Course Living', emphasis: false }
		]);
	});

	it('emphasises only the first occurrence', () => {
		expect(splitTitleEmphasis('Golf, and more golf', 'golf')).toEqual([
			{ text: 'Golf, and more ', emphasis: false },
			{ text: 'golf', emphasis: true }
		]);
	});

	it('falls back to the plain headline when the phrase is absent or unset', () => {
		const plain = [{ text: title, emphasis: false }];
		expect(splitTitleEmphasis(title, 'Not In The Title')).toEqual(plain);
		expect(splitTitleEmphasis(title, null)).toEqual(plain);
		expect(splitTitleEmphasis(title, '   ')).toEqual(plain);
	});

	it('returns nothing for a missing title', () => {
		expect(splitTitleEmphasis(null, 'anything')).toEqual([]);
		expect(splitTitleEmphasis('', 'anything')).toEqual([]);
	});
});
