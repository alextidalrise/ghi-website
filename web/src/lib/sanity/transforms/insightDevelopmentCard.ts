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
	/** How the date should read (month/quarter/year). Unset → inferred from the date. */
	completionPrecision?: CompletionPrecision | null;
	/** Free-text completion line that replaces the derived one (e.g. a phased build). */
	completionNote?: string | null;
};

/** The editor's choice for how precisely a completion date is known. */
export type CompletionPrecision = 'month' | 'quarter' | 'year';

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

// Fixed month names indexed by getUTCMonth(), so the label is timezone-stable (Intl on a bare Date
// formats in local time, which can slip a UTC date to the previous month).
const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

/**
 * A completion line derived from controlled data — never a year inferred from status.
 *
 * The editor's `completionPrecision` chooses how the date reads: `month` → "July 2028",
 * `quarter` → "Q1 2028", `year` → "2028". When it is unset the precision is INFERRED from the date,
 * preserving the long-standing convention: a 1 January value is the CMS's "just the year is known"
 * placeholder (reads year-only), any other day reads as its quarter. Nothing renders when the
 * development is already available or carries no completion date.
 */
export function formatCompletionLabel(
	developmentStatus: string | null | undefined,
	completionDateISO: string | null | undefined,
	completionPrecision?: CompletionPrecision | null
): string | null {
	if (developmentStatus === 'completed') return null;
	if (!completionDateISO) return null;
	const d = new Date(completionDateISO);
	if (Number.isNaN(d.getTime())) return null;
	const year = d.getUTCFullYear();

	// Unset → infer: 1 January is the year-only placeholder, otherwise the day's quarter.
	const precision: CompletionPrecision =
		completionPrecision ??
		(d.getUTCMonth() === 0 && d.getUTCDate() === 1 ? 'year' : 'quarter');

	if (precision === 'year') return `Estimated completion: ${year}`;
	if (precision === 'month') return `Estimated completion: ${MONTH_NAMES[d.getUTCMonth()]} ${year}`;
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
	// A completion note is an editor's explicit override for timing a single date can't express
	// (a phased build). It wins over the derived line — but never for a completed development, which
	// shows no completion line at all ("Available now" says it).
	const completionNote = raw?.completionNote?.trim();
	const completionLabel =
		completionNote && base.developmentStatus !== 'completed'
			? completionNote
			: formatCompletionLabel(base.developmentStatus, raw?.completionDate, raw?.completionPrecision);

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
