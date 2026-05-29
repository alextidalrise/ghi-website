import { defineArrayMember, defineField, defineType } from 'sanity';
import { SIMILAR_PROPERTIES_MODES } from '../constants/enums';

export const relatedContentFields = defineType({
	name: 'relatedContentFields',
	title: 'Related listings',
	type: 'object',
	fields: [
		defineField({
			name: 'similarPropertiesMode',
			title: 'Similar properties mode',
			type: 'string',
			options: { list: [...SIMILAR_PROPERTIES_MODES], layout: 'dropdown' },
			initialValue: 'automatic'
		}),
		defineField({
			name: 'manualSimilarProperties',
			title: 'Manual similar properties',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'reference',
					to: [{ type: 'propertyListing' }, { type: 'development' }]
				})
			],
			description: 'Selected related items must be public-safe. Order is preserved on the site.',
			hidden: ({ parent }) => parent?.similarPropertiesMode !== 'manual',
			validation: (Rule) => Rule.max(4)
		}),
		defineField({
			name: 'similarityTags',
			title: 'Similarity tags',
			type: 'array',
			of: [{ type: 'string' }],
			hidden: ({ parent }) => parent?.similarPropertiesMode !== 'tags'
		})
	],
	preview: {
		select: {
			mode: 'similarPropertiesMode'
		},
		prepare({ mode }) {
			return {
				title: 'Related listings',
				subtitle: mode ?? 'automatic'
			};
		}
	}
});
