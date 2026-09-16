import { defineQuery } from 'groq';
import { PARTNER_CATEGORY_PUBLIC, PARTNER_COVERS_MARKET, PARTNER_LOGO_PUBLIC } from '../allowlists';
import { buildImageSrcset, buildPublicImageUrl } from '../image';
import { fetchPublic } from './fetch';
import type { MediaAssetInput } from '../transforms/mediaFilter';
import {
	partnerCategoryLabel,
	type Partner,
	type PartnerCategory,
	type PartnerIntroduction,
	type PartnerLogo
} from '$lib/partners/partners';
import type { TrustedPartner } from '$lib/components/home/TrustedPartners.svelte';
import type { Market } from '$lib/markets/markets';

/** Widths the logo CDN crops are generated at; the cell caps the rendered height. */
const LOGO_WIDTHS = [160, 240, 320, 480];

/**
 * Partner categories that have at least one partner in the requested market, in display
 * order. `$covering` is a country slug, or the empty string for the whole network.
 *
 * The emptiness test has to repeat the coverage filter rather than just counting partners:
 * otherwise filtering to the UAE would still render seven category headings with nothing
 * under them. A discipline GHI has not staffed in that market is simply absent, and the
 * page says how many of the nine are covered rather than pretending.
 */
export const partnerCategoriesQuery = defineQuery(`
  *[
    _type == "partnerCategory"
    && defined(slug.current)
    && count(*[
      _type == "partner"
      && references(^._id)
      && defined(slug.current)
      && ${PARTNER_COVERS_MARKET}
    ]) > 0
  ] | order(coalesce(order, 999) asc, name asc) ${PARTNER_CATEGORY_PUBLIC}
`);

/** Every partner in the network, regardless of market — the "All markets" chip count. */
export const partnerTotalQuery = defineQuery(`
  count(*[_type == "partner" && defined(slug.current)])
`);

/** How many disciplines the network covers in total, for the honest-coverage line. */
export const partnerCategoryTotalQuery = defineQuery(`
  count(*[
    _type == "partnerCategory"
    && defined(slug.current)
    && count(*[_type == "partner" && references(^._id) && defined(slug.current)]) > 0
  ])
`);

/** Partners with a logo, for the homepage logo wall. */
export const homepagePartnerLogosQuery = defineQuery(`
  *[
    _type == "partner"
    && defined(slug.current)
    && defined(logo.asset)
  ] | order(coalesce(order, 999) asc, name asc)[0...$limit] ${PARTNER_LOGO_PUBLIC}
`);

/** One partner by slug — resolves the `?partner=` introduction request on /contact. */
export const partnerBySlugQuery = defineQuery(`
  *[_type == "partner" && slug.current == $slug][0]{
    name,
    "slug": slug.current,
    "categories": categories[]->name
  }
`);

export const HOMEPAGE_PARTNER_LOGOS_LIMIT = 10;

type RawPartner = {
	_id: string;
	name?: string | null;
	slug?: string | null;
	coverage?: string | null;
	description?: string | null;
	logo?: MediaAssetInput | null;
	/** Dereferenced country docs — the shape after the country-refs migration. */
	markets?: Array<{ name?: string | null; slug?: string | null } | null> | null;
	/** The raw field, which still holds slug strings on an unmigrated document. */
	marketSlugsRaw?: unknown;
};

type RawCategory = {
	id?: string | null;
	name?: string | null;
	monogram?: string | null;
	role?: string | null;
	partners?: RawPartner[] | null;
};

type RawLogoPartner = {
	_id: string;
	name?: string | null;
	slug?: string | null;
	categories?: Array<string | null> | null;
	logo?: MediaAssetInput | null;
};

/** Category names from a `categories[]->name` projection, trimmed and emptied of holes. */
function cleanCategoryNames(names: Array<string | null> | null | undefined): string[] {
	return (names ?? []).map((name) => name?.trim() ?? '').filter(Boolean);
}

/** Resolve a logo asset to ready-to-render CDN URLs, or null when none is attached. */
function toPartnerLogo(logo: MediaAssetInput | null | undefined, name: string): PartnerLogo | null {
	const url = buildPublicImageUrl(logo, { width: 320, fit: 'max' });
	if (!url) return null;
	return {
		url,
		srcset: buildImageSrcset(logo, LOGO_WIDTHS, { fit: 'max' }),
		alt: logo?.altText?.trim() || name
	};
}

/**
 * The markets a partner covers, named.
 *
 * Reads the dereferenced countries where they arrived, and falls back to matching the raw
 * slug strings against the market list on an unmigrated document — so the card's tags are
 * right either side of the migration rather than silently empty for a day.
 */
function toPartnerMarkets(raw: RawPartner, markets: ReadonlyArray<Market>): Market[] {
	const resolved = (raw.markets ?? [])
		.map((entry) => markets.find((market) => market.slug === entry?.slug))
		.filter((market): market is Market => market != null);
	if (resolved.length > 0) return resolved;

	const legacy = Array.isArray(raw.marketSlugsRaw) ? raw.marketSlugsRaw : [];
	return legacy
		.filter((slug): slug is string => typeof slug === 'string')
		.map((slug) => markets.find((market) => market.slug === slug))
		.filter((market): market is Market => market != null);
}

function toPartner(raw: RawPartner, markets: ReadonlyArray<Market>): Partner | null {
	if (!raw.slug || !raw.name) return null;
	return {
		slug: raw.slug,
		name: raw.name,
		coverage: raw.coverage ?? '',
		description: raw.description ?? '',
		logo: toPartnerLogo(raw.logo, raw.name),
		markets: toPartnerMarkets(raw, markets)
	};
}

function toCategory(raw: RawCategory, markets: ReadonlyArray<Market>): PartnerCategory | null {
	if (!raw.id || !raw.name) return null;
	const partners = (raw.partners ?? [])
		.map((partner) => toPartner(partner, markets))
		.filter((partner): partner is Partner => partner != null);
	if (partners.length === 0) return null;
	return {
		id: raw.id,
		name: raw.name,
		monogram: raw.monogram?.trim() || raw.name.charAt(0).toUpperCase(),
		role: raw.role ?? '',
		partners
	};
}

/**
 * Fetch the partner directory for /partners, optionally narrowed to one market.
 *
 * `markets` is passed in rather than fetched here because the page already needs the full
 * market list for its coverage filter; this reuses it to name each partner's tags.
 */
export async function fetchPartnerCategories(
	markets: ReadonlyArray<Market> = [],
	covering: string | null = null
): Promise<PartnerCategory[]> {
	const raw = await fetchPublic<RawCategory[]>(partnerCategoriesQuery, {
		params: { covering: covering ?? '' }
	});
	return (raw ?? [])
		.map((category) => toCategory(category, markets))
		.filter((category): category is PartnerCategory => category != null);
}

/** Total number of disciplines the network covers, across every market. */
export async function fetchPartnerCategoryTotal(): Promise<number> {
	const total = await fetchPublic<number>(partnerCategoryTotalQuery);
	return typeof total === 'number' ? total : 0;
}

/**
 * Total number of partners, counted once each.
 *
 * Deliberately its own query rather than a sum or max over the per-market counts: a
 * partner covering four markets is counted in all four, so summing double-counts and
 * taking the max just returns the biggest single market.
 */
export async function fetchPartnerTotal(): Promise<number> {
	const total = await fetchPublic<number>(partnerTotalQuery);
	return typeof total === 'number' ? total : 0;
}

/**
 * Resolve a `?partner=<slug>` introduction request to the partner being asked for.
 *
 * Returns null for an unknown or stale slug: /contact then falls back to the generic
 * form rather than erroring. A bad link should never punish the buyer holding it.
 */
export async function fetchPartnerIntroduction(
	slug: string | null | undefined
): Promise<PartnerIntroduction | null> {
	if (!slug) return null;

	const raw = await fetchPublic<{
		name?: string | null;
		slug?: string | null;
		categories?: Array<string | null> | null;
	} | null>(partnerBySlugQuery, { params: { slug } });

	if (!raw?.name || !raw.slug) return null;

	return {
		name: raw.name,
		slug: raw.slug,
		categories: cleanCategoryNames(raw.categories)
	};
}

/** Fetch partners that have a logo, shaped for the homepage Trusted Partners wall. */
export async function fetchHomepagePartnerLogos(
	limit: number = HOMEPAGE_PARTNER_LOGOS_LIMIT
): Promise<TrustedPartner[]> {
	const raw = await fetchPublic<RawLogoPartner[]>(homepagePartnerLogosQuery, { params: { limit } });
	return (raw ?? [])
		.map((partner): TrustedPartner | null => {
			if (!partner.slug || !partner.name) return null;
			const logo = toPartnerLogo(partner.logo, partner.name);
			if (!logo) return null;
			const categoryLabel = partnerCategoryLabel(cleanCategoryNames(partner.categories));
			return {
				name: partner.name,
				role: partner.name,
				category: categoryLabel || undefined,
				logo: logo.url,
				srcset: logo.srcset,
				href: `/partners#partner-${partner.slug}`
			};
		})
		.filter((partner): partner is TrustedPartner => partner != null);
}
