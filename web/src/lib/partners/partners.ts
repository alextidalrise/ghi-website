/**
 * Shared shapes for the vetted partner network shown on /partners and the homepage
 * Trusted Partners wall.
 *
 * Partners are authored in Sanity (Partners → Partner / Categories) and read via
 * $lib/sanity/queries/partners. This module holds only the buyer-facing types and the
 * introduction-request helper — no content.
 *
 * Every buyer-facing call to action routes through a GHI introduction request, never
 * straight to the partner. The partner's own destination (`referralUrl` in Sanity) is
 * the GHI team's handoff and is deliberately never projected to the website.
 */

/** A partner logo resolved to ready-to-render CDN URLs (server-side, via the image helper). */
export type PartnerLogo = {
	/** Single optimized URL for the `src` fallback. */
	url: string;
	/** Responsive candidates for `srcset`. */
	srcset: string;
	/** Accessible name for the image (falls back to the partner name). */
	alt: string;
};

export type Partner = {
	/** Stable id; also the value passed to the introduction request. */
	slug: string;
	name: string;
	/** One tight paragraph, brand voice. */
	description: string;
	/** Where the partner operates; shown as a quiet label on the card. */
	coverage: string;
	/** Resolved logo, or null while none has been uploaded (placeholder renders). */
	logo: PartnerLogo | null;
};

export type PartnerCategory = {
	/** Category slug; used as the section anchor and list key. */
	id: string;
	/** Category name, e.g. "Legal & Tax". */
	name: string;
	/** Single initial for the wayfinding monogram. */
	monogram: string;
	/** One line on what this category covers. */
	role: string;
	partners: Partner[];
};

/**
 * A partner may sit in several categories. These two helpers render that list the two ways
 * the site needs it, so the join rule lives in one place:
 *
 *  - `partnerCategoryLabel` — a compact " · " join for tight, tag-like surfaces (the homepage
 *    logo badge, an enquiry-rail discipline, an article's service label).
 *  - `partnerCategoryProse` — a grammatical list for running copy ("legal & tax, and mortgage").
 *    The serial comma is deliberate: category names carry their own "&" ("Legal & Tax"), so a
 *    plain "legal & tax and mortgage" would blur the two — the comma keeps them distinct.
 */
export function partnerCategoryLabel(
	categories: ReadonlyArray<string | null | undefined>
): string {
	return cleanNames(categories).join(' · ');
}

export function partnerCategoryProse(
	categories: ReadonlyArray<string | null | undefined>
): string {
	const names = cleanNames(categories);
	if (names.length <= 1) return names[0] ?? '';
	return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/** Trim, drop blanks and holes — a `categories[]->name` projection can carry both. */
function cleanNames(categories: ReadonlyArray<string | null | undefined>): string[] {
	return categories.map((name) => name?.trim() ?? '').filter(Boolean);
}

/** Buyer-facing introduction-request link for a partner. */
export function partnerIntroHref(partner: Pick<Partner, 'slug'>): string {
	return `/contact?partner=${encodeURIComponent(partner.slug)}`;
}

/** The query-param key `partnerIntroHref` writes and /contact reads. */
export const PARTNER_INTRO_PARAM = 'partner';

/**
 * A partner resolved from `?partner=<slug>` on /contact, so the form can name the
 * introduction the buyer actually asked for instead of opening blank.
 */
export type PartnerIntroduction = {
	slug: string;
	name: string;
	/**
	 * Category display names, e.g. ["Legal & Tax", "Mortgage"], in the partner's own order
	 * (first is primary). Empty when no category resolved. Render with `partnerCategoryProse`
	 * in copy, `partnerCategoryLabel` where a compact tag is wanted.
	 */
	categories: string[];
};

/** The message the enquiry form opens with when an introduction was requested. */
export function partnerIntroMessage(partner: PartnerIntroduction): string {
	return `Please introduce me to ${partner.name}.`;
}
