import type { SchemaTypeDefinition } from 'sanity';

import { contentFields, featureHighlight } from './contentFields';
import { guideCallout, guideKeyFigures, guideSection } from './guideContent';
import { marketingChannelNotes, marketingFields } from './marketingFields';
import { ctaFields, enquiryRouting } from './ctaFields';
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
import { relatedContentFields } from './relatedContentFields';
import { reviewItem } from './reviewItem';
import { seoFields } from './seoFields';
import { specsFields } from './specsFields';

/** Shared object schemas referenced by document types. */
export const objectTypes: SchemaTypeDefinition[] = [
	// Supporting nested objects (registered before parents that reference them)
	featureHighlight,
	galleryGroup,
	enquiryRouting,
	reviewItem,
	mediaAssetMetadata,
	internalSourceEntry,
	internalCommission,
	internalFeesTax,
	marketingChannelNotes,
	// Guide content objects (registered before the guideSection that nests them)
	guideCallout,
	guideKeyFigures,
	guideSection,
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
	reviewItem,
	contentFields,
	marketingFields,
	marketingChannelNotes,
	ctaFields,
	enquiryRouting,
	featureHighlight,
	galleryGroup,
	guideCallout,
	guideKeyFigures,
	guideSection,
	golfFields,
	internalCommission,
	internalFeesTax,
	internalFields,
	internalSourceEntry,
	locationFields,
	mediaAssetMetadata,
	mediaFields,
	pricingFields,
	propertyContentFields,
	propertyMediaFields,
	propertyPricingFields,
	seoFields,
	specsFields
};
