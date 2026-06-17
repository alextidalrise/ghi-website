import { defineField, defineType } from 'sanity';
import { GOLF_RELEVANCE } from '../constants/enums';

export const golfFields = defineType({
	name: 'golfFields',
	title: 'Golf',
	type: 'object',
	fields: [
		defineField({
			name: 'golfRelevance',
			title: 'Golf relevance',
			type: 'string',
			options: { list: [...GOLF_RELEVANCE], layout: 'dropdown' },
			initialValue: 'unknown',
			validation: (Rule) => Rule.required(),
			description: 'How relevant golf is to this property. Shown publicly only after a team member has verified and approved the information.'
		}),
		defineField({
			name: 'linkedGolfCourses',
			title: 'Linked golf courses',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'golfCourse' }] }],
			description: 'Golf courses nearby or associated with this property. Shown publicly once confirmed and approved.'
		})
	],
	preview: {
		select: {
			golfRelevance: 'golfRelevance',
			primaryCourse: 'linkedGolfCourses.0.name'
		},
		prepare({ golfRelevance, primaryCourse }) {
			return {
				title: golfRelevance ? `Golf: ${golfRelevance.replace(/_/g, ' ')}` : 'Golf',
				subtitle: primaryCourse
			};
		}
	}
});
