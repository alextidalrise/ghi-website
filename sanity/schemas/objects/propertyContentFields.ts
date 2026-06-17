import { defineArrayMember, defineField, defineType } from 'sanity';

const portableTextField = (name: string, title: string, description?: string) =>
	defineField({
		name,
		title,
		type: 'array',
		of: [defineArrayMember({ type: 'block' })],
		description
	});

export const propertyContentFields = defineType({
	name: 'propertyContentFields',
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
		portableTextField(
			'aboutDescription',
			'About description',
			"Required for publish. The main 'About' section on the listing page — canonical website body copy. Include only facts that can be verified from a source."
		),
		defineField({
			name: 'featureHighlights',
			title: 'Feature highlights',
			type: 'array',
			of: [defineArrayMember({ type: 'featureHighlight' })],
			description: 'A handpicked list of standout features shown prominently on the listing (e.g. sea view, private pool). Must be reviewed before going live.'
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
