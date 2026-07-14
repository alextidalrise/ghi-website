/**
 * The enquiry shelf: the two subordinate items that sit beneath the green enquiry panel
 * on a listing page — the buying guide for the listing's country, and the specialists
 * behind the purchase.
 *
 * Both default from the listing itself (country → guide; three fixed categories →
 * partners) and are optionally overridden per listing in Sanity via `ctas.railGuide` /
 * `ctas.railPartners`. This module holds only the buyer-facing shapes and the resolution
 * rule; the fetching lives in $lib/sanity/queries/enquiryShelf.
 *
 * Like every partner CTA on the site, the specialists route through a GHI introduction
 * request, never straight to the partner (see $lib/partners/partners).
 */
import { partnerIntroHref, type PartnerLogo } from '$lib/partners/partners';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';

/**
 * The specialists a buyer needs at the point of doing the arithmetic, in the order they
 * need them. One partner per category, so the shelf reads as three disciplines rather
 * than three logos that might all be lawyers.
 */
export const SHELF_PARTNER_CATEGORIES = ['mortgage', 'currency-exchange', 'legal-tax'] as const;

/** Hard cap, matching the Sanity override's `Rule.max(3)`. Three fits the narrow rail. */
export const SHELF_PARTNER_LIMIT = 3;

export type ShelfGuide = {
	title: string;
	/** Resolved guide URL. */
	href: string;
};

export type ShelfPartner = {
	slug: string;
	name: string;
	/** Category display name, e.g. "Mortgage". Null when the category is missing. */
	category: string | null;
	/** Resolved logo, or null — the cell falls back to the partner's name as text. */
	logo: PartnerLogo | null;
	/** Introduction-request link, always via GHI. */
	introHref: string;
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
	logo?: MediaAssetInput | null;
};

/** The override half of a listing's `ctas`, as projected by CTA_PUBLIC. */
export type ShelfOverride = {
	railGuide?: RawShelfGuide | null;
	railPartners?: RawShelfPartner[] | null;
} | null;

/**
 * Pull the shelf overrides off whichever listing the detail page built. A unit inherits
 * its development's picks, because the unit's `ctas` are projected from the development
 * context (see DEVELOPMENT_CONTEXT_PUBLIC).
 */
export function shelfOverrideFor(data: {
	property?: { ctas?: ShelfOverride } | null;
	development?: { ctas?: ShelfOverride } | null;
}): ShelfOverride {
	return (data.property ?? data.development)?.ctas ?? null;
}

/** Nothing resolved: the aside renders the enquiry panel alone, as it did before. */
export const EMPTY_ENQUIRY_SHELF: EnquiryShelf = { guide: null, partners: [] };

export function shelfIsEmpty(shelf: EnquiryShelf | null | undefined): boolean {
	return !shelf || (shelf.guide == null && shelf.partners.length === 0);
}

export { partnerIntroHref };
