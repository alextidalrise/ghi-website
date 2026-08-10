import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '../image';
import type { MediaAssetInput } from './mediaFilter';
import { buildGolfCourseHref } from './golfCourse';

/**
 * One projected course item: the article's optional image/alt/CTA overrides plus the dereferenced
 * canonical golf course. The course owns its name, route (built from the community's parent chain)
 * and destination; only the image and the CTA label can be article-owned.
 */
export type InsightCourseGridItemRaw = {
	_key?: string;
	altOverride?: string | null;
	actionLabel?: string | null;
	imageOverride?: MediaAssetInput | null;
	golfCourse?: {
		_id?: string | null;
		name?: string | null;
		slug?: string | null;
		tagline?: string | null;
		communityName?: string | null;
		communitySlug?: string | null;
		locationSlug?: string | null;
		countryName?: string | null;
		countrySlug?: string | null;
		media?: MediaAssetInput | null;
	} | null;
};

/**
 * A course resolved for the article grid. Name, route and destination come from the live record;
 * only the image (optionally) and the CTA label are article-owned. A card that cannot resolve a
 * name, a canonical route and an image is dropped (fails closed) rather than rendered dead.
 */
export type InsightCourseCard = {
	_id: string;
	name: string;
	href: string;
	image: string;
	srcset: string;
	lqip: string | null;
	alt: string;
	placeLabel: string | null;
	tagline: string | null;
	actionLabel: string;
};

// A landscape plate (≈half column, 3:2). Both dimensions are passed so every srcset candidate
// shares one crop ratio.
const CARD_IMAGE = { width: 900, height: 600, fit: 'crop' as const, quality: 66 };
const CARD_WIDTHS = [480, 640, 800, 900];

export function toInsightCourseCard(
	raw: InsightCourseGridItemRaw | null | undefined
): InsightCourseCard | null {
	const course = raw?.golfCourse;
	const name = course?.name?.trim();
	if (!course?._id || !name) return null;

	// The whole card links to the canonical course page; without a resolvable route it is dropped.
	const href = buildGolfCourseHref({
		countrySlug: course.countrySlug,
		locationSlug: course.locationSlug,
		communitySlug: course.communitySlug,
		courseSlug: course.slug
	});
	if (!href) return null;

	// Article override wins for this card only; otherwise the course's own first image.
	const asset: MediaAssetInput | null | undefined = raw?.imageOverride ?? course.media;
	const image = asset ? buildPublicImageUrl(asset, CARD_IMAGE) : null;
	if (!image) return null;

	const placeLabel =
		[course.communityName?.trim(), course.countryName?.trim()].filter(Boolean).join(', ') || null;

	return {
		_id: course._id,
		name,
		href,
		image,
		srcset: buildImageSrcset(asset, CARD_WIDTHS, CARD_IMAGE),
		lqip: getImagePlaceholder(asset),
		alt: raw?.altOverride?.trim() || asset?.altText?.trim() || name,
		placeLabel,
		tagline: course.tagline?.trim() || null,
		actionLabel: raw?.actionLabel?.trim() || 'View course'
	};
}

export function toInsightCourseCards(
	items: Array<InsightCourseGridItemRaw | null | undefined> | null | undefined
): InsightCourseCard[] {
	return (items ?? [])
		.map(toInsightCourseCard)
		.filter((card): card is InsightCourseCard => Boolean(card));
}
