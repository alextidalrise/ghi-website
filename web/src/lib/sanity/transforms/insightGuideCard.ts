import { guidePath } from '$lib/guides/routes';

/**
 * One projected guide card: the article's optional summary override plus the dereferenced canonical
 * guide. Title, audience label and route come from the guide record; only the replacement summary
 * is article-owned. These are live-text cards — no text is ever baked into an image.
 */
export type InsightGuideCardItemRaw = {
	_key?: string;
	summaryOverride?: string | null;
	guide?: {
		_id?: string | null;
		title?: string | null;
		slug?: string | null;
		audienceLabel?: string | null;
		tagline?: string | null;
	} | null;
};

/**
 * A guide resolved for the closing pair. A card that cannot resolve a title and a slug is dropped
 * (fails closed) rather than rendered as a dead link.
 */
export type InsightGuideCard = {
	_id: string;
	title: string;
	href: string;
	audienceLabel: string | null;
	summary: string | null;
};

export function toInsightGuideCard(
	raw: InsightGuideCardItemRaw | null | undefined
): InsightGuideCard | null {
	const guide = raw?.guide;
	const title = guide?.title?.trim();
	const slug = guide?.slug?.trim();
	if (!guide?._id || !title || !slug) return null;

	return {
		_id: guide._id,
		title,
		href: guidePath(slug),
		audienceLabel: guide.audienceLabel?.trim() || null,
		summary: raw?.summaryOverride?.trim() || guide.tagline?.trim() || null
	};
}

export function toInsightGuideCards(
	items: Array<InsightGuideCardItemRaw | null | undefined> | null | undefined
): InsightGuideCard[] {
	return (items ?? [])
		.map(toInsightGuideCard)
		.filter((card): card is InsightGuideCard => Boolean(card));
}
