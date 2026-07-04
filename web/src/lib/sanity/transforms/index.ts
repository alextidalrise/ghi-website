import {
	filterMediaAsset,
	filterMediaAssetList,
	filterMediaBundle,
	type MediaAssetInput,
	type MediaBundleInput
} from './mediaFilter';
import { stripInternalLocationFields, type GeoPoint, type LocationMapInput } from './mapPrivacy';
import { filterPublicPricing, type PricingInput, type PublicPricing } from './pricingFilter';
import {
	filterDisplayableUnits,
	filterReservedUnitTypes,
	filterReservedUnits,
	type UnitLike
} from './reservedFilter';
import type { PortableTextBlock } from '@portabletext/types';

type FeatureHighlight = {
	label?: string | null;
	value?: string | null;
	category?: string | null;
	isFilterable?: boolean | null;
	isHighlighted?: boolean | null;
};

type SeoInput = {
	seoTitle?: string | null;
	metaDescription?: string | null;
	openGraphTitle?: string | null;
	openGraphDescription?: string | null;
	openGraphImage?: Parameters<typeof filterMediaAsset>[0] | null;
	noindex?: boolean | null;
	schemaType?: string | null;
	backLinks?: Array<{ label?: string | null; url?: string | null }> | null;
	supportingArticles?: unknown;
	primaryKeyword?: string | null;
	secondaryKeywords?: unknown;
	canonicalCluster?: unknown;
};

type RelatedInput = {
	similarPropertiesMode?: string | null;
	manualSimilarProperties?: unknown;
	similarityTags?: unknown;
};

type CtaInput = {
	primaryCtaLabel?: string | null;
	secondaryCtaLabel?: string | null;
	formIntroText?: string | null;
	responseTimeText?: string | null;
	brochureCtaText?: string | null;
	brochureCtaEnabled?: boolean | null;
};

type GolfCourseRef = {
	_id?: string;
	name?: string | null;
	slug?: string | null;
	shortDescription?: string | null;
	/** Short positioning line ("the short line" teased under the course name). */
	tagline?: string | null;
	holes?: number | null;
	par?: number | null;
	designStyle?: string | null;
	/** Exact course GPS point, surfaced for area-map pins (see GOLF_PUBLIC). */
	coordinates?: GeoPoint | null;
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
};

type GolfInput = {
	golfRelevance?: string | null;
	linkedGolfCourses?: GolfCourseRef[] | null;
};

type ContentInput = {
	shortDescription?: string | null;
	aboutDescription?: PortableTextBlock[] | null;
	locationDescription?: PortableTextBlock[] | null;
	golfDescription?: PortableTextBlock[] | null;
	featureHighlights?: FeatureHighlight[] | null;
	amenities?: string[] | null;
	humanReviewed?: boolean | null;
	reviewer?: string | null;
	reviewDate?: string | null;
};

export type RawPropertyListing = {
	_id?: string;
	_type?: 'propertyListing';
	ghiListingId?: string;
	title?: string;
	slug?: string;
	listingKind?: string;
	propertyType?: string;
	transactionType?: string;
	status?: string;
	location?: LocationMapInput | null;
	pricing?: PricingInput | null;
	specs?: Record<string, unknown> | null;
	media?: MediaBundleInput | null;
	related?: RelatedInput | null;
	seo?: SeoInput | null;
	ctas?: CtaInput | null;
	golf?: GolfInput | null;
	content?: ContentInput | null;
};

export type PublicSeo = {
	seoTitle?: string | null;
	metaDescription?: string | null;
	openGraphTitle?: string | null;
	openGraphDescription?: string | null;
	openGraphImage: ReturnType<typeof filterMediaAsset> | null;
	noindex?: boolean | null;
	schemaType?: string | null;
	backLinks?: Array<{ label?: string | null; url?: string | null }> | null;
	supportingArticles?: unknown;
};

export type PublicRelated = {
	similarPropertiesMode?: string | null;
};

export type PublicCta = CtaInput;

// The golf object no longer carries internal enrichment fields, so every field
// is public — no filtering needed beyond the null guard in filterGolfFields.
export type PublicGolf = GolfInput;

export type PublicContent = Omit<ContentInput, 'humanReviewed' | 'reviewer' | 'reviewDate'>;

export type RawDevelopment = {
	_id?: string;
	_type?: 'development';
	ghiListingId?: string;
	developmentName?: string;
	title?: string;
	slug?: string;
	listingKind?: string;
	status?: string;
	developmentDisplayMode?:
		| 'flat_listing'
		| 'unit_types'
		| 'units'
		| 'price_from_summary'
		| 'enquiry_led'
		| string;
	developmentStatus?: string | null;
	buildStatus?: string | null;
	completionDate?: string | null;
	completionStatus?: string | null;
	developerName?: string | null;
	architectureStudio?: string | null;
	developmentComposition?: string[] | null;
	availabilitySummary?: string | null;
	sharedAmenities?: FeatureHighlight[] | null;
	location?: LocationMapInput | null;
	pricing?: PricingInput | null;
	media?: MediaBundleInput | null;
	related?: RelatedInput | null;
	seo?: SeoInput | null;
	ctas?: CtaInput | null;
	golf?: GolfInput | null;
	content?: ContentInput | null;
	units?: UnitLike[] | null;
	unitTypes?: UnitLike[] | null;
	sharedGallery?: Parameters<typeof filterMediaAssetList>[0] | null;
};

export type PublicPropertyListing = Omit<
	RawPropertyListing,
	'location' | 'pricing' | 'media' | 'related' | 'seo' | 'ctas' | 'golf' | 'content'
> & {
	location: ReturnType<typeof stripInternalLocationFields>;
	pricing: PublicPricing | null;
	media: ReturnType<typeof filterMediaBundle>;
	related: PublicRelated | null;
	seo: PublicSeo | null;
	ctas: PublicCta | null;
	golf: PublicGolf | null;
	content: PublicContent | null;
};

export type PublicDevelopment = Omit<
	RawDevelopment,
	'location' | 'pricing' | 'media' | 'related' | 'seo' | 'ctas' | 'golf' | 'content' | 'units' | 'unitTypes' | 'sharedGallery'
> & {
	location: ReturnType<typeof stripInternalLocationFields>;
	pricing: ReturnType<typeof filterPublicPricing>;
	media: ReturnType<typeof filterMediaBundle>;
	related: ReturnType<typeof filterRelatedFields>;
	seo: ReturnType<typeof filterSeoFields>;
	ctas: ReturnType<typeof filterCtaFields>;
	golf: ReturnType<typeof filterGolfFields>;
	content: ReturnType<typeof filterContentFields>;
	units: ReturnType<typeof transformDevelopmentUnits>;
	unitTypes: ReturnType<typeof transformDevelopmentUnitTypes>;
	sharedGallery: ReturnType<typeof filterMediaAssetList>;
};

export type DevelopmentDisplayMode = NonNullable<PublicDevelopment['developmentDisplayMode']>;

function filterSeoFields(seo: SeoInput | null | undefined): PublicSeo | null {
	if (!seo) {
		return null;
	}

	const {
		openGraphImage,
		primaryKeyword: _pk,
		secondaryKeywords: _sk,
		canonicalCluster: _cc,
		...publicSeo
	} = seo;

	return {
		...publicSeo,
		openGraphImage: filterMediaAsset(openGraphImage)
	};
}

function filterRelatedFields(related: RelatedInput | null | undefined): PublicRelated | null {
	if (!related) {
		return null;
	}

	const { manualSimilarProperties: _msp, similarityTags: _st, ...publicRelated } = related;
	return publicRelated;
}

function filterCtaFields(ctas: CtaInput | null | undefined): PublicCta | null {
	if (!ctas) {
		return null;
	}

	return ctas;
}

function filterGolfFields(golf: GolfInput | null | undefined): PublicGolf | null {
	if (!golf) {
		return null;
	}

	return golf;
}

function filterContentFields(content: ContentInput | null | undefined): PublicContent | null {
	if (!content) {
		return null;
	}

	const {
		humanReviewed: _reviewed,
		reviewer: _reviewer,
		reviewDate: _date,
		...publicContent
	} = content;

	return publicContent;
}

const CONTENT_LADDER_KEYS = [
	'shortDescription',
	'aboutDescription',
	'locationDescription',
	'golfDescription',
	'featureHighlights',
	'amenities'
] as const;

function contentValuePresent(value: unknown): boolean {
	if (value == null) return false;
	if (typeof value === 'string') return value.trim().length > 0;
	if (Array.isArray(value)) return value.length > 0;
	return true;
}

/**
 * Resolve a unit's editorial copy field-by-field across the inheritance ladder:
 * the unit's own content wins per field, else the unit type's, else the
 * development's. An empty string or empty array counts as "not set" so a partly
 * filled level still falls through for the fields it leaves blank.
 */
function mergeContentLadder(
	...levels: (ContentInput | null | undefined)[]
): PublicContent | null {
	const filtered = levels.map((content) => filterContentFields(content));
	const result: Partial<PublicContent> = {};
	let any = false;
	for (const key of CONTENT_LADDER_KEYS) {
		for (const level of filtered) {
			const value = level?.[key as keyof PublicContent];
			if (contentValuePresent(value)) {
				(result as Record<string, unknown>)[key] = value;
				any = true;
				break;
			}
		}
	}
	return any ? (result as PublicContent) : null;
}

function transformDevelopmentUnits(units: UnitLike[] | null | undefined) {
	// Keep reserved/sold-but-visible units so the inventory table can list them in a
	// locked row; only hidden/internal units are dropped here.
	return filterDisplayableUnits(units).map((unit) => ({
		...unit,
		pricing: filterPublicPricing(unit.pricing),
		floorplan: filterMediaAsset(unit.floorplan as Parameters<typeof filterMediaAsset>[0]),
		unitGallery: filterMediaAssetList(unit.unitGallery as Parameters<typeof filterMediaAssetList>[0])
	}));
}

function transformDevelopmentUnitTypes(unitTypes: UnitLike[] | null | undefined) {
	return filterReservedUnitTypes(unitTypes).map((unitType) => ({
		...unitType,
		pricing: filterPublicPricing(unitType.pricing),
		floorplans: filterMediaAssetList(unitType.floorplans as Parameters<typeof filterMediaAssetList>[0]),
		gallery: filterMediaAssetList(unitType.gallery as Parameters<typeof filterMediaAssetList>[0])
	}));
}

/** Apply all server-side transforms to a raw property listing query result. */
export function toPublicPropertyListing(raw: RawPropertyListing | null): PublicPropertyListing | null {
	if (!raw) {
		return null;
	}

	return {
		...raw,
		location: stripInternalLocationFields(raw.location),
		pricing: filterPublicPricing(raw.pricing),
		media: filterMediaBundle(raw.media),
		related: filterRelatedFields(raw.related),
		seo: filterSeoFields(raw.seo),
		ctas: filterCtaFields(raw.ctas),
		golf: filterGolfFields(raw.golf),
		content: filterContentFields(raw.content)
	};
}

/** Apply all server-side transforms to a raw development query result. */
export function toPublicDevelopment(raw: RawDevelopment | null): PublicDevelopment | null {
	if (!raw) {
		return null;
	}

	return {
		...raw,
		location: stripInternalLocationFields(raw.location),
		pricing: filterPublicPricing(raw.pricing),
		media: filterMediaBundle(raw.media),
		related: filterRelatedFields(raw.related),
		seo: filterSeoFields(raw.seo),
		ctas: filterCtaFields(raw.ctas),
		golf: filterGolfFields(raw.golf),
		content: filterContentFields(raw.content),
		units: transformDevelopmentUnits(raw.units),
		unitTypes: transformDevelopmentUnitTypes(raw.unitTypes),
		sharedGallery: filterMediaAssetList(raw.sharedGallery)
	};
}

/** Raw inheritable development context projected onto a unit (see DEVELOPMENT_CONTEXT_PUBLIC). */
type RawUnitDevelopmentContext = {
	_id?: string;
	ghiListingId?: string;
	developmentName?: string | null;
	title?: string | null;
	slug?: string | null;
	developmentStatus?: string | null;
	completionStatus?: string | null;
	completionDate?: string | null;
	developerName?: string | null;
	location?: LocationMapInput | null;
	pricing?: PricingInput | null;
	sharedAmenities?: FeatureHighlight[] | null;
	sharedGallery?: MediaAssetInput[] | null;
	media?: MediaBundleInput | null;
	content?: ContentInput | null;
	golf?: GolfInput | null;
	ctas?: CtaInput | null;
	related?: RelatedInput | null;
	seo?: SeoInput | null;
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	isCatchAll?: boolean | null;
};

type RawUnitType = {
	_id?: string;
	unitTypeName?: string | null;
	propertyType?: string | null;
	specs?: Record<string, unknown> | null;
	gallery?: MediaAssetInput[] | null;
	floorplans?: MediaAssetInput[] | null;
	content?: ContentInput | null;
};

export type RawUnitListing = {
	_id?: string;
	_type?: 'unit';
	ghiListingId?: string;
	unitName?: string | null;
	unitNumber?: string | null;
	slug?: string | null;
	listingKind?: string;
	floor?: number | null;
	phase?: string | null;
	pricing?: PricingInput | null;
	specs?: Record<string, unknown> | null;
	floorplan?: MediaAssetInput | null;
	unitGallery?: MediaAssetInput[] | null;
	content?: ContentInput | null;
	unitType?: RawUnitType | null;
	development?: RawUnitDevelopmentContext | null;
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	isCatchAll?: boolean | null;
	developmentSlug?: string | null;
	unitSlug?: string | null;
};

/** Canonical path segments needed to build a unit's nested URL and its dev breadcrumb. */
export type UnitCanonicalContext = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	isCatchAll?: boolean | null;
	developmentSlug?: string | null;
	unitSlug?: string | null;
	developmentTitle: string;
};

function titleCaseEnum(value: string | null | undefined): string {
	if (!value) return '';
	return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compose a unit-page h1: the unit's own name, qualified by its typology when distinct. */
function composeUnitTitle(unit: RawUnitListing): string {
	const baseName =
		unit.unitName?.trim() ||
		(unit.unitNumber ? `Unit ${unit.unitNumber}` : null) ||
		'Unit';
	const typeLabel = unit.unitType?.unitTypeName?.trim() || titleCaseEnum(unit.unitType?.propertyType);
	if (typeLabel && !baseName.toLowerCase().includes(typeLabel.toLowerCase())) {
		return `${baseName} · ${typeLabel}`;
	}
	return baseName;
}

/**
 * Synthesize a public property-listing payload for a unit page from three sources:
 * the unit (price, size, floor, number), its unit type (shared gallery + property
 * type), and its parent development (location, golf, editorial copy, CTAs, SEO base).
 * The result renders through the existing PropertyDetail template unchanged.
 */
export function toPublicUnitListing(
	raw: RawUnitListing | null
): { listing: PublicPropertyListing; context: UnitCanonicalContext } | null {
	if (!raw || !raw.development) {
		return null;
	}

	const dev = raw.development;
	const unitType = raw.unitType;

	// Image inheritance: a unit's own override gallery wins; otherwise the unit type's
	// shared gallery; otherwise fall back to the development's own imagery.
	const overrideGallery = filterMediaAssetList(raw.unitGallery);
	const typeGallery = filterMediaAssetList(unitType?.gallery);
	const devGallery = [
		...filterMediaAssetList(dev.sharedGallery),
		...filterMediaAssetList(dev.media?.gallery)
	];
	const gallery =
		overrideGallery.length > 0 ? overrideGallery : typeGallery.length > 0 ? typeGallery : devGallery;

	const floorplans = [
		...filterMediaAssetList(unitType?.floorplans),
		...(raw.floorplan ? filterMediaAssetList([raw.floorplan]) : [])
	];

	const mediaInput: MediaBundleInput = {
		gallery,
		floorplans,
		thumbnailOverride: dev.media?.thumbnailOverride ?? null,
		videoUrl: dev.media?.videoUrl ?? null,
		virtualTourUrl: dev.media?.virtualTourUrl ?? null,
		brochure: dev.media?.brochure ?? null,
		brochurePublic: dev.media?.brochurePublic ?? false
	};

	const specs = { ...(unitType?.specs ?? {}), ...(raw.specs ?? {}) };
	if (raw.floor != null) specs.floor = raw.floor;

	// Editorial copy inheritance: resolve each content field from the unit, else
	// its unit type, else the development.
	const content = mergeContentLadder(raw.content, unitType?.content, dev.content);

	const devSeo = filterSeoFields(dev.seo);
	const locationLabel =
		dev.location?.community?.name ?? dev.location?.location?.name ?? dev.developmentName ?? null;
	const composedTitle = composeUnitTitle(raw);
	const seoTitle = [composedTitle, dev.developmentName, locationLabel]
		.filter((part): part is string => Boolean(part))
		.join(', ');

	const seo: PublicSeo = {
		...(devSeo ?? { openGraphImage: null }),
		seoTitle,
		metaDescription:
			dev.seo?.metaDescription ?? content?.shortDescription ?? null,
		noindex: dev.seo?.noindex ?? false
	};

	const listing: PublicPropertyListing = {
		_id: raw._id,
		_type: 'propertyListing',
		ghiListingId: raw.ghiListingId,
		title: composedTitle,
		slug: raw.slug ?? undefined,
		listingKind: 'unit',
		propertyType: unitType?.propertyType ?? undefined,
		transactionType: 'sale',
		location: stripInternalLocationFields(dev.location),
		pricing: filterPublicPricing(raw.pricing),
		specs,
		media: filterMediaBundle(mediaInput),
		related: filterRelatedFields(dev.related),
		seo,
		ctas: filterCtaFields(dev.ctas),
		golf: filterGolfFields(dev.golf),
		content
	};

	const context: UnitCanonicalContext = {
		countrySlug: raw.countrySlug ?? dev.countrySlug,
		locationSlug: raw.locationSlug ?? dev.locationSlug,
		communitySlug: raw.communitySlug ?? dev.communitySlug,
		isCatchAll: raw.isCatchAll ?? dev.isCatchAll,
		developmentSlug: raw.developmentSlug ?? dev.slug,
		unitSlug: raw.unitSlug ?? raw.slug,
		developmentTitle: dev.title ?? dev.developmentName ?? 'Development'
	};

	return { listing, context };
}

export { filterMediaAsset, filterMediaAssetList, filterMediaBundle } from './mediaFilter';
export {
	FRONTLINE_HERO_DEFAULTS,
	resolveFrontlineHero,
	type FrontlineHeroContent,
	type FrontlineHeroImage,
	type FrontlineHeroInput
} from './frontlineHero';
export { transformMapPrivacy, stripInternalLocationFields } from './mapPrivacy';
export { filterPublicPricing } from './pricingFilter';
export {
	CARD_HERO_IMAGE,
	toPublicPropertyCard,
	type PublicPropertyCard,
	type PublicPropertyCardLocation,
	type PublicPropertyCardSpecs,
	type RawPropertyCard
} from './propertyCard';
export { filterReservedUnits, filterReservedUnitTypes } from './reservedFilter';
export {
	buildGolfCourseHref,
	buildGolfCourseRefHref,
	resolveGolfCourseHero,
	toGolfCourseCard,
	toGolfCourseCards,
	toPublicGolfCourse,
	type GolfCourseCardData,
	type GolfCourseHrefSegments,
	type PublicGolfCourse,
	type RawGolfCourse
} from './golfCourse';
