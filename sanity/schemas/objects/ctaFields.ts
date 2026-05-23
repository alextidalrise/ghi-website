import { defineField, defineType } from 'sanity';

export const enquiryRouting = defineType({
	name: 'enquiryRouting',
	title: 'Enquiry routing',
	type: 'object',
	description: 'Private/internal routing configuration — never expose recipient details publicly.',
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
			description: 'Must obey brochureVisibility on the linked media fields.'
		}),
		defineField({
			name: 'whatsAppEnabled',
			title: 'WhatsApp enabled',
			type: 'boolean',
			initialValue: true
		}),
		defineField({
			name: 'whatsAppMessageTemplate',
			title: 'WhatsApp message template',
			type: 'text',
			rows: 3,
			description: 'Private/internal template with placeholders — public behaviour only exposes enabled state.'
		}),
		defineField({
			name: 'enquiryRouting',
			title: 'Enquiry routing',
			type: 'enquiryRouting'
		})
	],
	preview: {
		select: {
			primaryCtaLabel: 'primaryCtaLabel',
			whatsAppEnabled: 'whatsAppEnabled'
		},
		prepare({ primaryCtaLabel, whatsAppEnabled }) {
			return {
				title: primaryCtaLabel || 'CTAs',
				subtitle: whatsAppEnabled ? 'WhatsApp enabled' : 'WhatsApp disabled'
			};
		}
	}
});
