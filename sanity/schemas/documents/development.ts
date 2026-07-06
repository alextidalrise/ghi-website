import { defineArrayMember, defineField, defineType } from 'sanity';
import { HideFieldTitle } from '../../components/HideFieldTitle';
import { LocationFieldsInput } from '../../components/LocationFieldsInput';
import {
	BUILD_STATUSES,
	COMPLETION_STATUSES,
	DEVELOPMENT_DISPLAY_MODES,
	DEVELOPMENT_STATUSES
} from '../constants/enums';
import { reviewItemsField, statusField } from '../objects/workflowFields';
import {
	ghiListingIdRule,
	validatePricingFields,
	validatePublishGate
} from '../validators/rules';

export const development = defineType({
	name: 'development',
	title: 'Development',
	type: 'document',
	groups: [
		{ name: 'identity', title: 'Identity', default: true },
		{ name: 'location', title: 'Place' },
		{ name: 'development', title: 'Development details' },
		{ name: 'pricing', title: 'Pricing & availability' },
		{ name: 'units', title: 'Units & typologies' },
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
			name: 'developmentName',
			title: 'Development name',
			type: 'string',
			group: 'identity',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'identity',
			description:
				'The headline shown on the development page and in search results. Write for buyers — no internal codes, commission notes, or unconfirmed prices.',
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
			readOnly: true,
			initialValue: 'development',
			hidden: true
		}),
		defineField({
			name: 'developmentDisplayMode',
			title: 'Development display mode',
			type: 'string',
			group: 'development',
			options: { list: [...DEVELOPMENT_DISPLAY_MODES], layout: 'dropdown' },
			validation: (Rule) => Rule.required(),
			description:
				"Controls how units and pricing are laid out on the development's public page."
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
			name: 'developmentStatus',
			title: 'Development status',
			type: 'string',
			group: 'development',
			options: { list: [...DEVELOPMENT_STATUSES], layout: 'dropdown' }
		}),
		defineField({
			name: 'buildStatus',
			title: 'Build status',
			type: 'string',
			group: 'development',
			options: { list: [...BUILD_STATUSES], layout: 'dropdown' }
		}),
		defineField({
			name: 'completionDate',
			title: 'Completion date',
			type: 'date',
			group: 'development'
		}),
		defineField({
			name: 'completionStatus',
			title: 'Completion status',
			type: 'string',
			group: 'development',
			options: { list: [...COMPLETION_STATUSES], layout: 'dropdown' }
		}),
		defineField({
			name: 'developerName',
			title: 'Developer name',
			type: 'string',
			group: 'development',
			description: "The developer's name. Shown publicly only when confirmed from a reliable source."
		}),
		defineField({
			name: 'architectureStudio',
			title: 'Architecture studio',
			type: 'string',
			group: 'development',
			description: 'The architecture studio name. Shown publicly only when confirmed from a reliable source.'
		}),
		defineField({
			name: 'developmentComposition',
			title: 'Development composition',
			type: 'array',
			group: 'development',
			of: [{ type: 'string' }],
			description: 'Summary of what the development comprises (e.g. "45 villas, clubhouse, spa").'
		}),
		defineField({
			name: 'pricing',
			title: 'Pricing & availability',
			type: 'pricingFields',
			group: 'pricing',
			description: "Use 'Price from' and 'Price to' to show a price range for this development."
		}),
		defineField({
			name: 'availabilitySummary',
			title: 'Availability summary',
			type: 'string',
			group: 'pricing',
			description: 'A short availability note shown publicly once approved (e.g. "12 units remaining").'
		}),
		defineField({
			name: 'unitTypes',
			title: 'Unit types',
			type: 'array',
			group: 'units',
			of: [defineArrayMember({ type: 'reference', to: [{ type: 'unitType' }] })],
			description:
				'Unit types linked to this development (e.g. apartment, villa). Only those whose status is published appear on the website.'
		}),
		defineField({
			name: 'units',
			title: 'Units',
			type: 'array',
			group: 'units',
			of: [defineArrayMember({ type: 'reference', to: [{ type: 'unit' }] })],
			description:
				'Individual units linked to this development. Reserved/sold units render as locked rows; withdrawn units are dropped entirely.'
		}),
		defineField({
			name: 'sharedAmenities',
			title: 'Shared amenities',
			type: 'array',
			group: 'development',
			of: [defineArrayMember({ type: 'featureHighlight' })]
		}),
		defineField({
			name: 'sharedGallery',
			title: 'Shared gallery',
			type: 'array',
			group: 'content',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			options: { layout: 'grid' },
			description: 'Approved images shared across all units in this development.'
		}),
		defineField({
			name: 'media',
			title: 'Media',
			type: 'mediaFields',
			group: 'content'
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
			name: 'golf',
			title: 'Golf',
			type: 'golfFields',
			group: 'golf'
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

			if (doc?.listingKind && doc.listingKind !== 'development') {
				return 'Developments must have listing kind "development".';
			}

			const pricingResult = validatePricingFields(doc?.pricing);
			if (pricingResult !== true) return pricingResult;

			return validatePublishGate({ status: doc.status, reviewItems: doc.reviewItems });
		}),
	preview: {
		select: {
			developmentName: 'developmentName',
			title: 'title',
			ghiId: 'ghiListingId',
			location: 'location.location.name',
			displayMode: 'developmentDisplayMode',
			status: 'status'
		},
		prepare({ developmentName, title, ghiId, location: locationName, displayMode, status }) {
			const subtitle = [status, ghiId, locationName, displayMode?.replace(/_/g, ' ')]
				.filter(Boolean)
				.join(' · ');
			return {
				title: developmentName || title || 'Development',
				subtitle: subtitle || undefined
			};
		}
	}
});
