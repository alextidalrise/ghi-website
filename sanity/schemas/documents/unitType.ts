import { defineArrayMember, defineField, defineType } from 'sanity';
import { PROPERTY_TYPES } from '../constants/enums';
import { reviewItemsField, statusField } from '../objects/workflowFields';
import { validatePricingFields, validatePublishGate } from '../validators/rules';

export const unitType = defineType({
	name: 'unitType',
	title: 'Unit type',
	type: 'document',
	groups: [
		{ name: 'details', title: 'Details', default: true },
		{ name: 'content', title: 'Content' },
		{ name: 'marketing', title: 'Marketing source' },
		{ name: 'internal', title: 'Internal' }
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
			title: 'Pricing',
			type: 'pricingFields',
			group: 'details',
			description:
				"Typical pricing for this unit type. Use 'Price from' to show a starting figure."
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
			options: { layout: 'grid' },
			description: 'Floorplan images for this unit type. Shown on the website once approved.'
		}),
		defineField({
			name: 'gallery',
			title: 'Gallery',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			options: { layout: 'grid' },
			description: 'Gallery images for this unit type. Shown on the website once approved.'
		}),
		defineField({
			name: 'content',
			title: 'Website content (override)',
			type: 'contentFields',
			group: 'content',
			description:
				"Optional. Overrides the development's copy for units of this type. Any field left blank falls back to the development; a unit can override this again."
		}),
		defineField({
			name: 'marketing',
			title: 'Marketing source',
			type: 'marketingFields',
			group: 'marketing'
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
				pricing?: Parameters<typeof validatePricingFields>[0];
				status?: string;
				reviewItems?: Array<{ blocksPublish?: boolean }>;
			};

			const pricingResult = validatePricingFields(doc?.pricing);
			if (pricingResult !== true) return pricingResult;

			return validatePublishGate({ status: doc.status, reviewItems: doc.reviewItems });
		}),
	preview: {
		select: {
			title: 'unitTypeName',
			development: 'parentDevelopment.title',
			priceDisplay: 'pricing.priceDisplay',
			status: 'status'
		},
		prepare({ title, development, priceDisplay, status }) {
			const subtitle = [status, development, priceDisplay].filter(Boolean).join(' · ');
			return { title: title || 'Unit type', subtitle: subtitle || undefined };
		}
	}
});
