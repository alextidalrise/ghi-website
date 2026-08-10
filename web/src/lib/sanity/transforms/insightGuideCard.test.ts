import { describe, expect, it } from 'vitest';
import { toInsightGuideCard, toInsightGuideCards } from './insightGuideCard';

type ItemRaw = Parameters<typeof toInsightGuideCard>[0];
type GuideRaw = NonNullable<NonNullable<ItemRaw>['guide']>;

const guide = (over: Partial<GuideRaw> = {}): GuideRaw => ({
	_id: 'g-buying',
	title: 'Buying in Portugal',
	slug: 'buying-in-portugal',
	audienceLabel: 'For buyers',
	tagline: 'The essentials, start to finish.',
	...over
});

const item = (over: Partial<NonNullable<ItemRaw>> = {}): ItemRaw => ({ guide: guide(), ...over });

describe('toInsightGuideCard', () => {
	it('builds the canonical guide route and keeps the audience label and tagline', () => {
		const card = toInsightGuideCard(item());
		expect(card).not.toBeNull();
		expect(card!.href).toBe('/guides/buying-in-portugal');
		expect(card!.audienceLabel).toBe('For buyers');
		expect(card!.summary).toBe('The essentials, start to finish.');
	});

	it('prefers the article summary override over the guide tagline', () => {
		expect(toInsightGuideCard(item({ summaryOverride: 'A Portugal-specific brief.' }))!.summary).toBe(
			'A Portugal-specific brief.'
		);
	});

	it('fails closed on a null guide, a missing title, or a missing slug', () => {
		expect(toInsightGuideCard({ guide: null })).toBeNull();
		expect(toInsightGuideCard(item({ guide: guide({ title: '  ' }) }))).toBeNull();
		expect(toInsightGuideCard(item({ guide: guide({ slug: null }) }))).toBeNull();
	});
});

describe('toInsightGuideCards', () => {
	it('maps items and drops the ones that fail closed, preserving order', () => {
		const cards = toInsightGuideCards([
			item(),
			{ guide: null },
			item({ guide: guide({ _id: 'g-2', title: 'Golf & lifestyle', slug: 'golf-lifestyle' }) })
		]);
		expect(cards.map((c) => c._id)).toEqual(['g-buying', 'g-2']);
	});
});
