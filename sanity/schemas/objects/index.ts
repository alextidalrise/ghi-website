import type { SchemaTypeDefinition } from 'sanity';

import { contentFields, featureHighlight } from './contentFields';
import { guideCallout, guideKeyFigures, guideSection } from './guideContent';
import { marketingChannelNotes, marketingFields } from './marketingFields';
import { ctaFields, enquiryRouting } from './ctaFields';
import { golfFields } from './golfFields';
import { locationFields } from './locationFields';
import { mediaAssetMetadata } from './mediaAssetMetadata';
import { galleryGroup, mediaFields } from './mediaFields';
import { pricingFields } from './pricingFields';
import { privateReportingFields } from './privateReportingFields';
import { sensitiveGovernanceFields } from './sensitiveGovernanceFields';
import { relatedContentFields } from './relatedContentFields';
import { seoFields } from './seoFields';
import { sourceProvenance } from './sourceProvenance';
import { specsFields } from './specsFields';
import { reviewItem } from './reviewItem';
import { channelReadinessItem, workflowFields } from './workflowFields';

/** Shared object schemas referenced by document types. */
export const objectTypes: SchemaTypeDefinition[] = [
	// Supporting nested objects (registered before parents that reference them)
	featureHighlight,
	galleryGroup,
	enquiryRouting,
	channelReadinessItem,
	reviewItem,
	mediaAssetMetadata,
	sourceProvenance,
	marketingChannelNotes,
	// Guide content objects (registered before the guideSection that nests them)
	guideCallout,
	guideKeyFigures,
	guideSection,
	// Primary field groups
	locationFields,
	pricingFields,
	specsFields,
	golfFields,
	contentFields,
	marketingFields,
	mediaFields,
	ctaFields,
	relatedContentFields,
	seoFields,
	workflowFields,
	sensitiveGovernanceFields,
	privateReportingFields
];

export {
	channelReadinessItem,
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
	locationFields,
	mediaAssetMetadata,
	mediaFields,
	pricingFields,
	privateReportingFields,
	sensitiveGovernanceFields,
	seoFields,
	sourceProvenance,
	specsFields,
	workflowFields
};
