import type { SchemaTypeDefinition } from 'sanity';

import { contentFields, featureHighlight } from './contentFields';
import { guideCallout, guideKeyFigures, guideSection } from './guideContent';
import {
	insightCardGrid,
	insightCardGridItem,
	insightCtaCallout,
	insightFaq,
	insightFaqItem,
	insightFigure,
	insightHeroNote,
	insightPullQuote,
	insightSection,
	insightTakeaways,
	insightTakeawayItem
} from './insightContent';
import { footerColumn, socialLink } from './footerNav';
import { navLink, navMenuChild, navMenuItem } from './headerNav';
import { instagramPost, instagramPostImage } from './instagramPost';
import { marketingFields } from './marketingFields';
import { ctaFields } from './ctaFields';
import { golfFields } from './golfFields';
import {
	internalCommission,
	internalFeesTax,
	internalFields,
	internalSourceEntry
} from './internalFields';
import { locationFields } from './locationFields';
import { mediaAssetMetadata } from './mediaAssetMetadata';
import { galleryGroup, mediaFields } from './mediaFields';
import { pricingFields } from './pricingFields';
import { propertyContentFields } from './propertyContentFields';
import { propertyMediaFields } from './propertyMediaFields';
import { propertyPricingFields } from './propertyPricingFields';
import { frontlineContent } from './frontlineContent';
import { homepageContent } from './homepageContent';
import { relatedContentFields } from './relatedContentFields';
import { reviewItem } from './reviewItem';
import { seoFields } from './seoFields';
import { specsFields } from './specsFields';

/** Shared object schemas referenced by document types. */
export const objectTypes: SchemaTypeDefinition[] = [
	// Supporting nested objects (registered before parents that reference them)
	featureHighlight,
	galleryGroup,
	reviewItem,
	mediaAssetMetadata,
	internalSourceEntry,
	internalCommission,
	internalFeesTax,
	// Instagram post selection (image member registered before the parent object)
	instagramPostImage,
	instagramPost,
	// Guide content objects (registered before the guideSection that nests them)
	guideCallout,
	guideKeyFigures,
	guideSection,
	// Insight content objects (blocks registered before the insightSection that nests them)
	insightHeroNote,
	insightFigure,
	insightCardGridItem,
	insightCardGrid,
	insightPullQuote,
	insightTakeawayItem,
	insightTakeaways,
	insightFaqItem,
	insightFaq,
	insightCtaCallout,
	insightSection,
	// Header navigation (navLink registered before the items that nest it)
	navLink,
	navMenuChild,
	navMenuItem,
	// Footer (reuses navMenuChild for its links, so registered after it)
	footerColumn,
	socialLink,
	// Page-level editorial objects
	homepageContent,
	frontlineContent,
	// Primary field groups
	locationFields,
	pricingFields,
	propertyPricingFields,
	specsFields,
	golfFields,
	contentFields,
	propertyContentFields,
	marketingFields,
	mediaFields,
	propertyMediaFields,
	ctaFields,
	relatedContentFields,
	seoFields,
	internalFields
];

export {
	frontlineContent,
	homepageContent,
	reviewItem,
	contentFields,
	marketingFields,
	ctaFields,
	featureHighlight,
	galleryGroup,
	guideCallout,
	guideKeyFigures,
	guideSection,
	insightHeroNote,
	insightFigure,
	insightCardGridItem,
	insightCardGrid,
	insightPullQuote,
	insightTakeawayItem,
	insightTakeaways,
	insightFaqItem,
	insightFaq,
	insightCtaCallout,
	insightSection,
	footerColumn,
	socialLink,
	golfFields,
	instagramPost,
	instagramPostImage,
	internalCommission,
	internalFeesTax,
	internalFields,
	internalSourceEntry,
	locationFields,
	mediaAssetMetadata,
	mediaFields,
	navLink,
	navMenuChild,
	navMenuItem,
	pricingFields,
	propertyContentFields,
	propertyMediaFields,
	propertyPricingFields,
	seoFields,
	specsFields
};
