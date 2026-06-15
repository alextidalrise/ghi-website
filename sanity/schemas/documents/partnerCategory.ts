import { defineField, defineType } from 'sanity';

/**
 * A grouping for the vetted partner network on /partners (e.g. "Legal & Tax",
 * "Mortgage"). Each category carries the wayfinding monogram and the one-line role
 * shown above its cards. Partners reference a category; ordering here drives the
 * order the categories stack on the page.
 */
export const partnerCategory = defineType({
	name: 'partnerCategory',
	title: 'Partner category',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			description: 'Category name shown above its partner cards, e.g. "Legal & Tax".',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			description: 'Stable identifier used in the page anchor. Generate from the name.',
			options: { source: 'name', maxLength: 64 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'monogram',
			title: 'Monogram',
			type: 'string',
			description:
				'Single initial for the wayfinding square (e.g. "L"). Defaults to the first letter of the name when left blank.',
			validation: (Rule) => Rule.max(1)
		}),
		defineField({
			name: 'role',
			title: 'Role',
			type: 'string',
			description: 'One line on what this category covers, shown under the category name.',
			validation: (Rule) => Rule.max(120)
		}),
		defineField({
			name: 'order',
			title: 'Order',
			type: 'number',
			description: 'Manual ordering on the Partners page. Lower numbers appear first.',
			validation: (Rule) => Rule.min(0).integer()
		})
	],
	orderings: [
		{ name: 'order', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }
	],
	preview: {
		select: { title: 'name', role: 'role', monogram: 'monogram' },
		prepare({ title, role, monogram }) {
			const initial = monogram || (title ? title.charAt(0).toUpperCase() : '');
			return {
				title: title || 'Partner category',
				subtitle: [initial && `(${initial})`, role].filter(Boolean).join(' ')
			};
		}
	}
});
