import { buildImageSrcset, buildPublicImageUrl } from '../image';
import type { MediaAssetInput } from './mediaFilter';

/**
 * One projected partner cell: the article's optional service label plus the dereferenced partner.
 * The projection uses PARTNER_LOGO_PUBLIC, which deliberately omits `referralUrl` — the partner's
 * own destination is the GHI team's internal handoff and must never reach the browser.
 */
export type InsightPartnerLogoItemRaw = {
	_key?: string;
	serviceLabel?: string | null;
	partner?: {
		_id?: string | null;
		name?: string | null;
		slug?: string | null;
		category?: string | null;
		logo?: MediaAssetInput | null;
	} | null;
};

/**
 * A partner resolved for the logo wall. Every cell links to the vetted-partner index, so the
 * introduction runs through GHI. A cell without a name, slug or logo is dropped (fails closed)
 * rather than rendered as an empty box or a dead link.
 */
export type InsightPartnerLogoCard = {
	_id: string;
	name: string;
	href: string;
	logo: string;
	srcset: string;
	alt: string;
	serviceLabel: string | null;
};

// Logos are contained (never cropped) in a fixed cell; `fit: 'max'` preserves each aspect ratio.
const LOGO_WIDTHS = [160, 240, 320, 480];

/** The vetted-partner index anchor. The buyer always arrives at GHI's own introduction request. */
function partnersIndexHref(slug: string): string {
	return `/partners#partner-${slug}`;
}

export function toInsightPartnerLogoCard(
	raw: InsightPartnerLogoItemRaw | null | undefined
): InsightPartnerLogoCard | null {
	const partner = raw?.partner;
	const name = partner?.name?.trim();
	const slug = partner?.slug?.trim();
	if (!partner?._id || !name || !slug) return null;

	// A logo wall with no logo has nothing to show, so the cell drops out.
	const logo = buildPublicImageUrl(partner.logo, { width: 320, fit: 'max' });
	if (!logo) return null;

	return {
		_id: partner._id,
		name,
		href: partnersIndexHref(slug),
		logo,
		srcset: buildImageSrcset(partner.logo, LOGO_WIDTHS, { fit: 'max' }),
		alt: partner.logo?.altText?.trim() || name,
		serviceLabel: raw?.serviceLabel?.trim() || partner.category?.trim() || null
	};
}

export function toInsightPartnerLogoCards(
	items: Array<InsightPartnerLogoItemRaw | null | undefined> | null | undefined
): InsightPartnerLogoCard[] {
	return (items ?? [])
		.map(toInsightPartnerLogoCard)
		.filter((card): card is InsightPartnerLogoCard => Boolean(card));
}
