import { defineQuery } from 'groq';
import { SHELF_GUIDE_PUBLIC, SHELF_PARTNER_PUBLIC } from '../allowlists';
import { fetchPublic } from './fetch';
import {
	EMPTY_ENQUIRY_SHELF,
	SHELF_PARTNER_CATEGORIES,
	SHELF_PARTNER_LIMIT,
	disciplineFor,
	shelfOverrideFor,
	withoutShelfOverrides,
	type EnquiryShelf,
	type RawShelfGuide,
	type RawShelfPartner,
	type ShelfGuide,
	type ShelfHost,
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
 * categories, scoped to those that cover the listing's country, and narrowed to
 * one-per-category in `toDefaultShelfPartners` below, where the category priority is
 * explicit and testable. A category with no partner for the country is simply skipped.
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
      && category->slug.current in $partnerCategories
      && $countrySlug in countries
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
		discipline: disciplineFor(raw)
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
 * The one call a listing route makes: resolve the shelf from the listing's overrides and
 * the country defaults, hang it on the page data, and scrub the raw overrides back out.
 *
 * Resolve and scrub are a single step on purpose. Split across the three listing routes,
 * the scrub is the half that gets forgotten — and forgetting it is invisible, because the
 * shelf still renders correctly while the dereferenced documents ride to the browser
 * unread beside it.
 */
export function attachEnquiryShelf<T extends ShelfHost>(
	listing: T,
	defaults: EnquiryShelf
): T & { shelf: EnquiryShelf } {
	const shelf = resolveEnquiryShelf(defaults, shelfOverrideFor(listing));
	return { ...withoutShelfOverrides(listing), shelf };
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
