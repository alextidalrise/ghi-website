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
			description: 'Public after manual enrichment and review.'
		}),
		defineField({
			name: 'primaryGolfCourse',
			title: 'Primary golf course',
			type: 'reference',
			to: [{ type: 'golfCourse' }],
			description: 'Public when manually enriched and approved.'
		}),
		defineField({
			name: 'linkedGolfCourses',
			title: 'Linked golf courses',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'golfCourse' }] }],
			description: 'Public when manually enriched and approved.'
		}),
		defineField({
			name: 'distanceToPrimaryGolfCourse',
			title: 'Distance to primary golf course',
			type: 'string',
			description: 'Public only when source-supported and reviewed (e.g. "200m", "5 min walk").'
		}),
		defineField({
			name: 'golfView',
			title: 'Golf view',
			type: 'boolean',
			description: 'Public only when source-supported and reviewed.'
		}),
		defineField({
			name: 'buggyAccess',
			title: 'Buggy access',
			type: 'boolean',
			description: 'Public only when source-supported and reviewed.'
		}),
		defineField({
			name: 'golfMembershipInfo',
			title: 'Golf membership info',
			type: 'text',
			rows: 3,
			description: 'Public only when source-supported and reviewed; otherwise omit from public output.'
		}),
		defineField({
			name: 'golfNotes',
			title: 'Golf notes',
			type: 'text',
			rows: 3,
			description: 'Private/internal — manual enrichment workflow notes.'
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
