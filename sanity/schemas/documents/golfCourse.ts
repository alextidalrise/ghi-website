import { defineArrayMember, defineField, defineType } from 'sanity';
import { GOLF_COURSE_REVIEW_STATUSES } from '../constants/enums';

export const golfCourse = defineType({
	name: 'golfCourse',
	title: 'Golf course',
	type: 'document',
	groups: [
		{ name: 'details', title: 'Details', default: true },
		{ name: 'governance', title: 'Governance & workflow' }
	],
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			group: 'details',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'details',
			options: { source: 'name', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			group: 'details',
			description: 'Primary area or municipality for this course.'
		}),
		defineField({
			name: 'shortDescription',
			title: 'Short description',
			type: 'text',
			group: 'details',
			rows: 3,
			description: 'Public after review.'
		}),
		defineField({
			name: 'holes',
			title: 'Holes',
			type: 'number',
			group: 'details',
			validation: (Rule) => Rule.min(1).max(36).integer()
		}),
		defineField({
			name: 'par',
			title: 'Par',
			type: 'number',
			group: 'details',
			validation: (Rule) => Rule.min(1).integer()
		}),
		defineField({
			name: 'designStyle',
			title: 'Design style',
			type: 'string',
			group: 'details',
			description: 'Public when known (e.g. links, parkland, desert).'
		}),
		defineField({
			name: 'websiteUrl',
			title: 'Website URL',
			type: 'url',
			group: 'details',
			description: 'Public only when approved.'
		}),
		defineField({
			name: 'media',
			title: 'Media',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'Public only when assets are approved for public use.'
		}),
		defineField({
			name: 'coordinates',
			title: 'Coordinates',
			type: 'geopoint',
			group: 'governance',
			description:
				'Private/internal unless map privacy is approved. Never sent directly to public pages.'
		}),
		defineField({
			name: 'reviewStatus',
			title: 'Review status',
			type: 'string',
			group: 'governance',
			options: { list: [...GOLF_COURSE_REVIEW_STATUSES], layout: 'dropdown' },
			initialValue: 'draft',
			description: 'Private/internal workflow field.'
		})
	],
	preview: {
		select: {
			title: 'name',
			location: 'location.name',
			holes: 'holes'
		},
		prepare({ title, location, holes }) {
			const subtitle = [location, holes != null ? `${holes} holes` : null].filter(Boolean).join(' · ');
			return { title: title || 'Golf course', subtitle: subtitle || undefined };
		}
	}
});
