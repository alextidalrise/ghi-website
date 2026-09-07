import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '../image';
import { isPublicMediaAsset, type MediaAssetInput } from './mediaFilter';

/**
 * One externally managed partner-property card as projected. Every field is article-owned — nothing
 * here dereferences a canonical GHI record — so the projection carries the render-ready shape
 * directly (no publish-gated entity to resolve). Internal approval fields (`sourceNote`,
 * `checkedAt`) are dropped at query time and never reach this type.
 */
export type InsightExternalPropertyCardRaw = {
	_key?: string;
	name?: string | null;
	location?: string | null;
	guests?: number | null;
	bedrooms?: number | null;
	fromPrice?: string | null;
	description?: string | null;
	features?: Array<string | null> | null;
	image?: MediaAssetInput | null;
	linkLabel?: string | null;
	linkHref?: string | null;
};

/**
 * A partner property resolved for the article grid. Every field is validated present and safe — an
 * invalid card (missing identity, image, alt text, facts or a non-HTTPS link) is dropped rather than
 * rendered with a `0`, an `undefined`, a broken image or an unsafe link. `fromPrice` stays a display
 * string: partner sources quote "per night", which is not a GHI inventory price.
 */
export type InsightExternalPropertyCard = {
	_key: string;
	name: string;
	location: string;
	guests: number;
	bedrooms: number;
	fromPrice: string;
	description: string;
	features: string[];
	image: string;
	srcset: string;
	alt: string;
	lqip: string | null;
	linkLabel: string;
	linkHref: string;
};

/** 3:2 card image, matching the site's own property-card hero render. */
const EXTERNAL_CARD_IMAGE = { width: 600, height: 400, fit: 'crop' as const, quality: 65 };

/** A positive integer, or null. Guards against `0`, negatives, floats and non-numbers reaching the card. */
function positiveInteger(value: number | null | undefined): number | null {
	return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/** Only absolute HTTPS URLs are safe to render as an outbound partner link. */
function isHttpsUrl(value: string | null | undefined): value is string {
	if (typeof value !== 'string') return false;
	try {
		return new URL(value).protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Resolve one raw card to a render-ready card, or `null` when any required piece is missing or
 * unsafe. Fails closed on: no name/location, a non-positive-integer guests or bedrooms count, no
 * from-price, no description, an image that fails the public gate or carries no alt text, a missing
 * link label, or a link that is not an absolute HTTPS URL.
 */
export function toInsightExternalPropertyCard(
	raw: InsightExternalPropertyCardRaw | null | undefined
): InsightExternalPropertyCard | null {
	if (!raw) return null;

	const name = raw.name?.trim();
	const location = raw.location?.trim();
	const fromPrice = raw.fromPrice?.trim();
	const description = raw.description?.trim();
	const linkLabel = raw.linkLabel?.trim();
	const guests = positiveInteger(raw.guests);
	const bedrooms = positiveInteger(raw.bedrooms);

	if (!name || !location || !fromPrice || !description || !linkLabel) return null;
	if (guests === null || bedrooms === null) return null;
	if (!isHttpsUrl(raw.linkHref)) return null;

	// The image must pass the public media gate and carry alt text — a decorative-only external
	// property card is not acceptable, and a blocked asset would render blank.
	const image = raw.image ?? null;
	const alt = image?.altText?.trim();
	if (!isPublicMediaAsset(image) || !alt) return null;

	const src = buildPublicImageUrl(image, EXTERNAL_CARD_IMAGE);
	if (!src) return null;

	const features = (raw.features ?? [])
		.map((f) => (typeof f === 'string' ? f.trim() : ''))
		.filter((f): f is string => f.length > 0)
		.slice(0, 3);

	return {
		_key: raw._key ?? name,
		name,
		location,
		guests,
		bedrooms,
		fromPrice,
		description,
		features,
		image: src,
		srcset: buildImageSrcset(image, [400, 600, 800, 1000], EXTERNAL_CARD_IMAGE),
		alt,
		lqip: getImagePlaceholder(image),
		linkLabel,
		linkHref: raw.linkHref
	};
}

/**
 * Resolve an ordered list of raw cards, preserving editor order and dropping any invalid card. Each
 * omission emits a `console.warn` (server logs during SSR; the test harness asserts on it) so an
 * editor can see which card fell out and why, while the remaining grid stays coherent.
 */
export function toInsightExternalPropertyCards(
	items: Array<InsightExternalPropertyCardRaw | null | undefined> | null | undefined
): InsightExternalPropertyCard[] {
	const cards: InsightExternalPropertyCard[] = [];
	(items ?? []).forEach((raw, index) => {
		const card = toInsightExternalPropertyCard(raw);
		if (card) {
			cards.push(card);
			return;
		}
		const label = raw?.name?.trim() || raw?._key || `#${index + 1}`;
		console.warn(
			`[insightExternalPropertyGrid] Omitted card ${label}: missing required identity, image, ` +
				`alt text, facts or an absolute HTTPS link.`
		);
	});
	return cards;
}
