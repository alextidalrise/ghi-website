/**
 * The enquiry shelf: the two subordinate items that sit beneath the green enquiry panel
 * on a listing page — the buying guide for the listing's country, and the specialists
 * behind the purchase.
 *
 * Both default from the listing itself (country → guide; country + three fixed categories →
 * partners, one specialist per category that covers the listing's country) and are
 * optionally overridden per listing in Sanity via `ctas.railGuide` / `ctas.railPartners`. This module holds only the buyer-facing shapes and the resolution
 * rule; the fetching lives in $lib/sanity/queries/enquiryShelf.
 *
 * The specialists carry one CTA between them, and it goes to /partners — the vetted network,
 * where each firm has its own introduction request. Never a link out to the partner itself
 * (see $lib/partners/partners): every route to a specialist runs through GHI.
 */

/**
 * The specialists a buyer needs at the point of doing the arithmetic, in the order they
 * need them. One partner per category, so the shelf reads as three disciplines rather
 * than three logos that might all be lawyers.
 */
export const SHELF_PARTNER_CATEGORIES = ['mortgage', 'currency-exchange', 'legal-tax'] as const;

/** Hard cap, matching the Sanity override's `Rule.max(3)`. Three fits the narrow rail. */
export const SHELF_PARTNER_LIMIT = 3;

/**
 * The rail's short form for a discipline, where the category's own name is too long for it.
 *
 * "Currency Exchange" is the category's formal name and it is right on /partners, but in a
 * 300px rail it is the widest label by half again — it sets the width of the whole label
 * column and strands the short labels beside a void. "Currency" is unambiguous next to
 * Mortgage and Legal & Tax. Anything not listed here keeps its Sanity name.
 */
const SHELF_DISCIPLINE_LABELS: Record<string, string> = {
	'currency-exchange': 'Currency'
};

export function disciplineFor(partner: {
	category?: string | null;
	categorySlug?: string | null;
}): string | null {
	const short = partner.categorySlug ? SHELF_DISCIPLINE_LABELS[partner.categorySlug] : undefined;
	// `|| null`, not `?? null`: a whitespace-only category trims to "", which is not nullish
	// and would ride through as an empty label rather than collapsing the row's label cell.
	return short ?? (partner.category?.trim() || null);
}

export type ShelfGuide = {
	title: string;
	/** Resolved guide URL. */
	href: string;
};

export type ShelfPartner = {
	slug: string;
	name: string;
	/**
	 * The discipline this specialist covers, e.g. "Mortgage" — the partner's category name.
	 * Null when the category never resolved, in which case the firm is still named; it just
	 * loses its label.
	 */
	discipline: string | null;
};

export type EnquiryShelf = {
	guide: ShelfGuide | null;
	partners: ShelfPartner[];
};

/* --- Raw Sanity shapes -------------------------------------------------------------
 *
 * Declared here rather than in the query module because the listing's `ctas` carries the
 * overrides (see CTA_PUBLIC), so the transform layer needs these types too. Keeping them
 * in this dependency-light module lets both import them without a cycle.
 */

export type RawShelfGuide = {
	_id?: string | null;
	title?: string | null;
	slug?: string | null;
};

export type RawShelfPartner = {
	_id?: string | null;
	name?: string | null;
	slug?: string | null;
	category?: string | null;
	categorySlug?: string | null;
};

/** The override half of a listing's `ctas`, as projected by CTA_PUBLIC. */
export type ShelfOverride = {
	railGuide?: RawShelfGuide | null;
	railPartners?: RawShelfPartner[] | null;
} | null;

/** A listing page's data, as far as the shelf is concerned. Either page shape satisfies it. */
type CtaHolder = { ctas?: ShelfOverride };

export type ShelfHost = {
	property?: CtaHolder | null;
	development?: CtaHolder | null;
};

/**
 * Pull the shelf overrides off whichever listing the detail page built. A unit inherits
 * its development's picks, because the unit's `ctas` are projected from the development
 * context (see DEVELOPMENT_CONTEXT_PUBLIC).
 */
export function shelfOverrideFor(data: ShelfHost): ShelfOverride {
	return (data.property ?? data.development)?.ctas ?? null;
}

/**
 * Drop the raw overrides from a listing's `ctas` once the shelf has been resolved from
 * them. They are a server-side input: the browser is sent the resolved `shelf`, so the
 * dereferenced guide and partner documents would otherwise ride along beside it —
 * the same picks twice, in the shape nothing renders.
 */
function withoutOverrides<T extends CtaHolder>(listing: T): T {
	if (!listing.ctas) return listing;

	const { railGuide: _railGuide, railPartners: _railPartners, ...ctas } = listing.ctas;
	return { ...listing, ctas };
}

/** As above, applied to whichever of the two listing shapes the page carries. */
export function withoutShelfOverrides<T extends ShelfHost>(data: T): T {
	const scrubbed = { ...data };
	if (scrubbed.property) scrubbed.property = withoutOverrides(scrubbed.property);
	if (scrubbed.development) scrubbed.development = withoutOverrides(scrubbed.development);
	return scrubbed;
}

/** Nothing resolved: the aside renders the enquiry panel alone, as it did before. */
export const EMPTY_ENQUIRY_SHELF: EnquiryShelf = { guide: null, partners: [] };

export function shelfIsEmpty(shelf: EnquiryShelf | null | undefined): boolean {
	return !shelf || (shelf.guide == null && shelf.partners.length === 0);
}
