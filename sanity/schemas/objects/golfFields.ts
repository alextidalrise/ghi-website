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

/**
 * Curated membership of the Front Line Collection (the /front-line-collection grid and the
 * homepage frontline rail). Deliberately separate from `golf.golfRelevance`: that records
 * the property's real relationship to the course and stays factual, while this is an
 * editorial choice to showcase it. Only frontline_golf listings can be members, so the
 * switch is hidden otherwise — unless it is already on, so it can still be switched off.
 */
export const frontlineCollectionField = defineField({
	name: 'includeInFrontlineCollection',
	title: 'Include in Front Line Collection',
	type: 'boolean',
	group: 'golf',
	initialValue: false,
	hidden: ({ document }) =>
		(document?.golf as { golfRelevance?: string } | undefined)?.golfRelevance !== 'frontline_golf' &&
		document?.includeInFrontlineCollection !== true,
	description:
		'Showcase this home in the Front Line Collection and the homepage frontline rail. The collection is a curated selection of A-class, high-value frontline homes, not every frontline listing. Leaving this off does not change the golf relevance shown on the listing page or in search.'
});
