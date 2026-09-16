/**
 * The enquiry shelf: the two subordinate items that sit beneath the green enquiry panel
 * on a listing page — the buying guide for the listing's country, and the specialists
 * behind the purchase.
 *
 * Both default from the listing itself (country → guide; country → partners, one
 * specialist per discipline, walked in `shelfPriority` order over whatever that market
 * actually has) and are optionally overridden per listing in Sanity via `ctas.railGuide` /
 * `ctas.railPartners`. This module holds only the buyer-facing shapes and the resolution
 * rule; the fetching lives in $lib/sanity/queries/enquiryShelf.
 *
 * The specialists carry one CTA between them, and it goes to /partners — the vetted network,
 * where each firm has its own introduction request. Never a link out to the partner itself
 * (see $lib/partners/partners): every route to a specialist runs through GHI.
 */

/**
 * How many disciplines the shelf reaches for, and in what order, is no longer a constant
 * here — it is `shelfPriority` on each `partnerCategory` document.
 *
 * It used to be a hardcoded `['mortgage', 'currency-exchange', 'legal-tax']`, which held
 * while GHI sold in two markets that happened to have all three. It broke the moment UAE
 * and Montenegro went live with 33 listings between them: neither has a mortgage or a
 * legal partner, so two of the three slots were structurally unfillable and every listing
 * in those markets showed a single specialist labelled "Currency".
 *
 * The shelf now walks every discipline in priority order and fills up to
 * SHELF_PARTNER_LIMIT slots from whatever that market actually has. A market missing a
 * discipline drops to the next one instead of rendering a gap.
 */

/** Hard cap, matching the Sanity override's `Rule.max(3)`. Three fits the narrow rail. */
export const SHELF_PARTNER_LIMIT = 3;

/**
 * The floor under `shelfPriority`, used only for a category that has none.
 *
 * This is NOT the market list coming back in through the side door — that list was
 * unscalable because a new *market* required a code change. A discipline list is the
 * opposite: small, stable, and business logic rather than geography. What it buys is that
 * the shelf degrades sensibly rather than alphabetically when a value is missing — a
 * category an editor creates in Studio without setting a priority, or the window between
 * this deploy and the migration that seeds them. Sanity always wins where it has a value.
 *
 * Mortgage first (can this purchase happen at all), then Legal & Tax (a lawyer is
 * instructed before the reservation deposit, and it is the trust anchor of the brand),
 * then Currency. Relocation ranks fourth because it is the dominant motive in the Gulf,
 * and is the discipline that actually fills a UAE slot.
 */
export const DEFAULT_SHELF_PRIORITY: Record<string, number> = {
	mortgage: 0,
	'legal-tax': 1,
	'currency-exchange': 2,
	'relocation-partner': 3,
	'wealth-management': 4,
	'rental-investment': 5,
	'project-management': 6,
	insurance: 7,
	'holiday-rentals': 8
};

/** Sorts behind every ranked discipline. Matches the GROQ `coalesce(..., 999)` convention. */
export const UNRANKED_SHELF_PRIORITY = 999;

/**
 * The priority to sort a discipline by: the editor's value when set, else the code floor,
 * else last.
 */
export function shelfPriorityFor(
	categorySlug: string,
	authored: number | null | undefined
): number {
	if (typeof authored === 'number') return authored;
	return DEFAULT_SHELF_PRIORITY[categorySlug] ?? UNRANKED_SHELF_PRIORITY;
}

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

/** A partner's parallel category name / slug arrays, as projected by SHELF_PARTNER_PUBLIC. */
type ShelfPartnerCategories = {
	categories?: Array<string | null> | null;
	categorySlugs?: Array<string | null> | null;
};

/**
 * The label for a specific shelf slot a partner has been chosen to fill. The default shelf
 * assigns one partner per discipline, so the label is the SLOT's discipline — a mortgage-and-legal
 * partner filling the mortgage slot reads "Mortgage", not both, keeping each rail row one clean
 * discipline. Falls back to the partner's own name for that category where no short label applies.
 */
export function disciplineForSlot(
	categorySlug: string,
	partner: ShelfPartnerCategories
): string | null {
	const short = SHELF_DISCIPLINE_LABELS[categorySlug];
	if (short) return short;
	const index = (partner.categorySlugs ?? []).indexOf(categorySlug);
	// `|| null`, not `?? null`: a whitespace-only name trims to "", which is not nullish and
	// would ride through as an empty label rather than collapsing the row's label cell.
	return (index >= 0 ? partner.categories?.[index]?.trim() : undefined) || null;
}

/**
 * The label for an editor-picked partner, where there is no slot to name. The rail is not
 * discipline-partitioned in that case, so a multi-category partner shows all its disciplines,
 * joined — with the short label swapped in per category where the full name is too wide.
 */
export function disciplineFor(partner: ShelfPartnerCategories): string | null {
	const slugs = partner.categorySlugs ?? [];
	const labels = (partner.categories ?? [])
		.map((name, index) => {
			const slug = slugs[index];
			const short = slug ? SHELF_DISCIPLINE_LABELS[slug] : undefined;
			return (short ?? name?.trim()) || null;
		})
		.filter((label): label is string => Boolean(label));
	return labels.length > 0 ? labels.join(' · ') : null;
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

/** The listing's own market, so the shelf can name it in a fallback line. */
export type ShelfMarket = {
	slug: string;
	name: string;
};

export type EnquiryShelf = {
	/** The listing's country. Null only when the country itself could not be resolved. */
	market: ShelfMarket | null;
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
	/** Parallel arrays from `categories[]->name` / `categories[]->slug.current` — same order. */
	categories?: Array<string | null> | null;
	categorySlugs?: Array<string | null> | null;
	/** `categories[]->shelfPriority`, same order again. Null where an editor left it unset. */
	categoryPriorities?: Array<number | null> | null;
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

/**
 * Nothing resolved at all — an unknown country, or the fetch failed. With no market to
 * name, there is no honest fallback to offer either, so the aside renders the enquiry
 * panel alone. This is the only case where the shelf is silent.
 */
export const EMPTY_ENQUIRY_SHELF: EnquiryShelf = { market: null, guide: null, partners: [] };

export function shelfIsEmpty(shelf: EnquiryShelf | null | undefined): boolean {
	return !shelf || (shelf.guide == null && shelf.partners.length === 0);
}
