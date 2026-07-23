import { defineField, defineType } from 'sanity';

export const frontlineContent = defineType({
	name: 'frontlineContent',
	title: 'Front Line Collection content',
	type: 'object',
	fields: [
		defineField({
			name: 'ctaLabel',
			title: 'CTA label',
			type: 'string',
			description: 'Label on the hero call-to-action button (e.g. "Browse the collection").'
		}),
		defineField({
			name: 'resultsHeading',
			title: 'Results heading',
			type: 'string',
			description: 'Heading above the listing results grid (e.g. "Frontline golf homes").'
		})
	]
});
