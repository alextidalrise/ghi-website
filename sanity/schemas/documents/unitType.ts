import { defineArrayMember, defineField, defineType } from 'sanity';
import { PROPERTY_TYPES } from '../constants/enums';
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
			description: 'The typology name shown to buyers (e.g. "2-bed apartment", "Penthouse").',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'propertyType',
			title: 'Property type',
			type: 'string',
			group: 'details',
			options: { list: [...PROPERTY_TYPES], layout: 'dropdown' },
			description:
				'The kind of home this typology is (Apartment, Villa, Penthouse…). Shown in the development inventory table\'s "Type" column and inherited by every unit of this type.'
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
				"Typical pricing for this unit type. Use 'Price from' to show a starting figure. Reserved status means this type will not appear on the website."
		}),
		defineField({
			name: 'specs',
			title: 'Specification range',
			type: 'specsFields',
			group: 'details',
			description: 'Typical bedroom count, bathroom count, and size for this unit type. Use ranges if individual units vary.'
		}),
		defineField({
			name: 'floorplans',
			title: 'Floorplans',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'Floorplan images for this unit type. Shown on the website once approved.'
		}),
		defineField({
			name: 'gallery',
			title: 'Gallery',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'Gallery images for this unit type. Shown on the website once approved.'
		}),
		defineField({
			name: 'sourceProvenance',
			title: 'Source provenance',
			type: 'array',
			group: 'governance',
			of: [defineArrayMember({ type: 'sourceProvenance' })],
			description: 'Internal audit trail showing where this unit type\'s data came from. Not shown on the website.'
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
