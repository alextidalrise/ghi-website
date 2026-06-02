import { defineArrayMember, defineField, defineType } from 'sanity';
import { FEATURE_CATEGORIES } from '../constants/enums';

const portableTextField = (name: string, title: string, description?: string) =>
	defineField({
		name,
		title,
		type: 'array',
		of: [defineArrayMember({ type: 'block' })],
		description
	});

export const featureHighlight = defineType({
	name: 'featureHighlight',
	title: 'Feature highlight',
	type: 'object',
	fields: [
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'value',
			title: 'Value',
			type: 'string',
			description: 'Optional extra detail for this feature (e.g. "47 m²" for a terrace). Keep internal if the figure isn\'t confirmed.'
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'string',
			options: { list: [...FEATURE_CATEGORIES], layout: 'dropdown' }
		}),
		defineField({
			name: 'isFilterable',
			title: 'Is filterable',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'isHighlighted',
			title: 'Is highlighted',
			type: 'boolean',
			initialValue: true
		})
	],
	preview: {
		select: { title: 'label', subtitle: 'category' }
	}
});

export const contentFields = defineType({
	name: 'contentFields',
	title: 'Website content',
	type: 'object',
	description:
		'Public website copy only. Use short + about as the canonical listing text. Campaign and extended copy belongs in Marketing source.',
	fields: [
		defineField({
			name: 'shortDescription',
			title: 'Short description',
			type: 'text',
			rows: 3,
			description:
				'Required. Brief summary for search results and listing cards. Must be reviewed before going live. Do not include investment or urgency claims unless confirmed from a source.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'heroHeadline',
			title: 'Hero headline',
			type: 'string',
			description: 'A bold headline displayed prominently at the top of the listing page, above the main description.'
		}),
		portableTextField(
			'aboutDescription',
			'About description',
			"Required for publish. The main 'About' section on the listing page — canonical website body copy. Include only facts that can be verified from a source."
		),
		portableTextField(
			'locationDescription',
			'Location description',
			'Optional. Shown in the location section when this listing has location-specific copy beyond the About section.'
		),
		portableTextField(
			'golfDescription',
			'Golf description',
			'Optional. Shown in the golf section when this listing has golf-specific copy.'
		),
		defineField({
			name: 'featureHighlights',
			title: 'Feature highlights',
			type: 'array',
			of: [defineArrayMember({ type: 'featureHighlight' })],
			description: 'A handpicked list of standout features shown prominently on the listing (e.g. sea view, private pool). Must be reviewed before going live.'
		}),
		defineField({
			name: 'amenities',
			title: 'Amenities',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'A list of amenity labels shown on the listing (e.g. "Air conditioning", "Private pool").'
		}),
		defineField({
			name: 'humanReviewed',
			title: 'Human reviewed',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'reviewer',
			title: 'Reviewer',
			type: 'string'
		}),
		defineField({
			name: 'reviewDate',
			title: 'Review date',
			type: 'datetime'
		})
	],
	preview: {
		select: {
			shortDescription: 'shortDescription',
			humanReviewed: 'humanReviewed'
		},
		prepare({ shortDescription, humanReviewed }) {
			return {
				title: shortDescription || 'Content',
				subtitle: humanReviewed ? 'Reviewed' : 'Not reviewed'
			};
		}
	}
});
