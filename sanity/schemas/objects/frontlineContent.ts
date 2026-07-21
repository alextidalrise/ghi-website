import { defineField, defineType } from 'sanity';

export const frontlineContent = defineType({
	name: 'frontlineContent',
	title: 'Front Line Collection content',
	type: 'object',
	fields: [
		defineField({
			name: 'explanatoryHeading',
			title: 'Explanatory heading',
			type: 'string',
			description: 'Heading for the explanatory body copy section below the hero.'
		}),
		defineField({
			name: 'explanatoryBody',
			title: 'Explanatory body',
			type: 'text',
			rows: 4,
			description: 'Body copy explaining the Front Line Collection concept.'
		}),
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
