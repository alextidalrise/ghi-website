import { defineArrayMember, defineField, defineType } from 'sanity';
import { validatePricingFields } from '../validators/rules';

export const unit = defineType({
	name: 'unit',
	title: 'Unit',
	type: 'document',
	groups: [
		{ name: 'details', title: 'Details', default: true },
		{ name: 'governance', title: 'Governance & workflow' }
	],
	fields: [
		defineField({
			name: 'unitName',
			title: 'Unit name',
			type: 'string',
			description: 'Display name for this unit (e.g. "Villa 12", "Penthouse A").',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'unitNumber',
			title: 'Unit number',
			type: 'string',
			description: 'Public only when approved for display.'
		}),
		defineField({
			name: 'parentDevelopment',
			title: 'Parent development',
			type: 'reference',
			to: [{ type: 'development' }],
			validation: (Rule) => Rule.required()
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
			name: 'pricing',
			title: 'Pricing & availability',
			type: 'pricingFields',
			group: 'details',
			description:
				'Reserved units must be hidden or internal only — excluded entirely from public output.'
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
			description: 'Public only when approved.'
		}),
		defineField({
			name: 'unitGallery',
			title: 'Unit gallery',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'Public only when approved.'
		}),
		defineField({
			name: 'unitSpecificNotes',
			title: 'Unit-specific notes',
			type: 'text',
			group: 'governance',
			rows: 3,
			description: 'Private/internal — source or sales notes, never public.'
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
			title: 'unitName',
			unitNumber: 'unitNumber',
			development: 'parentDevelopment.developmentName',
			availability: 'pricing.availabilityStatus',
			visibility: 'pricing.publicVisibility'
		},
		prepare({ title, unitNumber, development, availability, visibility }) {
			const label = unitNumber ? `${title} (${unitNumber})` : title;
			const subtitle = [development, availability, visibility].filter(Boolean).join(' · ');
			return { title: label || 'Unit', subtitle: subtitle || undefined };
		}
	}
});
