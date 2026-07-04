import { defineArrayMember, defineField, defineType } from 'sanity';
import { reviewItemsField, statusField } from '../objects/workflowFields';
import { validatePricingFields, validatePublishGate } from '../validators/rules';

export const unit = defineType({
	name: 'unit',
	title: 'Unit',
	type: 'document',
	groups: [
		{ name: 'details', title: 'Details', default: true },
		{ name: 'content', title: 'Content' },
		{ name: 'internal', title: 'Internal' }
	],
	fields: [
		defineField({
			name: 'ghiListingId',
			title: 'GHI listing ID',
			type: 'string',
			group: 'details',
			description:
				'The unique listing reference used across the site (e.g. GHI00123). Auto-assigned — do not edit manually. Optional for units: required only for the /u/[ghiId] permalink.',
			validation: (Rule) =>
				Rule.regex(/^GHI[0-9]{5}$/, { name: 'GHI ID', invert: false })
		}),
		defineField({
			name: 'unitName',
			title: 'Unit name',
			type: 'string',
			group: 'details',
			description: 'Display name for this unit (e.g. "Villa 12", "Penthouse A").',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'unitNumber',
			title: 'Unit number',
			type: 'string',
			group: 'details',
			description: "The developer's unit number or plot reference. Shown publicly only once approved."
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'details',
			description:
				"The final segment of this unit's URL, nested under its development (e.g. .../epic-golden-mile/unit-14-04).",
			options: { source: (doc) => (doc.unitName as string) || (doc.unitNumber as string) || '', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'parentDevelopment',
			title: 'Parent development',
			type: 'reference',
			group: 'details',
			to: [{ type: 'development' }],
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'parentUnitType',
			title: 'Unit type',
			type: 'reference',
			group: 'details',
			to: [{ type: 'unitType' }],
			description:
				"Recommended. The typology this unit belongs to (e.g. \"2-bed apartment\"). The unit page shares its type's gallery and inherits its property type; only this unit's price, size, floor and number are its own. When unset, the unit page falls back to the development's own imagery."
		}),
		defineField({
			name: 'listingKind',
			title: 'Listing kind',
			type: 'string',
			readOnly: true,
			initialValue: 'unit',
			hidden: true
		}),
		defineField({
			name: 'floor',
			title: 'Floor',
			type: 'number',
			group: 'details',
			description: 'Which floor this unit is on. Shown in the development inventory table.',
			validation: (Rule) => Rule.integer()
		}),
		defineField({
			name: 'phase',
			title: 'Phase',
			type: 'string',
			group: 'details',
			description:
				'Free-text phase or building this unit belongs to (e.g. "Harcourt Gardens"). Shown in the inventory table when set.'
		}),
		defineField({
			name: 'pricing',
			title: 'Pricing & availability',
			type: 'pricingFields',
			group: 'details',
			description:
				'Pricing and availability for this unit. Reserved/sold units render as locked inventory rows; withdrawn units are dropped from the website.'
		}),
		defineField({
			name: 'specs',
			title: 'Specifications',
			type: 'specsFields',
			group: 'details'
		}),
		defineField({
			name: 'floorplan',
			title: 'Floorplan',
			type: 'mediaAssetMetadata',
			group: 'details',
			description: 'The floorplan image for this unit. Shown on the website only once approved.'
		}),
		defineField({
			name: 'unitGallery',
			title: 'Unit gallery (override)',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description:
				"Optional. Photos specific to this unit. Normally left empty — the unit page inherits its unit type's shared gallery. Set this only when this unit genuinely has its own images, which then override the type's."
		}),
		defineField({
			name: 'content',
			title: 'Website content (override)',
			type: 'contentFields',
			group: 'content',
			description:
				"Optional. Overrides the development's copy for this unit. Any field left blank falls back to the unit type, then the development."
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
			title: 'unitName',
			unitNumber: 'unitNumber',
			development: 'parentDevelopment.developmentName',
			availability: 'pricing.availabilityStatus',
			status: 'status'
		},
		prepare({ title, unitNumber, development, availability, status }) {
			const label = unitNumber ? `${title} (${unitNumber})` : title;
			const subtitle = [status, development, availability].filter(Boolean).join(' · ');
			return { title: label || 'Unit', subtitle: subtitle || undefined };
		}
	}
});
