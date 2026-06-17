import { defineField, defineType } from 'sanity';

export const ctaFields = defineType({
	name: 'ctaFields',
	title: 'Enquiry & CTAs',
	type: 'object',
	fields: [
		defineField({
			name: 'primaryCtaLabel',
			title: 'Primary CTA label',
			type: 'string',
			initialValue: 'Enquire now'
		}),
		defineField({
			name: 'secondaryCtaLabel',
			title: 'Secondary CTA label',
			type: 'string'
		}),
		defineField({
			name: 'formIntroText',
			title: 'Form intro text',
			type: 'text',
			rows: 2
		}),
		defineField({
			name: 'responseTimeText',
			title: 'Response time text',
			type: 'string',
			description: 'Public reassurance copy, e.g. "We respond within 24 hours".'
		}),
		defineField({
			name: 'brochureCtaText',
			title: 'Brochure CTA text',
			type: 'string'
		}),
		defineField({
			name: 'brochureCtaEnabled',
			title: 'Brochure CTA enabled',
			type: 'boolean',
			initialValue: false,
			description: "Shows the 'Download brochure' button on the listing. Only enable if the brochure visibility is also set to allow downloads."
		})
	],
	preview: {
		select: {
			primaryCtaLabel: 'primaryCtaLabel'
		},
		prepare({ primaryCtaLabel }) {
			return {
				title: primaryCtaLabel || 'CTAs'
			};
		}
	}
});
