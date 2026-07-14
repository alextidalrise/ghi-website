import { defineQuery } from 'groq';
import { PARTNER_CATEGORY_PUBLIC, PARTNER_LOGO_PUBLIC } from '../allowlists';
import { buildImageSrcset, buildPublicImageUrl } from '../image';
import { fetchPublic } from './fetch';
import type { MediaAssetInput } from '../transforms/mediaFilter';
import type {
	Partner,
	PartnerCategory,
	PartnerIntroduction,
	PartnerLogo
} from '$lib/partners/partners';
import type { TrustedPartner } from '$lib/components/home/TrustedPartners.svelte';

/** Widths the logo CDN crops are generated at; the cell caps the rendered height. */
const LOGO_WIDTHS = [160, 240, 320, 480];

/** All partner categories that have at least one partner, in display order. */
export const partnerCategoriesQuery = defineQuery(`
  *[
    _type == "partnerCategory"
    && defined(slug.current)
    && count(*[_type == "partner" && references(^._id) && defined(slug.current)]) > 0
  ] | order(coalesce(order, 999) asc, name asc) ${PARTNER_CATEGORY_PUBLIC}
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
    "category": category->name
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
	category?: string | null;
	logo?: MediaAssetInput | null;
};

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

function toPartner(raw: RawPartner): Partner | null {
	if (!raw.slug || !raw.name) return null;
	return {
		slug: raw.slug,
		name: raw.name,
		coverage: raw.coverage ?? '',
		description: raw.description ?? '',
		logo: toPartnerLogo(raw.logo, raw.name)
	};
}

function toCategory(raw: RawCategory): PartnerCategory | null {
	if (!raw.id || !raw.name) return null;
	const partners = (raw.partners ?? [])
		.map(toPartner)
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

/** Fetch the partner directory (categories with their partners) for /partners. */
export async function fetchPartnerCategories(): Promise<PartnerCategory[]> {
	const raw = await fetchPublic<RawCategory[]>(partnerCategoriesQuery);
	return (raw ?? [])
		.map(toCategory)
		.filter((category): category is PartnerCategory => category != null);
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
		category?: string | null;
	} | null>(partnerBySlugQuery, { params: { slug } });

	if (!raw?.name || !raw.slug) return null;

	return {
		name: raw.name,
		slug: raw.slug,
		category: raw.category?.trim() || null
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
			return {
				name: partner.name,
				role: partner.name,
				category: partner.category?.trim() || undefined,
				logo: logo.url,
				srcset: logo.srcset,
				href: `/partners#partner-${partner.slug}`
			};
		})
		.filter((partner): partner is TrustedPartner => partner != null);
}
