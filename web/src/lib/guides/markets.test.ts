import { describe, expect, it } from 'vitest';
import { groupGuidesByMarket } from './markets';
import type { GuideCard } from './types';

const SPAIN = { slug: 'spain', name: 'Spain', flagUrl: null };
const MONTENEGRO = { slug: 'montenegro', name: 'Montenegro', flagUrl: null };

const card = (id: string, extra: Partial<GuideCard>): GuideCard => ({
	_id: id,
	title: id,
	slug: id,
	guideCategory: 'buying',
	...extra
});

describe('groupGuidesByMarket', () => {
	it('groups by the referenced market, in the order markets are given', () => {
		const groups = groupGuidesByMarket(
			[card('es-uk', { market: { slug: 'spain', name: 'Spain' } })],
			[MONTENEGRO, SPAIN]
		);

		expect(groups.markets.map((g) => g.market.slug)).toEqual(['montenegro', 'spain']);
		expect(groups.markets[1].guides.map((g) => g._id)).toEqual(['es-uk']);
	});

	it('reads a legacy slug string on an unmigrated guide', () => {
		const groups = groupGuidesByMarket([card('es-uk', { marketSlugRaw: 'spain' })], [SPAIN]);

		expect(groups.markets[0].guides).toHaveLength(1);
	});

	it('keeps a market with no guide, flagged empty, rather than dropping it', () => {
		const groups = groupGuidesByMarket([], [MONTENEGRO]);

		expect(groups.markets).toHaveLength(1);
		expect(groups.markets[0].isEmpty).toBe(true);
	});

	it('leads with guides that belong to no market', () => {
		const groups = groupGuidesByMarket([card('abroad', {})], [SPAIN]);

		expect(groups.general.map((g) => g._id)).toEqual(['abroad']);
		expect(groups.markets[0].isEmpty).toBe(true);
	});

	it('splits categories only when a market carries more than one', () => {
		const groups = groupGuidesByMarket(
			[
				card('buy', { marketSlugRaw: 'spain' }),
				card('golf', { marketSlugRaw: 'spain', guideCategory: 'golf' })
			],
			[SPAIN]
		);

		expect(groups.markets[0].categories.map((c) => c.category)).toEqual(['buying', 'golf']);
	});
});
