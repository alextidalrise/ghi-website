import type { Market } from '$lib/markets/markets';

/**
 * The Guides hub as a consultation: two questions, one answer.
 *
 * "Who are you buying as?" picks a buyer type; "Where are you looking?" picks a market.
 * The answer is the one guide written for that pairing — or a plain statement that none
 * is written yet, pointing at the other buyer type's guide where one exists.
 *
 * Both answers live in the URL (`?for=uk-buyer&in=spain`), so a choice is a link: it works
 * without JavaScript, survives a refresh, and can be sent to someone.
 */

export const FOR_PARAM = 'for';
export const IN_PARAM = 'in';

export type BuyerType = { slug: string; name: string };

/** A guide as the hub needs it: enough to identify it and to show what it covers. */
export type FinderGuide = {
	slug: string;
	title: string;
	tagline: string | null;
	/** Chapter headings, in reading order — the proof of what the guide covers. */
	chapters: string[];
	/** "Reviewed June 2026", or null when the guide carries no review date. */
	reviewed: string | null;
	/** Buyer-type slug, or null for a guide written for every buyer in its market. */
	audience: string | null;
	/** Market slug, or null for a guide that is not market-specific. */
	market: string | null;
};

export type FinderAnswer =
	| { state: 'incomplete' }
	| { state: 'found'; guide: FinderGuide; alternate: FinderAlternate | null }
	| { state: 'missing'; alternate: FinderAlternate | null };

/** The same market's guide for a different buyer type — offered alongside the answer. */
export type FinderAlternate = { guide: FinderGuide; buyerType: BuyerType };

export type FinderState = {
	buyerTypes: BuyerType[];
	markets: Market[];
	/** The chosen buyer type (or the default), validated against the list; null only when none exist. */
	buyerType: BuyerType | null;
	market: Market | null;
	answer: FinderAnswer;
};

/** Build the hub URL for a pair of answers. Either may be omitted. */
export function finderHref(forSlug: string | null, inSlug: string | null): string {
	const params = new URLSearchParams();
	if (forSlug) params.set(FOR_PARAM, forSlug);
	if (inSlug) params.set(IN_PARAM, inSlug);
	const query = params.toString();
	return query ? `/guides?${query}` : '/guides';
}

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

/**
 * "Reviewed June 2026" from a `YYYY-MM-DD` date. String parsing rather than `Date` so the
 * server and the browser can never disagree across a timezone boundary.
 */
export function reviewedLabel(date: string | null | undefined): string | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date ?? '');
	if (!match) return null;
	const month = MONTHS[Number.parseInt(match[2], 10) - 1];
	return month ? `Reviewed ${month} ${match[1]}` : null;
}

/**
 * The best guide for a buyer type in a market.
 *
 * An exact match wins. A guide with no buyer type is written for everyone in its market,
 * so it answers any buyer type there. A guide with no market is a general guide for that
 * buyer type, used only when the market has nothing of its own. Within a tier the input
 * order (editor `order`) decides.
 */
function bestGuide(guides: FinderGuide[], audience: string, market: string): FinderGuide | null {
	return (
		guides.find((g) => g.audience === audience && g.market === market) ??
		guides.find((g) => g.audience === null && g.market === market) ??
		guides.find((g) => g.audience === audience && g.market === null) ??
		null
	);
}

/** Resolve the hub's state from its guides, choices and the two URL answers. */
export function resolveFinder(input: {
	guides: FinderGuide[];
	buyerTypes: BuyerType[];
	markets: Market[];
	forSlug: string | null;
	inSlug: string | null;
}): FinderState {
	const { guides, buyerTypes, markets } = input;

	// Both questions arrive pre-answered with the first available option, so the hub opens
	// on a real guide rather than an empty panel. An unknown or stale slug falls back to
	// the same default: an old shared link lands on an answer, never on an error.
	//
	// "Available" for the market means one that actually has a guide for the chosen buyer
	// type — so a newly added country ordered first, before its guide is written, does not
	// make the hub open on "not written yet". Only when no market has one does it fall back
	// to the first market in order.
	const buyerType = buyerTypes.find((t) => t.slug === input.forSlug) ?? buyerTypes[0] ?? null;
	const market =
		markets.find((m) => m.slug === input.inSlug) ??
		(buyerType
			? markets.find((m) => bestGuide(guides, buyerType.slug, m.slug) != null)
			: undefined) ??
		markets[0] ??
		null;

	if (!buyerType || !market) {
		return { buyerTypes, markets, buyerType, market, answer: { state: 'incomplete' } };
	}

	const guide = bestGuide(guides, buyerType.slug, market.slug);

	// Point at another buyer type's guide for the same market, but only one that is
	// actually different from the answer (a buyer-agnostic guide already answers them all).
	const alternate =
		buyerTypes
			.filter((t) => t.slug !== buyerType.slug)
			.map((t) => {
				const other = guides.find((g) => g.audience === t.slug && g.market === market.slug);
				return other && other.slug !== guide?.slug ? { guide: other, buyerType: t } : null;
			})
			.find((entry): entry is FinderAlternate => entry != null) ?? null;

	return {
		buyerTypes,
		markets,
		buyerType,
		market,
		answer: guide ? { state: 'found', guide, alternate } : { state: 'missing', alternate }
	};
}
