import { filterMediaAsset, filterMediaAssetList, filterMediaBundle, type MediaBundleInput } from './mediaFilter';
import { stripInternalLocationFields, type LocationMapInput } from './mapPrivacy';
import { filterPublicPricing, type PricingInput, type PublicPricing } from './pricingFilter';
import { filterReservedUnitTypes, filterReservedUnits, type UnitLike } from './reservedFilter';
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
	similarPropertiesMode?: string | null;
	backLinks?: Array<{ label?: string | null; url?: string | null }> | null;
	supportingArticles?: unknown;
	primaryKeyword?: string | null;
	secondaryKeywords?: unknown;
	canonicalCluster?: unknown;
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
	whatsAppEnabled?: boolean | null;
	whatsAppMessageTemplate?: string | null;
	enquiryRouting?: unknown;
};

type GolfCourseRef = {
	_id?: string;
	name?: string | null;
	slug?: string | null;
	shortDescription?: string | null;
};

type GolfInput = {
	golfRelevance?: string | null;
	primaryGolfCourse?: GolfCourseRef | null;
	linkedGolfCourses?: GolfCourseRef[] | null;
	distanceToPrimaryGolfCourse?: string | null;
	golfView?: boolean | null;
	buggyAccess?: boolean | null;
	golfMembershipInfo?: string | null;
	golfNotes?: string | null;
	golfEnrichmentStatus?: string | null;
	golfEnrichedBy?: string | null;
	golfEnrichedAt?: string | null;
};

type ContentInput = {
	shortDescription?: string | null;
	heroHeadline?: string | null;
	aboutDescription?: PortableTextBlock[] | null;
	longDescription?: PortableTextBlock[] | null;
	locationDescription?: PortableTextBlock[] | null;
	golfDescription?: PortableTextBlock[] | null;
	lifestyleDescription?: PortableTextBlock[] | null;
	featureHighlights?: FeatureHighlight[] | null;
	amenities?: string[] | null;
	investmentDescription?: PortableTextBlock[] | null;
	buyerFitNotes?: string | null;
	humanReviewed?: boolean | null;
	reviewer?: string | null;
	reviewDate?: string | null;
};

export type RawPropertyListing = {
	_id?: string;
	_type?: 'propertyListing';
	ghiListingId?: string;
	publicTitle?: string;
	slug?: string;
	listingKind?: string;
	propertyType?: string;
	transactionType?: string;
	location?: LocationMapInput | null;
	pricing?: PricingInput | null;
	specs?: Record<string, unknown> | null;
	media?: MediaBundleInput | null;
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
	similarPropertiesMode?: string | null;
	backLinks?: Array<{ label?: string | null; url?: string | null }> | null;
	supportingArticles?: unknown;
};

export type PublicCta = Omit<CtaInput, 'whatsAppMessageTemplate' | 'enquiryRouting'>;

export type PublicGolf = Omit<
	GolfInput,
	'golfNotes' | 'golfEnrichmentStatus' | 'golfEnrichedBy' | 'golfEnrichedAt'
>;

export type PublicContent = Omit<ContentInput, 'buyerFitNotes' | 'humanReviewed' | 'reviewer' | 'reviewDate'>;

export type RawDevelopment = {
	_id?: string;
	_type?: 'development';
	ghiListingId?: string;
	developmentName?: string;
	publicTitle?: string;
	slug?: string;
	listingKind?: string;
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
	brochureVisibility?: string | null;
	sharedAmenities?: FeatureHighlight[] | null;
	location?: LocationMapInput | null;
	pricing?: PricingInput | null;
	media?: MediaBundleInput | null;
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
	'location' | 'pricing' | 'media' | 'seo' | 'ctas' | 'golf' | 'content'
> & {
	location: ReturnType<typeof stripInternalLocationFields>;
	pricing: PublicPricing | null;
	media: ReturnType<typeof filterMediaBundle>;
	seo: PublicSeo | null;
	ctas: PublicCta | null;
	golf: PublicGolf | null;
	content: PublicContent | null;
};

export type PublicDevelopment = Omit<
	RawDevelopment,
	'location' | 'pricing' | 'media' | 'seo' | 'ctas' | 'golf' | 'content' | 'units' | 'unitTypes' | 'sharedGallery'
> & {
	location: ReturnType<typeof stripInternalLocationFields>;
	pricing: ReturnType<typeof filterPublicPricing>;
	media: ReturnType<typeof filterMediaBundle>;
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
		manualSimilarProperties: _msp,
		similarityTags: _st,
		...publicSeo
	} = seo;

	return {
		...publicSeo,
		openGraphImage: filterMediaAsset(openGraphImage)
	};
}

function filterCtaFields(ctas: CtaInput | null | undefined): PublicCta | null {
	if (!ctas) {
		return null;
	}

	const { whatsAppMessageTemplate: _wa, enquiryRouting: _er, ...publicCtas } = ctas;
	return publicCtas;
}

function filterGolfFields(golf: GolfInput | null | undefined): PublicGolf | null {
	if (!golf) {
		return null;
	}

	const {
		golfNotes: _notes,
		golfEnrichmentStatus: _status,
		golfEnrichedBy: _by,
		golfEnrichedAt: _at,
		...publicGolf
	} = golf;

	return publicGolf;
}

function filterContentFields(content: ContentInput | null | undefined): PublicContent | null {
	if (!content) {
		return null;
	}

	const {
		buyerFitNotes: _buyer,
		humanReviewed: _reviewed,
		reviewer: _reviewer,
		reviewDate: _date,
		...publicContent
	} = content;

	return publicContent;
}

function transformDevelopmentUnits(units: UnitLike[] | null | undefined) {
	return filterReservedUnits(units).map((unit) => ({
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
		seo: filterSeoFields(raw.seo),
		ctas: filterCtaFields(raw.ctas),
		golf: filterGolfFields(raw.golf),
		content: filterContentFields(raw.content),
		units: transformDevelopmentUnits(raw.units),
		unitTypes: transformDevelopmentUnitTypes(raw.unitTypes),
		sharedGallery: filterMediaAssetList(raw.sharedGallery)
	};
}

export { filterMediaAsset, filterMediaAssetList, filterMediaBundle } from './mediaFilter';
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
