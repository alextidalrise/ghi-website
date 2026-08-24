import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '../image';
import { CARD_HERO_IMAGE, toPublicPropertyCard, type RawPropertyCard } from './propertyCard';
import type { MediaAssetInput } from './mediaFilter';
import { buildListingHref } from '$lib/listing/canonicalPath';
import { resolveCardLocationLine } from '$lib/listing/cardLocationLine';
import { formatListingPrice } from '$lib/listing/formatPrice';

/** One projected listing item: article overrides plus the publish-gated canonical property card row. */
export type InsightListingGridItemRaw = {
	_key?: string;
	altOverride?: string | null;
	groupLabelOverride?: string | null;
	imageOverride?: MediaAssetInput | null;
	listing?: RawPropertyCard | null;
};

/**
 * A property resolved for the article grid. Every commercial field is derived from the live
 * record; only the image (optionally) and the group label are article-owned. A card without a
 * title or a resolvable route is dropped rather than rendered dead. This is the single-home
 * counterpart to `InsightDevelopmentCard`: no development status or completion line (a listing has
 * neither), a specs line (beds · baths) in their place.
 */
export type InsightListingCard = {
	_id: string;
	title: string;
	href: string;
	locationLabel: string | null;
	countryLabel: string | null;
	price: string | null;
	specsLabel: string | null;
	image: string | null;
	srcset: string;
	alt: string;
	lqip: string | null;
	/** Destination heading this card groups under on mobile. */
	groupLabel: string;
};

/** A destination group for the mobile grouped view. Desktop ignores groups and renders flat. */
export type InsightListingGroup = {
	label: string;
	cards: InsightListingCard[];
};

/** Beds · baths, the same compact spec line the site's own property card shows. */
function formatSpecsLabel(specs: RawPropertyCard['specs']): string | null {
	if (!specs) return null;
	const parts: string[] = [];
	if (specs.bedrooms != null) parts.push(`${specs.bedrooms} bed`);
	if (specs.bathrooms != null) parts.push(`${specs.bathrooms} bath`);
	return parts.length > 0 ? parts.join(' · ') : null;
}

export function toInsightListingCard(
	raw: InsightListingGridItemRaw | null | undefined
): InsightListingCard | null {
	const listing = raw?.listing;
	if (!listing?._id) return null;

	const base = toPublicPropertyCard(listing);
	const title = base.title?.trim();
	if (!title) return null;

	const href = buildListingHref({
		slug: base.slug,
		countrySlug: base.countrySlug,
		locationSlug: base.locationSlug,
		communitySlug: base.communitySlug,
		isCatchAll: base.isCatchAll,
		location: base.location
	});
	if (!href) return null;

	// Article override wins for this card only; otherwise the property's canonical hero.
	const override = raw?.imageOverride ?? null;
	const image = override ? buildPublicImageUrl(override, CARD_HERO_IMAGE) : base.heroImageUrl;
	const srcset = override ? buildImageSrcset(override, [400, 600, 800, 1000], CARD_HERO_IMAGE) : '';
	const lqip = override ? getImagePlaceholder(override) : base.heroImageLqip;
	const alt =
		raw?.altOverride?.trim() ||
		(override ? override.altText?.trim() : base.heroImageAlt) ||
		title;

	const price = formatListingPrice(base.pricing);

	// The single line shown beneath the title: prefers the resort/community, then the wider area,
	// skipping any segment that just echoes the title (some Murcia/Alicante listings borrow their
	// community as the title). The country reads on the muted line below it, mirroring the dev card.
	const locationLabel = resolveCardLocationLine(base.location, title);
	const countryLabel = base.location?.country?.name ?? null;
	// Group by the resort on mobile so several homes in one resort collapse together; the location
	// line above may resolve to the wider area, but the grouping wants the tightest destination.
	const groupLabel =
		raw?.groupLabelOverride?.trim() ||
		base.location?.community?.name ||
		base.location?.location?.name ||
		countryLabel ||
		'Other';

	const specsLabel = formatSpecsLabel(base.specs);

	return {
		_id: base._id,
		title,
		href,
		locationLabel,
		countryLabel,
		price,
		specsLabel,
		image,
		srcset,
		alt,
		lqip,
		groupLabel
	};
}

export function toInsightListingCards(
	items: Array<InsightListingGridItemRaw | null | undefined> | null | undefined
): InsightListingCard[] {
	return (items ?? [])
		.map(toInsightListingCard)
		.filter((card): card is InsightListingCard => Boolean(card));
}

/**
 * Group resolved cards by destination, preserving first-seen order (both of groups and of cards
 * within a group). The mobile view renders these; desktop renders the flat card list.
 */
export function toInsightListingGroups(
	items: Array<InsightListingGridItemRaw | null | undefined> | null | undefined
): InsightListingGroup[] {
	const groups: InsightListingGroup[] = [];
	const byLabel = new Map<string, InsightListingGroup>();
	for (const card of toInsightListingCards(items)) {
		let group = byLabel.get(card.groupLabel);
		if (!group) {
			group = { label: card.groupLabel, cards: [] };
			byLabel.set(card.groupLabel, group);
			groups.push(group);
		}
		group.cards.push(card);
	}
	return groups;
}
