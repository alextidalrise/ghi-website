import { defineArrayMember, defineField, defineType } from 'sanity';

export const contactPage = defineType({
	name: 'contactPage',
	title: 'Contact',
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
			name: 'contactName',
			title: 'Named contact',
			type: 'string',
			description: 'The name shown as the primary point of contact.',
			group: 'content'
		}),
		defineField({
			name: 'contactRole',
			title: 'Contact role description',
			type: 'text',
			rows: 2,
			description: 'Short editorial description of the named contact\'s role.',
			group: 'content'
		}),
		defineField({
			name: 'contactFlag',
			title: 'Contact flag',
			type: 'string',
			description: 'Label shown on the contact card (e.g. "Your first point of contact").',
			group: 'content'
		}),

		defineField({
			name: 'directHeading',
			title: 'Direct-contact heading',
			type: 'string',
			description: 'Heading above the WhatsApp and phone options.',
			group: 'content'
		}),
		defineField({
			name: 'whatsappCta',
			title: 'WhatsApp CTA label',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'phoneLabel',
			title: 'Phone label',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'reassuranceNote',
			title: 'Reassurance note',
			type: 'text',
			rows: 2,
			description: 'Short reassurance line beneath the direct-contact options.',
			group: 'content'
		}),

		defineField({
			name: 'nextStepsHeading',
			title: 'What-happens-next heading',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'nextSteps',
			title: 'What-happens-next steps',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			description: 'Short numbered steps explaining what happens after an enquiry.',
			validation: (Rule) => Rule.max(5),
			group: 'content'
		}),

		defineField({
			name: 'formHeading',
			title: 'Form heading',
			type: 'string',
			description: 'Heading above the enquiry form (e.g. "Send an enquiry").',
			group: 'content'
		}),
		defineField({
			name: 'formIntro',
			title: 'Form introduction',
			type: 'string',
			description:
				'Short line below the form heading. Use {name} to insert the contact name.',
			group: 'content'
		}),
		defineField({
			name: 'partnerFormHeading',
			title: 'Partner form heading',
			type: 'string',
			description: 'Alternative form heading when the page is opened for a partner introduction.',
			group: 'content'
		}),

		defineField({
			name: 'partnersHeading',
			title: 'Partners heading',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'partnersSubhead',
			title: 'Partners subhead',
			type: 'text',
			rows: 3,
			group: 'content'
		}),
		defineField({
			name: 'partnersCta',
			title: 'Partners CTA label',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'partnersCtaSupport',
			title: 'Partners CTA support text',
			type: 'text',
			rows: 2,
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
			return { title: 'Contact' };
		}
	}
});
