import { defineQuery } from 'groq';
import { SHELF_GUIDE_PUBLIC, SHELF_PARTNER_PUBLIC } from '../allowlists';
import { fetchPublic } from './fetch';
import {
	EMPTY_ENQUIRY_SHELF,
	SHELF_PARTNER_LIMIT,
	disciplineFor,
	disciplineForSlot,
	shelfOverrideFor,
	shelfPriorityFor,
	withoutShelfOverrides,
	type EnquiryShelf,
	type RawShelfGuide,
	type RawShelfPartner,
	type ShelfGuide,
	type ShelfHost,
	type ShelfMarket,
	type ShelfOverride,
	type ShelfPartner
} from '$lib/listing/enquiryShelf';

/**
 * The shelf's defaults, resolved from the listing's country alone — so this runs in
 * parallel with the listing fetch rather than after it (the country slug is a route
 * param, known before anything is loaded).
 *
 * The guide is the lowest-`order` buying guide for the country. Partners are every firm
 * covering that country, in editor order; `toDefaultShelfPartners` below narrows them to
 * one per discipline, walking `shelfPriority`, where the rule is explicit and testable.
 *
 * Both the guide's `country` and the partner's `countries` are matched two ways. The
 * dereferenced form is the shape after the country-refs migration; the bare comparison
 * still matches the legacy slug strings. Keeping both means the deploy and the migration
 * do not have to be simultaneous — and a listing page is the last place that should go
 * quiet because a content migration ran an hour late.
 *
 * The market's own name rides along so the shelf can say "a specialist in Montenegro"
 * when a market has no partner in a discipline yet, rather than dropping the row.
 */
export const enquiryShelfDefaultsQuery = defineQuery(`
  {
    "market": *[
      _type == "locationTaxonomy"
      && type == "country"
      && slug.current == $countrySlug
    ][0]{ name, "slug": slug.current },
    "guide": *[
      _type == "guide"
      && (country->slug.current == $countrySlug || country == $countrySlug)
      && guideCategory == "buying"
      && defined(slug.current)
    ] | order(coalesce(order, 999) asc, title asc)[0] ${SHELF_GUIDE_PUBLIC},
    "partners": *[
      _type == "partner"
      && defined(slug.current)
      && (count(countries[@->slug.current == $countrySlug]) > 0 || $countrySlug in countries)
    ] | order(coalesce(order, 999) asc, name asc) ${SHELF_PARTNER_PUBLIC}
  }
`);

type RawShelfDefaults = {
	market?: { name?: string | null; slug?: string | null } | null;
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

function toShelfMarket(raw: RawShelfDefaults['market']): ShelfMarket | null {
	if (!raw?.slug || !raw.name) return null;
	return { slug: raw.slug, name: raw.name };
}

/**
 * The disciplines available in this market, in the order a buyer needs them.
 *
 * Derived from the partners actually returned rather than from a fixed list, which is the
 * whole fix: a market with no mortgage broker simply has no mortgage discipline in its
 * walk, and the next one moves up. A discipline held by several partners keeps its best
 * (lowest) priority. Ties break on slug so the order is stable between requests.
 */
function disciplinesFor(partners: RawShelfPartner[]): string[] {
	const priorities = new Map<string, number>();

	for (const partner of partners) {
		const slugs = partner?.categorySlugs ?? [];
		slugs.forEach((slug, index) => {
			if (!slug) return;
			const priority = shelfPriorityFor(slug, partner.categoryPriorities?.[index]);
			const best = priorities.get(slug);
			if (best === undefined || priority < best) priorities.set(slug, priority);
		});
	}

	return [...priorities.entries()]
		.sort(([slugA, a], [slugB, b]) => a - b || slugA.localeCompare(slugB))
		.map(([slug]) => slug);
}

/**
 * Narrow the market's partners to one per discipline, walking `shelfPriority`.
 *
 * A partner may cover several disciplines, so it is eligible for every slot it matches —
 * but taken once: `used` holds the partners already placed, so the same firm never fills
 * two rows. When it would, it takes the earlier discipline and the next-best partner
 * fills the later one. The row's label is the SLOT's discipline (via `disciplineForSlot`),
 * not the partner's whole list, so each row still reads as one clean discipline.
 */
export function toDefaultShelfPartners(raw: RawShelfPartner[] | null | undefined): ShelfPartner[] {
	const available = (raw ?? []).filter((partner): partner is RawShelfPartner => partner != null);
	const partners: ShelfPartner[] = [];
	const used = new Set<string>();

	for (const categorySlug of disciplinesFor(available)) {
		if (partners.length >= SHELF_PARTNER_LIMIT) break;

		const match = available.find(
			(partner) =>
				partner.slug != null &&
				!used.has(partner.slug) &&
				(partner.categorySlugs ?? []).includes(categorySlug)
		);
		if (!match?.slug || !match.name) continue;

		used.add(match.slug);
		partners.push({
			slug: match.slug,
			name: match.name,
			discipline: disciplineForSlot(categorySlug, match)
		});
	}

	return partners;
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
 * overrides only the guide keeps the default specialists, and vice versa. The market is
 * never overridable — it is the listing's own country.
 */
export function resolveEnquiryShelf(defaults: EnquiryShelf, override: ShelfOverride): EnquiryShelf {
	const overrideGuide = toShelfGuide(override?.railGuide);
	const overridePartners = toOverrideShelfPartners(override?.railPartners);

	return {
		market: defaults.market,
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
		params: { countrySlug }
	});

	return {
		market: toShelfMarket(raw?.market),
		guide: toShelfGuide(raw?.guide),
		partners: toDefaultShelfPartners(raw?.partners)
	};
}
