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
	/** Category display name, e.g. "Mortgage". Null when the category is missing. */
	category: string | null;
};

/** The message the enquiry form opens with when an introduction was requested. */
export function partnerIntroMessage(partner: PartnerIntroduction): string {
	return `Please introduce me to ${partner.name}.`;
}
