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
			description: 'Optional detail value. Private/internal if source uncertainty exists.'
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
	title: 'Content',
	type: 'object',
	fields: [
		defineField({
			name: 'shortDescription',
			title: 'Short description',
			type: 'text',
			rows: 3,
			description: 'Public after human review. No unsupported investment or scarcity claims.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'heroHeadline',
			title: 'Hero headline',
			type: 'string',
			description: 'Plain string for hero display.'
		}),
		portableTextField(
			'aboutDescription',
			'About description',
			'Public after human review. Source-supported facts only.'
		),
		portableTextField('longDescription', 'Long description'),
		portableTextField('locationDescription', 'Location description'),
		portableTextField('golfDescription', 'Golf description'),
		portableTextField('lifestyleDescription', 'Lifestyle description'),
		defineField({
			name: 'featureHighlights',
			title: 'Feature highlights',
			type: 'array',
			of: [defineArrayMember({ type: 'featureHighlight' })],
			description: 'Curated feature set for public display after review.'
		}),
		defineField({
			name: 'amenities',
			title: 'Amenities',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Simple amenity labels for public display.'
		}),
		portableTextField(
			'investmentDescription',
			'Investment description',
			'Public only if source-supported and approved; otherwise leave empty.'
		),
		defineField({
			name: 'buyerFitNotes',
			title: 'Buyer fit notes',
			type: 'text',
			rows: 3,
			description: 'Private/internal — may inform CRM/sales workflows, not public copy unless rewritten.'
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
