import { defineField, defineType } from 'sanity';
import { GOLF_ENRICHMENT_STATUSES, GOLF_RELEVANCE } from '../constants/enums';

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
			name: 'primaryGolfCourse',
			title: 'Primary golf course',
			type: 'reference',
			to: [{ type: 'golfCourse' }],
			description: 'The main golf course associated with this property. Shown publicly once confirmed and approved.'
		}),
		defineField({
			name: 'linkedGolfCourses',
			title: 'Linked golf courses',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'golfCourse' }] }],
			description: 'Additional golf courses nearby or associated with this property. Shown publicly once confirmed and approved.'
		}),
		defineField({
			name: 'distanceToPrimaryGolfCourse',
			title: 'Distance to primary golf course',
			type: 'string',
			description: 'How far the property is from the main golf course (e.g. "200m", "5 min walk"). Publish only if confirmed from a source.'
		}),
		defineField({
			name: 'golfView',
			title: 'Golf view',
			type: 'boolean',
			description: 'Tick if the property has a view of a golf course. A confirmed source is required before this can be published.'
		}),
		defineField({
			name: 'buggyAccess',
			title: 'Buggy access',
			type: 'boolean',
			description: 'Tick if the property has direct buggy access to the course. A confirmed source is required before this can be published.'
		}),
		defineField({
			name: 'golfMembershipInfo',
			title: 'Golf membership info',
			type: 'text',
			rows: 3,
			description: 'Details about any included or available golf membership. Only publish if confirmed from a reliable source — leave blank if unsure.'
		}),
		defineField({
			name: 'golfNotes',
			title: 'Golf notes',
			type: 'text',
			rows: 3,
			description: 'Internal notes from the team when researching golf details for this property. Not shown on the website.'
		}),
		defineField({
			name: 'golfEnrichmentStatus',
			title: 'Golf enrichment status',
			type: 'string',
			options: { list: [...GOLF_ENRICHMENT_STATUSES], layout: 'dropdown' },
			initialValue: 'not_started'
		}),
		defineField({
			name: 'golfEnrichedBy',
			title: 'Golf enriched by',
			type: 'string'
		}),
		defineField({
			name: 'golfEnrichedAt',
			title: 'Golf enriched at',
			type: 'datetime'
		})
	],
	preview: {
		select: {
			golfRelevance: 'golfRelevance',
			primaryCourse: 'primaryGolfCourse.name'
		},
		prepare({ golfRelevance, primaryCourse }) {
			return {
				title: golfRelevance ? `Golf: ${golfRelevance.replace(/_/g, ' ')}` : 'Golf',
				subtitle: primaryCourse
			};
		}
	}
});
