import { defineField, defineType } from 'sanity';
import {
	REVIEW_CATEGORIES,
	REVIEW_SEVERITIES,
	REVIEW_SOURCE_LEVELS
} from '../constants/enums';

type ReviewItemValue = {
	label?: string;
	detail?: string;
	severity?: string;
	sourceLevel?: string;
	visibleToReviewer?: boolean;
	blocksPublish?: boolean;
	category?: string;
};

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
			name: 'severity',
			title: 'Severity',
			type: 'string',
			options: { list: [...REVIEW_SEVERITIES], layout: 'dropdown' },
			initialValue: 'must_check',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'sourceLevel',
			title: 'Source level',
			type: 'string',
			options: { list: [...REVIEW_SOURCE_LEVELS], layout: 'dropdown' },
			initialValue: 'derived',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'visibleToReviewer',
			title: 'Visible to reviewer',
			type: 'boolean',
			initialValue: true,
			description: 'When false, item is hidden from the reviewer checklist.'
		}),
		defineField({
			name: 'blocksPublish',
			title: 'Blocks publish',
			type: 'boolean',
			initialValue: true,
			description: 'When true, prevents approval for publish until resolved.'
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'string',
			options: { list: [...REVIEW_CATEGORIES], layout: 'dropdown' },
			validation: (Rule) => Rule.required()
		})
	],
	validation: (Rule) =>
		Rule.custom((value) => {
			if (!value) return true;

			const item = value as ReviewItemValue;

			if (item.severity === 'internal_note') {
				if (item.visibleToReviewer) {
					return 'Internal notes must not be visible to the reviewer.';
				}
				if (item.blocksPublish) {
					return 'Internal notes must not block publish.';
				}
			}

			return true;
		}),
	preview: {
		select: {
			label: 'label',
			severity: 'severity',
			category: 'category',
			blocksPublish: 'blocksPublish'
		},
		prepare({ label, severity, category, blocksPublish }) {
			const blocker = blocksPublish ? ' · blocks publish' : '';
			return {
				title: label || 'Review item',
				subtitle: [severity, category].filter(Boolean).join(' · ') + blocker
			};
		}
	}
});
