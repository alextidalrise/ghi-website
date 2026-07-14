import { defineQuery } from 'groq';
import { SHELF_GUIDE_PUBLIC, SHELF_PARTNER_PUBLIC } from '../allowlists';
import { fetchPublic } from './fetch';
import { toPartnerLogo } from './partners';
import {
	EMPTY_ENQUIRY_SHELF,
	SHELF_PARTNER_CATEGORIES,
	SHELF_PARTNER_LIMIT,
	partnerIntroHref,
	type EnquiryShelf,
	type RawShelfGuide,
	type RawShelfPartner,
	type ShelfGuide,
	type ShelfOverride,
	type ShelfPartner
} from '$lib/listing/enquiryShelf';

/**
 * The shelf's defaults, resolved from the listing's country alone — so this runs in
 * parallel with the listing fetch rather than after it (the country slug is a route
 * param, known before anything is loaded).
 *
 * The guide is the lowest-`order` buying guide for the country, which makes the UK-buyer
 * guide the default in both markets. Partners are fetched across the three shelf
 * categories and narrowed to one-per-category in `toShelfPartners` below, where the
 * category priority is explicit and testable.
 */
export const enquiryShelfDefaultsQuery = defineQuery(`
  {
    "guide": *[
      _type == "guide"
      && country == $countrySlug
      && guideCategory == "buying"
      && defined(slug.current)
    ] | order(coalesce(order, 999) asc, title asc)[0] ${SHELF_GUIDE_PUBLIC},
    "partners": *[
      _type == "partner"
      && defined(slug.current)
      && defined(logo.asset)
      && category->slug.current in $partnerCategories
    ] | order(coalesce(order, 999) asc, name asc) ${SHELF_PARTNER_PUBLIC}
  }
`);

type RawShelfDefaults = {
	guide?: RawShelfGuide | null;
	partners?: RawShelfPartner[] | null;
};

function toShelfGuide(raw: RawShelfGuide | null | undefined): ShelfGuide | null {
	if (!raw?.slug || !raw.title) return null;
	return {
		title: raw.title,
		href: `/guides/${raw.slug}`
	};
}

function toShelfPartner(raw: RawShelfPartner | null | undefined): ShelfPartner | null {
	if (!raw?.slug || !raw.name) return null;
	return {
		slug: raw.slug,
		name: raw.name,
		category: raw.category?.trim() || null,
		// A partner with no logo still renders: the cell shows the name as text, matching
		// the TrustedPartners placeholder. Only the *default* query requires a logo.
		logo: toPartnerLogo(raw.logo, raw.name),
		introHref: partnerIntroHref({ slug: raw.slug })
	};
}

/**
 * Narrow the default partners to one per category, in the order a buyer needs them
 * (mortgage → currency → legal), rather than in Sanity's `order`. A category with no
 * partner is simply skipped, so the shelf shows two specialists rather than an empty cell.
 */
export function toDefaultShelfPartners(raw: RawShelfPartner[] | null | undefined): ShelfPartner[] {
	const partners: ShelfPartner[] = [];

	for (const categorySlug of SHELF_PARTNER_CATEGORIES) {
		const match = (raw ?? []).find((partner) => partner?.categorySlug === categorySlug);
		const resolved = toShelfPartner(match);
		if (resolved) partners.push(resolved);
	}

	return partners.slice(0, SHELF_PARTNER_LIMIT);
}

/** Editor picks win wholesale and keep their authored order. */
function toOverrideShelfPartners(raw: RawShelfPartner[] | null | undefined): ShelfPartner[] {
	return (raw ?? [])
		.map(toShelfPartner)
		.filter((partner): partner is ShelfPartner => partner != null)
		.slice(0, SHELF_PARTNER_LIMIT);
}

/**
 * Merge the listing's overrides over the country defaults, per item. A listing that
 * overrides only the guide keeps the default specialists, and vice versa.
 */
export function resolveEnquiryShelf(
	defaults: EnquiryShelf,
	override: ShelfOverride
): EnquiryShelf {
	const overrideGuide = toShelfGuide(override?.railGuide);
	const overridePartners = toOverrideShelfPartners(override?.railPartners);

	return {
		guide: overrideGuide ?? defaults.guide,
		partners: overridePartners.length > 0 ? overridePartners : defaults.partners
	};
}

/**
 * Fetch the shelf defaults for a country. Resolves to an empty shelf on any failure or
 * for an unknown country, so a listing page never fails on a below-fold cross-link.
 */
export async function fetchEnquiryShelfDefaults(
	countrySlug: string | null | undefined
): Promise<EnquiryShelf> {
	if (!countrySlug) return EMPTY_ENQUIRY_SHELF;

	const raw = await fetchPublic<RawShelfDefaults>(enquiryShelfDefaultsQuery, {
		params: {
			countrySlug,
			partnerCategories: [...SHELF_PARTNER_CATEGORIES]
		}
	});

	return {
		guide: toShelfGuide(raw?.guide),
		partners: toDefaultShelfPartners(raw?.partners)
	};
}
