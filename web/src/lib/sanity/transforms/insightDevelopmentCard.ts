import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '../image';
import { CARD_HERO_IMAGE } from './propertyCard';
import { toPublicDevelopmentCard, type RawDevelopmentCard } from './similarListingCard';
import type { MediaAssetInput } from './mediaFilter';
import { buildListingHref } from '$lib/listing/canonicalPath';
import { formatDevelopmentCardPrice } from '$lib/listing/developmentCardDisplay';
import { shouldShowDevelopmentPricing } from '$lib/listing/developmentDisplay';

/** One projected development item: article overrides plus the publish-gated canonical card row. */
export type InsightDevelopmentGridItemRaw = {
	_key?: string;
	altOverride?: string | null;
	groupLabelOverride?: string | null;
	imageOverride?: MediaAssetInput | null;
	development?: RawDevelopmentCard | null;
	/** Coalesced pricing/top-level completion date, gated with the reference. */
	completionDate?: string | null;
};

/**
 * A development resolved for the article grid. Every commercial field is derived from the live
 * record; only the image (optionally) and the group label are article-owned. A card without a
 * title or a resolvable route is dropped rather than rendered dead.
 */
export type InsightDevelopmentCard = {
	_id: string;
	title: string;
	href: string;
	locationLabel: string | null;
	countryLabel: string | null;
	price: string | null;
	statusLabel: string | null;
	completionLabel: string | null;
	image: string | null;
	srcset: string;
	alt: string;
	lqip: string | null;
	/** Destination heading this card groups under on mobile. */
	groupLabel: string;
};

/** A destination group for the mobile grouped view. Desktop ignores groups and renders flat. */
export type InsightDevelopmentGroup = {
	label: string;
	cards: InsightDevelopmentCard[];
};

// The controlled development status → the compact chip label. `unknown` (and anything unmapped)
// yields no chip, so an incomplete record degrades honestly instead of printing "Unknown".
const STATUS_LABELS: Record<string, string> = {
	completed: 'Available now',
	under_construction: 'Under construction',
	off_plan: 'Off plan'
};

/**
 * A completion line derived from controlled data — never a year inferred from status. Quarter+year
 * normally; year-only when the date is a January-1 placeholder (the CMS's "just the year" convention);
 * nothing when the development is already available or carries no completion date.
 */
export function formatCompletionLabel(
	developmentStatus: string | null | undefined,
	completionDateISO: string | null | undefined
): string | null {
	if (developmentStatus === 'completed') return null;
	if (!completionDateISO) return null;
	const d = new Date(completionDateISO);
	if (Number.isNaN(d.getTime())) return null;
	const year = d.getUTCFullYear();
	if (d.getUTCMonth() === 0 && d.getUTCDate() === 1) {
		return `Estimated completion: ${year}`;
	}
	const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
	return `Estimated completion: Q${quarter} ${year}`;
}

export function toInsightDevelopmentCard(
	raw: InsightDevelopmentGridItemRaw | null | undefined
): InsightDevelopmentCard | null {
	const dev = raw?.development;
	if (!dev?._id) return null;

	const base = toPublicDevelopmentCard(dev);
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

	// Article override wins for this card only; otherwise the development's canonical hero.
	const override = raw?.imageOverride ?? null;
	const image = override ? buildPublicImageUrl(override, CARD_HERO_IMAGE) : base.heroImageUrl;
	const srcset = override ? buildImageSrcset(override, [400, 600, 800, 1000], CARD_HERO_IMAGE) : '';
	const lqip = override ? getImagePlaceholder(override) : base.heroImageLqip;
	const alt =
		raw?.altOverride?.trim() ||
		(override ? override.altText?.trim() : base.heroImageAlt) ||
		title;

	const price = shouldShowDevelopmentPricing(base.developmentDisplayMode)
		? formatDevelopmentCardPrice(base.pricing)
		: null;

	// v15 shows the destination (location), not the community, plus the country.
	const locationLabel = base.location?.location?.name ?? base.location?.community?.name ?? null;
	const countryLabel = base.location?.country?.name ?? null;
	const groupLabel = raw?.groupLabelOverride?.trim() || locationLabel || countryLabel || 'Other';

	const statusLabel = base.developmentStatus ? (STATUS_LABELS[base.developmentStatus] ?? null) : null;
	const completionLabel = formatCompletionLabel(base.developmentStatus, raw?.completionDate);

	return {
		_id: base._id,
		title,
		href,
		locationLabel,
		countryLabel,
		price,
		statusLabel,
		completionLabel,
		image,
		srcset,
		alt,
		lqip,
		groupLabel
	};
}

export function toInsightDevelopmentCards(
	items: Array<InsightDevelopmentGridItemRaw | null | undefined> | null | undefined
): InsightDevelopmentCard[] {
	return (items ?? [])
		.map(toInsightDevelopmentCard)
		.filter((card): card is InsightDevelopmentCard => Boolean(card));
}

/**
 * Group resolved cards by destination, preserving first-seen order (both of groups and of cards
 * within a group). The mobile view renders these; desktop renders the flat card list.
 */
export function toInsightDevelopmentGroups(
	items: Array<InsightDevelopmentGridItemRaw | null | undefined> | null | undefined
): InsightDevelopmentGroup[] {
	const groups: InsightDevelopmentGroup[] = [];
	const byLabel = new Map<string, InsightDevelopmentGroup>();
	for (const card of toInsightDevelopmentCards(items)) {
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
