import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '../image';
import type { MediaAssetInput } from './mediaFilter';
import type { InsightDestinationCardRaw } from '$lib/insights/types';

/**
 * A destination panel resolved for render. Identity (name, hub href, fallback image) comes from
 * the canonical location; the article contributes the body, an optional image override + caption,
 * and an optional CTA label. A card that cannot resolve a name, a link and an image is dropped
 * (fails closed) rather than emitting an empty panel or a dead link.
 */
export type InsightDestinationCard = {
	name: string;
	href: string;
	image: string;
	srcset: string;
	lqip: string | null;
	alt: string;
	caption: string | null;
	body: string;
	actionLabel: string;
};

// The panel image is a wide-ish plate (≈44% column, 360px tall). Both dimensions are passed so
// every srcset candidate shares one crop ratio.
const PANEL_IMAGE = { width: 1000, height: 720, fit: 'crop' as const, quality: 68 };
const PANEL_WIDTHS = [480, 640, 800, 1000, 1200];

/** The location hub URL, e.g. `/portugal/vilamoura`. Both segments are required. */
function locationHubHref(countrySlug?: string | null, slug?: string | null): string | null {
	if (!countrySlug || !slug) return null;
	return `/${countrySlug}/${slug}`;
}

export function toInsightDestinationCard(
	raw: InsightDestinationCardRaw | null | undefined
): InsightDestinationCard | null {
	if (!raw) return null;

	const location = raw.location;
	const name = location?.name?.trim();
	const body = raw.body?.trim();
	if (!name || !body) return null;

	// Article override wins for this article only; otherwise the location's canonical hero.
	const asset: MediaAssetInput | null | undefined = raw.imageOverride ?? location?.heroImage;
	const image = asset ? buildPublicImageUrl(asset, PANEL_IMAGE) : null;
	if (!image) return null;

	// An explicit override wins; otherwise the canonical location hub URL.
	const href = raw.actionHrefOverride?.trim() || locationHubHref(location?.countrySlug, location?.slug);
	if (!href) return null;

	return {
		name,
		href,
		image,
		srcset: buildImageSrcset(asset, PANEL_WIDTHS, PANEL_IMAGE),
		lqip: getImagePlaceholder(asset),
		alt: asset?.altText?.trim() || name,
		caption: raw.caption?.trim() || null,
		body,
		actionLabel: raw.actionLabel?.trim() || `See ${name} properties`
	};
}

export function toInsightDestinationCards(
	items: Array<InsightDestinationCardRaw | null | undefined> | null | undefined
): InsightDestinationCard[] {
	return (items ?? [])
		.map(toInsightDestinationCard)
		.filter((card): card is InsightDestinationCard => Boolean(card));
}
