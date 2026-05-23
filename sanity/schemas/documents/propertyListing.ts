import { defineArrayMember, defineField, defineType } from 'sanity';
import { PROPERTY_LISTING_KINDS, PROPERTY_TYPES, TRANSACTION_TYPES } from '../constants/enums';
import {
	ghiListingIdRule,
	validatePricingFields,
	validatePrivateReportingFields
} from '../validators/rules';

export const propertyListing = defineType({
	name: 'propertyListing',
	title: 'Property listing',
	type: 'document',
	groups: [
		{ name: 'identity', title: 'Identity', default: true },
		{ name: 'location', title: 'Location' },
		{ name: 'pricing', title: 'Pricing & availability' },
		{ name: 'specs', title: 'Specifications' },
		{ name: 'content', title: 'Content & media' },
		{ name: 'golf', title: 'Golf' },
		{ name: 'seo', title: 'SEO & CTAs' },
		{ name: 'governance', title: 'Governance & workflow' }
	],
	fields: [
		defineField({
			name: 'ghiListingId',
			title: 'GHI listing ID',
			type: 'string',
			group: 'identity',
			description: 'Canonical public ID in GHIXXXXX format.',
			validation: (Rule) => ghiListingIdRule(Rule)
		}),
		defineField({
			name: 'internalTitle',
			title: 'Internal title',
			type: 'string',
			group: 'identity',
			description:
				'Private/internal working title. May include source shorthand — not used for slugs or public titles.'
		}),
		defineField({
			name: 'publicTitle',
			title: 'Public title',
			type: 'string',
			group: 'identity',
			description: 'Page H1/title — clean of commission, source shorthand, and unreviewed price hints.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'identity',
			options: { source: 'publicTitle', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'listingKind',
			title: 'Listing kind',
			type: 'string',
			group: 'identity',
			options: { list: [...PROPERTY_LISTING_KINDS], layout: 'radio' },
			initialValue: 'property',
			validation: (Rule) => Rule.required(),
			description: 'Discriminator for frontend template selection.'
		}),
		defineField({
			name: 'propertyType',
			title: 'Property type',
			type: 'string',
			group: 'identity',
			options: { list: [...PROPERTY_TYPES], layout: 'dropdown' },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'transactionType',
			title: 'Transaction type',
			type: 'string',
			group: 'identity',
			options: { list: [...TRANSACTION_TYPES], layout: 'dropdown' },
			initialValue: 'sale',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'sourceReference',
			title: 'Source reference',
			type: 'string',
			group: 'governance',
			description: 'Private/internal — source or brochure reference for reporting.'
		}),
		defineField({
			name: 'developerReference',
			title: 'Developer reference',
			type: 'string',
			group: 'governance',
			description: 'Private/internal unless separately approved for public display.'
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'locationFields',
			group: 'location'
		}),
		defineField({
			name: 'pricing',
			title: 'Pricing & availability',
			type: 'pricingFields',
			group: 'pricing',
			description:
				'Public price cannot rely on folder_hint_only. Reserved status forces hidden visibility.'
		}),
		defineField({
			name: 'specs',
			title: 'Specifications',
			type: 'specsFields',
			group: 'specs'
		}),
		defineField({
			name: 'golf',
			title: 'Golf',
			type: 'golfFields',
			group: 'golf'
		}),
		defineField({
			name: 'content',
			title: 'Content',
			type: 'contentFields',
			group: 'content'
		}),
		defineField({
			name: 'media',
			title: 'Media',
			type: 'mediaFields',
			group: 'content'
		}),
		defineField({
			name: 'ctas',
			title: 'Enquiry & CTAs',
			type: 'ctaFields',
			group: 'seo'
		}),
		defineField({
			name: 'seo',
			title: 'SEO',
			type: 'seoFields',
			group: 'seo'
		}),
		defineField({
			name: 'sourceProvenance',
			title: 'Source provenance',
			type: 'array',
			group: 'governance',
			of: [defineArrayMember({ type: 'sourceProvenance' })],
			description: 'Private/internal — never returned in public payloads.'
		}),
		defineField({
			name: 'workflow',
			title: 'Workflow & readiness',
			type: 'workflowFields',
			group: 'governance'
		}),
		defineField({
			name: 'sensitiveGovernance',
			title: 'Sensitive governance',
			type: 'sensitiveGovernanceFields',
			group: 'governance'
		}),
		defineField({
			name: 'privateReporting',
			title: 'Private reporting',
			type: 'privateReportingFields',
			group: 'governance',
			description: 'Commission and internal financial fields — never public.'
		})
	],
	validation: (Rule) =>
		Rule.custom((document) => {
			const doc = document as {
				listingKind?: string;
				pricing?: Parameters<typeof validatePricingFields>[0];
				privateReporting?: Parameters<typeof validatePrivateReportingFields>[0];
			};

			if (doc?.listingKind && !['property', 'unit'].includes(doc.listingKind)) {
				return 'Property listings must have listing kind "property" or "unit".';
			}

			const pricingResult = validatePricingFields(doc?.pricing);
			if (pricingResult !== true) return pricingResult;

			return validatePrivateReportingFields(doc?.privateReporting);
		}),
	preview: {
		select: {
			title: 'publicTitle',
			internalTitle: 'internalTitle',
			ghiId: 'ghiListingId',
			propertyType: 'propertyType',
			listingKind: 'listingKind',
			area: 'location.area.name',
			priceDisplay: 'pricing.priceDisplay'
		},
		prepare({ title, internalTitle, ghiId, propertyType, listingKind, area, priceDisplay }) {
			const subtitle = [ghiId, propertyType, listingKind, area, priceDisplay]
				.filter(Boolean)
				.join(' · ');
			return {
				title: title || internalTitle || 'Property listing',
				subtitle: subtitle || undefined
			};
		}
	}
});
