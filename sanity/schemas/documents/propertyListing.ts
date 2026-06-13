import { defineField, defineType } from 'sanity';
import { HideFieldTitle } from '../../components/HideFieldTitle';
import { LocationFieldsInput } from '../../components/LocationFieldsInput';
import { PROPERTY_LISTING_KINDS, PROPERTY_TYPES, TRANSACTION_TYPES } from '../constants/enums';
import { reviewItemsField, statusField } from '../objects/workflowFields';
import {
	ghiListingIdRule,
	validatePricingFields,
	validatePublishGate
} from '../validators/rules';

export const propertyListing = defineType({
	name: 'propertyListing',
	title: 'Property listing',
	type: 'document',
	groups: [
		{ name: 'identity', title: 'Identity', default: true },
		{ name: 'location', title: 'Place' },
		{ name: 'pricing', title: 'Pricing & availability' },
		{ name: 'specs', title: 'Specifications' },
		{ name: 'content', title: 'Content & media' },
		{ name: 'marketing', title: 'Marketing source' },
		{ name: 'golf', title: 'Golf' },
		{ name: 'related', title: 'Related listings' },
		{ name: 'seo', title: 'SEO & CTAs' },
		{ name: 'internal', title: 'Internal' }
	],
	fields: [
		defineField({
			name: 'ghiListingId',
			title: 'GHI listing ID',
			type: 'string',
			group: 'identity',
			description: 'The unique listing reference used across the site (e.g. GHI00123). Auto-assigned — do not edit manually.',
			validation: (Rule) => ghiListingIdRule(Rule)
		}),
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'identity',
			description:
				'The headline shown on the listing page and in search results. Write for buyers — no internal codes, commission notes, or unconfirmed prices.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'identity',
			options: { source: 'title', maxLength: 96 },
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
			description: 'Controls which page template is used to display this listing (property or unit).'
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
			group: 'internal',
			description: 'Internal reference from the source brochure or data provider. Not shown on the website.'
		}),
		defineField({
			name: 'developerReference',
			title: 'Developer reference',
			type: 'string',
			group: 'internal',
			description: "The developer's own reference code for this property. Internal only unless specifically approved for public display."
		}),
		defineField({
			name: 'location',
			type: 'locationFields',
			group: 'location',
			components: {
				field: HideFieldTitle,
				input: LocationFieldsInput
			}
		}),
		defineField({
			name: 'pricing',
			title: 'Pricing & availability',
			type: 'pricingFields',
			group: 'pricing',
			description:
				'Untick "Price confirmed" to render POA on the website regardless of any numeric price.'
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
			title: 'Website content',
			type: 'contentFields',
			group: 'content'
		}),
		defineField({
			name: 'marketing',
			title: 'Marketing source',
			type: 'marketingFields',
			group: 'marketing'
		}),
		defineField({
			name: 'media',
			title: 'Media',
			type: 'mediaFields',
			group: 'content'
		}),
		defineField({
			name: 'related',
			title: 'Related listings',
			type: 'relatedContentFields',
			group: 'related'
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
		statusField('internal'),
		reviewItemsField('internal'),
		defineField({
			name: 'internal',
			title: 'Internal',
			type: 'internalFields',
			group: 'internal',
			description: 'Categorically private namespace — never projected by GROQ allowlists.'
		})
	],
	validation: (Rule) =>
		Rule.custom((document) => {
			const doc = document as {
				listingKind?: string;
				pricing?: Parameters<typeof validatePricingFields>[0];
				status?: string;
				reviewItems?: Array<{ blocksPublish?: boolean }>;
			};

			if (doc?.listingKind && !['property', 'unit'].includes(doc.listingKind)) {
				return 'Property listings must have listing kind "property" or "unit".';
			}

			const pricingResult = validatePricingFields(doc?.pricing);
			if (pricingResult !== true) return pricingResult;

			return validatePublishGate({ status: doc.status, reviewItems: doc.reviewItems });
		}),
	preview: {
		select: {
			title: 'title',
			ghiId: 'ghiListingId',
			propertyType: 'propertyType',
			listingKind: 'listingKind',
			location: 'location.location.name',
			priceDisplay: 'pricing.priceDisplay',
			status: 'status'
		},
		prepare({ title, ghiId, propertyType, listingKind, location: locationName, priceDisplay, status }) {
			const subtitle = [status, ghiId, propertyType, listingKind, locationName, priceDisplay]
				.filter(Boolean)
				.join(' · ');
			return {
				title: title || 'Property listing',
				subtitle: subtitle || undefined
			};
		}
	}
});
