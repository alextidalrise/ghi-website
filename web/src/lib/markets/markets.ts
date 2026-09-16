/**
 * A market — a country GHI operates in.
 *
 * The buyer-facing shape and the ordering rule, in one place. Before this existed every
 * surface that enumerated markets invented its own order: the homepage index sorted by
 * how many featured locations a country had, the header shelf and the footer by their
 * authored menu order. Three orders on one site, and nothing that told an editor which
 * one they were changing.
 *
 * The order now comes from `displayOrder` on the country document, so reordering markets
 * is one edit in Studio that moves every list at once.
 *
 * Fetching lives in $lib/sanity/queries/markets.
 */

export type Market = {
	/** Country slug — the `[country]` URL segment. */
	slug: string;
	name: string;
	/** Raw flag asset URL (SVG); null falls back to CountryFlagArt's built-in stamp. */
	flagUrl: string | null;
};

/** A market plus however many of something it has — guides, partners, listings. */
export type MarketWithCount = Market & { count: number };

/** The market's own page, e.g. `/spain`. */
export function marketPath(market: Pick<Market, 'slug'>): string {
	return `/${market.slug}`;
}

/**
 * The partner directory filtered to one market, e.g. `/partners?covering=uae`.
 * Omitting the market returns the unfiltered directory.
 */
export function partnersPath(slug?: string | null): string {
	return slug ? `/partners?covering=${encodeURIComponent(slug)}` : '/partners';
}

/**
 * A market name as it reads inside a sentence: "in Spain", but "in the UAE".
 *
 * A grammatical rule, not a list of markets: initialisms (UAE, USA) and names that are
 * plural or compound in form ("United Kingdom", "Cayman Islands", "Dominican Republic")
 * take the article. A country added next year gets it right without anyone remembering.
 * Headings and chips keep the bare name; this is for running copy only.
 */
export function marketInProse(name: string): string {
	const trimmed = name.trim();
	if (/^the\s/i.test(trimmed)) return trimmed;
	const takesArticle =
		/^[A-Z]{2,}$/.test(trimmed) ||
		/^United\s/.test(trimmed) ||
		/\s(Islands|Republic|Emirates|Kingdom|States)$/.test(trimmed);
	return takesArticle ? `the ${trimmed}` : trimmed;
}

/**
 * Prose listing of market names — "Spain, Portugal and the UAE".
 *
 * Deliberately NOT used for the standing brand copy, which is region-led and never
 * enumerates (see DESIGN.md / the market copy rule). This is for the few places where
 * naming the current set is the actual information: a coverage summary beside a filter,
 * an honest empty state.
 */
export function marketNames(markets: ReadonlyArray<Pick<Market, 'name'>>): string {
	const names = markets.map((market) => marketInProse(market.name)).filter(Boolean);
	if (names.length === 0) return '';
	if (names.length === 1) return names[0];
	return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
