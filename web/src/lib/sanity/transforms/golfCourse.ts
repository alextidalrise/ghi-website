import { buildImageSrcset, buildPublicImageUrl } from '../image';
import type { MediaAssetInput } from './mediaFilter';
import { filterMediaAsset, filterMediaAssetList } from './mediaFilter';
import { resolveTaxonomyHero, type TaxonomyHero } from './taxonomyHero';

const HERO_WIDTHS = [960, 1280, 1600, 1920, 2400];
const PAGE_HERO = { width: 1920, height: 1080, fit: 'crop' as const, quality: 85 };
const COURSE_CARD = { width: 600, height: 400, fit: 'crop' as const, quality: 82 };

export type GolfCourseCommunityRef = {
	_id?: string;
	name?: string | null;
	slug?: string | null;
	breadcrumbLabel?: string | null;
	locationSlug?: string | null;
	countrySlug?: string | null;
	parent?: {
		_id?: string;
		name?: string | null;
		slug?: string | null;
		breadcrumbLabel?: string | null;
	} | null;
	country?: {
		_id?: string;
		name?: string | null;
		slug?: string | null;
		breadcrumbLabel?: string | null;
	} | null;
};

export type RawGolfCourse = {
	_id?: string;
	name?: string | null;
	slug?: string | null;
	shortDescription?: string | null;
	tagline?: string | null;
	seoTitle?: string | null;
	metaDescription?: string | null;
	holes?: number | null;
	par?: number | null;
	designStyle?: string | null;
	websiteUrl?: string | null;
	media?: MediaAssetInput[] | null;
	community?: GolfCourseCommunityRef | null;
};

export type PublicGolfCourse = {
	_id: string;
	name: string;
	slug: string;
	shortDescription: string | null;
	tagline: string | null;
	seoTitle: string | null;
	metaDescription: string | null;
	holes: number | null;
	par: number | null;
	designStyle: string | null;
	websiteUrl: string | null;
	community: GolfCourseCommunityRef | null;
};

export type GolfCourseCardData = {
	name: string;
	href: string;
	image: string;
	alt: string;
	tagline: string | null;
	communityLabel: string | null;
	holes: number | null;
	par: number | null;
	designStyle: string | null;
};

export type GolfCourseHrefSegments = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	courseSlug?: string | null;
};

export function buildGolfCourseHref({
	countrySlug,
	locationSlug,
	communitySlug,
	courseSlug
}: GolfCourseHrefSegments): string | null {
	if (!countrySlug || !locationSlug || !communitySlug || !courseSlug) {
		return null;
	}

	return `/${countrySlug}/${locationSlug}/${communitySlug}/golf/${courseSlug}`;
}

function resolveGolfCourseHeroAsset(
	media: MediaAssetInput[] | null | undefined
): MediaAssetInput | null {
	const publicMedia = filterMediaAssetList(media);
	return filterMediaAsset(publicMedia[0] ?? null);
}

/** Full-bleed page hero for a golf course document. */
export function resolveGolfCourseHero(
	course: RawGolfCourse | null | undefined
): TaxonomyHero | null {
	const asset = resolveGolfCourseHeroAsset(course?.media);
	if (!asset) return null;

	const url = buildPublicImageUrl(asset, PAGE_HERO);
	if (!url) return null;

	return {
		url,
		srcset: buildImageSrcset(asset, HERO_WIDTHS, PAGE_HERO),
		alt: asset.altText?.trim() || course?.name || 'Golf course',
		tagline: course?.tagline?.trim() || null
	};
}

export function toPublicGolfCourse(raw: RawGolfCourse | null | undefined): PublicGolfCourse | null {
	if (!raw?._id || !raw.name || !raw.slug) {
		return null;
	}

	return {
		_id: raw._id,
		name: raw.name,
		slug: raw.slug,
		shortDescription: raw.shortDescription?.trim() || null,
		tagline: raw.tagline?.trim() || null,
		seoTitle: raw.seoTitle?.trim() || null,
		metaDescription: raw.metaDescription?.trim() || null,
		holes: raw.holes ?? null,
		par: raw.par ?? null,
		designStyle: raw.designStyle?.trim() || null,
		websiteUrl: raw.websiteUrl?.trim() || null,
		community: raw.community ?? null
	};
}

export function toGolfCourseCard(course: RawGolfCourse | null | undefined): GolfCourseCardData | null {
	if (!course?.name || !course.slug) {
		return null;
	}

	const community = course.community;
	const href = buildGolfCourseHref({
		countrySlug: community?.countrySlug,
		locationSlug: community?.locationSlug,
		communitySlug: community?.slug,
		courseSlug: course.slug
	});

	if (!href) {
		return null;
	}

	const asset = resolveGolfCourseHeroAsset(course.media);
	const image = asset ? buildPublicImageUrl(asset, COURSE_CARD) : null;
	if (!image) {
		return null;
	}

	return {
		name: course.name,
		href,
		image,
		alt: asset?.altText?.trim() || course.name,
		tagline: course.tagline?.trim() || course.shortDescription?.trim() || null,
		communityLabel: community?.name ?? null,
		holes: course.holes ?? null,
		par: course.par ?? null,
		designStyle: course.designStyle?.trim() || null
	};
}

export function toGolfCourseCards(
	courses: Array<RawGolfCourse | null | undefined> | null | undefined
): GolfCourseCardData[] {
	return (courses ?? [])
		.map(toGolfCourseCard)
		.filter((card): card is GolfCourseCardData => Boolean(card));
}

/** Build href for a golf course reference on a listing (partial path segments). */
export function buildGolfCourseRefHref(
	course: GolfCourseHrefSegments & { slug?: string | null; name?: string | null } | null | undefined
): string | null {
	if (!course) return null;

	return buildGolfCourseHref({
		countrySlug: course.countrySlug,
		locationSlug: course.locationSlug,
		communitySlug: course.communitySlug,
		courseSlug: course.slug
	});
}
