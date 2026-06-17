import { defineField, defineType } from 'sanity';
import { HideFieldTitle } from '../../components/HideFieldTitle';
import { LocationFieldsInput } from '../../components/LocationFieldsInput';
import { PROPERTY_LISTING_KINDS, PROPERTY_TYPES, TRANSACTION_TYPES } from '../constants/enums';
import { reviewItemsField, statusField } from '../objects/workflowFields';
import { ghiListingIdRule, validatePublishGate } from '../validators/rules';

export const propertyListing = defineType({
	name: 'propertyListing',
	title: 'Property listing',
	type: 'document',
	groups: [
		{ name: 'propertyInfo', title: 'Property Information', default: true },
		{ name: 'copyMedia', title: 'Property Copy & Media' },
		{ name: 'marketing', title: 'Marketing' },
		{ name: 'golf', title: 'Golf' },
		{ name: 'internal', title: 'Internal' },
		{ name: 'review', title: 'Review' }
	],
	fieldsets: [
		{ name: 'identity', title: 'Identity', group: 'propertyInfo', options: { collapsible: false } },
		{ name: 'place', title: 'Place', group: 'propertyInfo', options: { collapsible: false } },
		{
			name: 'price',
			title: 'Price',
			group: 'propertyInfo',
			description: 'Enter the price. Type "POA" into Price display to hide the numeric price.',
			options: { collapsible: false }
		},
		{ name: 'specs', title: 'Specs', group: 'propertyInfo', options: { collapsible: false } }
	],
	fields: [
		defineField({
			name: 'ghiListingId',
			title: 'GHI listing ID',
			type: 'string',
			group: 'propertyInfo',
			fieldset: 'identity',
			description: 'The unique listing reference used across the site (e.g. GHI00123). Auto-assigned — do not edit manually.',
			validation: (Rule) => ghiListingIdRule(Rule)
		}),
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'propertyInfo',
			fieldset: 'identity',
			description:
				'The headline shown on the listing page and in search results. Write for buyers — no internal codes, commission notes, or unconfirmed prices.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'propertyInfo',
			fieldset: 'identity',
			options: { source: 'title', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'listingKind',
			title: 'Listing kind',
			type: 'string',
			group: 'propertyInfo',
			fieldset: 'identity',
			options: { list: [...PROPERTY_LISTING_KINDS], layout: 'radio' },
			initialValue: 'property',
			validation: (Rule) => Rule.required(),
			description: 'Controls which page template is used to display this listing (property or unit).'
		}),
		defineField({
			name: 'propertyType',
			title: 'Property type',
			type: 'string',
			group: 'propertyInfo',
			fieldset: 'identity',
			options: { list: [...PROPERTY_TYPES], layout: 'dropdown' },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'transactionType',
			title: 'Transaction type',
			type: 'string',
			group: 'propertyInfo',
			fieldset: 'identity',
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
			group: 'propertyInfo',
			fieldset: 'place',
			components: {
				field: HideFieldTitle,
				input: LocationFieldsInput
			}
		}),
		defineField({
			name: 'pricing',
			title: 'Pricing',
			type: 'propertyPricingFields',
			group: 'propertyInfo',
			fieldset: 'price',
			components: {
				field: HideFieldTitle
			}
		}),
		defineField({
			name: 'specs',
			title: 'Specifications',
			type: 'specsFields',
			group: 'propertyInfo',
			fieldset: 'specs',
			components: {
				field: HideFieldTitle
			}
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
			type: 'propertyContentFields',
			group: 'copyMedia'
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
			type: 'propertyMediaFields',
			group: 'copyMedia'
		}),
		defineField({
			name: 'related',
			title: 'Related listings',
			type: 'relatedContentFields',
			group: 'marketing'
		}),
		defineField({
			name: 'ctas',
			title: 'Enquiry & CTAs',
			type: 'ctaFields',
			group: 'marketing'
		}),
		defineField({
			name: 'seo',
			title: 'SEO',
			type: 'seoFields',
			group: 'marketing'
		}),
		statusField('review'),
		reviewItemsField('review'),
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
				status?: string;
				reviewItems?: Array<{ blocksPublish?: boolean }>;
			};

			if (doc?.listingKind && !['property', 'unit'].includes(doc.listingKind)) {
				return 'Property listings must have listing kind "property" or "unit".';
			}

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
