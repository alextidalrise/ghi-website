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
			description: "Hand-pick up to 4 listings to show as 'similar properties'. Only select listings that are already live on the website. The order set here is the order buyers will see.",
			hidden: ({ parent }) => parent?.similarPropertiesMode !== 'manual',
			validation: (Rule) => Rule.max(4)
		}),
		defineField({
			name: 'similarityTags',
			title: 'Similarity tags',
			type: 'array',
			of: [{ type: 'string' }],
			hidden: ({ parent }) => parent?.similarPropertiesMode !== 'tags',
			description: "Tags used to automatically find and display similar listings when the mode is set to 'tags'."
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
