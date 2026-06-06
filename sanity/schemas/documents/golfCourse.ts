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
			name: 'community',
			title: 'Community',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			group: 'details',
			description: 'The community this golf course belongs to.',
			options: {
				filter: 'type == "community"'
			},
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'shortDescription',
			title: 'Short description',
			type: 'text',
			group: 'details',
			rows: 3,
			description: 'A brief description of this golf course shown publicly after review.'
		}),
		defineField({
			name: 'tagline',
			title: 'Tagline',
			type: 'string',
			group: 'details',
			description: 'Short positioning line under the hero headline.',
			validation: (Rule) => Rule.max(60)
		}),
		defineField({
			name: 'seoTitle',
			title: 'SEO title',
			type: 'string',
			group: 'details'
		}),
		defineField({
			name: 'metaDescription',
			title: 'Meta description',
			type: 'text',
			group: 'details',
			rows: 3
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
			description: "The course's layout style (e.g. links, parkland, desert). Shown publicly when confirmed."
		}),
		defineField({
			name: 'websiteUrl',
			title: 'Website URL',
			type: 'url',
			group: 'details',
			description: "The course's official website. Shown on the website once confirmed and approved."
		}),
		defineField({
			name: 'media',
			title: 'Media',
			type: 'array',
			group: 'details',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'Photos of this golf course. Uploaded images appear on the website once the listing is published.'
		}),
		defineField({
			name: 'coordinates',
			title: 'Coordinates',
			type: 'geopoint',
			group: 'governance',
			description:
				'Exact GPS location of this course. Internal only — only shown publicly if map privacy has been approved.'
		}),
		defineField({
			name: 'reviewStatus',
			title: 'Review status',
			type: 'string',
			group: 'governance',
			options: { list: [...GOLF_COURSE_REVIEW_STATUSES], layout: 'dropdown' },
			initialValue: 'draft',
			description: 'Internal publishing status for this golf course record.'
		})
	],
	preview: {
		select: {
			title: 'name',
			community: 'community.name',
			holes: 'holes'
		},
		prepare({ title, community, holes }) {
			const subtitle = [community, holes != null ? `${holes} holes` : null].filter(Boolean).join(' · ');
			return { title: title || 'Golf course', subtitle: subtitle || undefined };
		}
	}
});
