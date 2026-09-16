import type { Market } from '$lib/markets/markets';
import { GUIDE_CATEGORY_META, type GuideCategoryMeta } from './categories';
import type { GuideCard, GuideCategory } from './types';

/**
 * Grouping the Guides hub by market rather than by category.
 *
 * The hub used to stack every guide under "Buying guides", which held at two markets and
 * four guides. At four markets it is eight near-identically-titled cards in one list, and
 * the card carries an audience chip ("For UK buyers") but never said which country it was
 * about — `GUIDE_CARD_PUBLIC` did not even project one.
 *
 * Market is now the spine. Category becomes a sub-heading only where a market carries more
 * than one kind of guide, so today's buying-only set stays clean and a future location or
 * golf guide slots in without a second empty heading tier.
 */

/** A guide's category sub-group, used only when a market has more than one. */
export type GuideCategorySubgroup = {
	category: GuideCategory;
	meta: GuideCategoryMeta;
	guides: GuideCard[];
};

export type GuideMarketGroup = {
	market: Market;
	guides: GuideCard[];
	/**
	 * The guides split by category. One entry means the market has a single kind of guide
	 * and the page renders `guides` flat, with no sub-heading.
	 */
	categories: GuideCategorySubgroup[];
	/** True when this market has no published guide yet — the honest "not written" row. */
	isEmpty: boolean;
};

export type GuidesHubGroups = {
	/**
	 * Guides with no market, e.g. a general "buying abroad" primer. They lead the hub
	 * because they are the thing to read before picking a country.
	 */
	general: GuideCard[];
	markets: GuideMarketGroup[];
};

/** The market slug a card belongs to, from either shape the projection can return. */
export function guideMarketSlug(card: GuideCard): string | null {
	if (card.market?.slug) return card.market.slug;
	// Unmigrated document: `country` is still a plain slug string.
	return typeof card.marketSlugRaw === 'string' ? card.marketSlugRaw : null;
}

function toCategorySubgroups(
	guides: GuideCard[],
	metaOverrides?: Record<string, GuideCategoryMeta>
): GuideCategorySubgroup[] {
	const lookup = metaOverrides ?? GUIDE_CATEGORY_META;
	const order: GuideCategory[] = ['buying', 'location', 'golf'];

	return order
		.map((category) => ({
			category,
			meta: lookup[category] ?? GUIDE_CATEGORY_META[category],
			guides: guides.filter((guide) => guide.guideCategory === category)
		}))
		.filter((group) => group.guides.length > 0);
}

/**
 * Bucket guide cards by market, in the site's canonical market order.
 *
 * Every market is returned, including those with no guide — the hub says so rather than
 * omitting the country, because a buyer looking at 23 Montenegro listings should not have
 * to infer from an absence whether GHI covers it.
 */
export function groupGuidesByMarket(
	cards: GuideCard[],
	markets: ReadonlyArray<Market>,
	metaOverrides?: Record<string, GuideCategoryMeta>
): GuidesHubGroups {
	const bySlug = new Map<string, GuideCard[]>();
	const general: GuideCard[] = [];

	for (const card of cards) {
		const slug = guideMarketSlug(card);
		if (!slug) {
			general.push(card);
			continue;
		}
		const existing = bySlug.get(slug);
		if (existing) existing.push(card);
		else bySlug.set(slug, [card]);
	}

	const groups = markets.map((market) => {
		const guides = bySlug.get(market.slug) ?? [];
		return {
			market,
			guides,
			categories: toCategorySubgroups(guides, metaOverrides),
			isEmpty: guides.length === 0
		};
	});

	return { general, markets: groups };
}
