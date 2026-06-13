import { defineField, defineType } from 'sanity';
import { REVIEW_CATEGORIES } from '../constants/enums';

export const reviewItem = defineType({
	name: 'reviewItem',
	title: 'Review item',
	type: 'object',
	fields: [
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'detail',
			title: 'Detail',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'blocksPublish',
			title: 'Blocks publish',
			type: 'boolean',
			initialValue: true,
			description:
				'When ticked, this listing cannot move to status = published until the item is resolved. Resolve by deleting the row once handled. Leave unticked to record a non-blocking note.'
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'string',
			options: { list: [...REVIEW_CATEGORIES], layout: 'dropdown' },
			validation: (Rule) => Rule.required()
		})
	],
	preview: {
		select: {
			label: 'label',
			category: 'category',
			blocksPublish: 'blocksPublish'
		},
		prepare({ label, category, blocksPublish }) {
			const blocker = blocksPublish ? ' · blocks publish' : ' · note';
			return {
				title: label || 'Review item',
				subtitle: (category || '').replace(/_/g, ' ') + blocker
			};
		}
	}
});
