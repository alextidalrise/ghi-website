import { defineArrayMember, defineField, defineType } from 'sanity';
import { validatePricingFields } from '../validators/rules';

export const unitType = defineType({
	name: 'unitType',
	title: 'Unit type',
	type: 'document',
	groups: [
		{ name: 'details', title: 'Details', default: true },
		{ name: 'governance', title: 'Governance & workflow' }
	],
	fields: [
		defineField({
			name: 'unitTypeName',
			title: 'Unit type name',
			type: 'string',
			group: 'details',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'parentDevelopment',
			title: 'Parent development',
			type: 'reference',
			to: [{ type: 'development' }],
			group: 'details',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'listingKind',
			title: 'Listing kind',
			type: 'string',
			readOnly: true,
			initialValue: 'unit_type',
			hidden: true
		}),
		defineField({
			name: 'pricing',
			title: 'Pricing & visibility',
			type: 'pricingFields',
			group: 'details',
			description:
				'Use price from for representative pricing. Reserved status forces hidden visibility.'
		}),
		defineField({
			name: 'specs',
			title: 'Specification range',
			type: 'specsFields',
			group: 'details',
			description: 'Representative bedroom, bathroom, and area range for this typology.'
		}),
		defineField({
			name: 'floorplans',
			title: 'Floorplans',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'Public only when approved.'
		}),
		defineField({
			name: 'gallery',
			title: 'Gallery',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'Public only when approved.'
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
		})
	],
	validation: (Rule) =>
		Rule.custom((document) => {
			const doc = document as { pricing?: Parameters<typeof validatePricingFields>[0] };
			return validatePricingFields(doc?.pricing);
		}),
	preview: {
		select: {
			title: 'unitTypeName',
			development: 'parentDevelopment.developmentName',
			priceDisplay: 'pricing.priceDisplay',
			visibility: 'pricing.publicVisibility'
		},
		prepare({ title, development, priceDisplay, visibility }) {
			const subtitle = [development, priceDisplay, visibility].filter(Boolean).join(' · ');
			return { title: title || 'Unit type', subtitle: subtitle || undefined };
		}
	}
});
