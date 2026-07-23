import { defineArrayMember, defineField, defineType } from 'sanity';
import { GUIDE_CATEGORIES } from '../constants/enums';

export const guidesHubPage = defineType({
	name: 'guidesHubPage',
	title: 'Guides hub',
	type: 'document',
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'seo', title: 'SEO' }
	],
	fields: [
		defineField({
			name: 'heroTitle',
			title: 'Hero title',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'heroLead',
			title: 'Hero lead',
			type: 'text',
			rows: 3,
			group: 'content'
		}),
		defineField({
			name: 'sectionHeading',
			title: 'Section heading',
			type: 'string',
			description: 'Heading above the guide groups when multiple groups exist.',
			group: 'content'
		}),
		defineField({
			name: 'categories',
			title: 'Category labels',
			type: 'array',
			description:
				'Display label and blurb for each guide category. Leave empty to use built-in defaults.',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						defineField({
							name: 'key',
							title: 'Category',
							type: 'string',
							options: { list: [...GUIDE_CATEGORIES] },
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'label',
							title: 'Display label',
							type: 'string',
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'blurb',
							title: 'Blurb',
							type: 'text',
							rows: 3
						})
					],
					preview: {
						select: { title: 'label', subtitle: 'key' }
					}
				})
			],
			group: 'content'
		}),
		defineField({
			name: 'emptyStateMessage',
			title: 'Empty-state message',
			type: 'string',
			description: 'Shown when no guides have been published yet.',
			group: 'content'
		}),
		defineField({
			name: 'seo',
			title: 'SEO metadata',
			type: 'seoFields',
			group: 'seo'
		})
	],
	preview: {
		prepare() {
			return { title: 'Guides hub' };
		}
	}
});
