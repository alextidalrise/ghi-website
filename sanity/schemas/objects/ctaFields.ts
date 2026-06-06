import { defineField, defineType } from 'sanity';

export const enquiryRouting = defineType({
	name: 'enquiryRouting',
	title: 'Enquiry routing',
	type: 'object',
	description: 'Internal settings for routing buyer enquiries to the right team member or inbox. Never shown publicly.',
	fields: [
		defineField({
			name: 'teamSlug',
			title: 'Team slug',
			type: 'string'
		}),
		defineField({
			name: 'recipientEmail',
			title: 'Recipient email',
			type: 'string',
			validation: (Rule) => Rule.email()
		}),
		defineField({
			name: 'crmListingKey',
			title: 'CRM listing key',
			type: 'string'
		}),
		defineField({
			name: 'trackingCampaign',
			title: 'Tracking campaign',
			type: 'string'
		}),
		defineField({
			name: 'internalNotes',
			title: 'Internal notes',
			type: 'text',
			rows: 2
		})
	]
});

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
		defineField({
			name: 'enquiryRouting',
			title: 'Enquiry routing',
			type: 'enquiryRouting'
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
