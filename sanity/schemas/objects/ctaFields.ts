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
		}),
		// Both default from the listing itself: the buying guide for the listing's country,
		// and the mortgage / currency / legal partners. Set either only to override that.
		defineField({
			name: 'railGuide',
			title: 'Enquiry shelf: guide',
			type: 'reference',
			to: [{ type: 'guide' }],
			description:
				"Overrides the buying guide shown beneath the enquiry panel. Leave empty to use the guide for this listing's country."
		}),
		defineField({
			name: 'railPartners',
			title: 'Enquiry shelf: specialists',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'partner' }] }],
			validation: (Rule) => Rule.max(3).unique(),
			description:
				'Overrides the specialists shown beneath the enquiry panel. Leave empty to use the mortgage, currency and legal partners. Maximum of three.'
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
