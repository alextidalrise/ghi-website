import { defineField, defineType } from 'sanity';
import { COUNTRY_OPTIONS } from '../constants/enums';

/**
 * A single vetted partner shown on /partners (and, where a logo is supplied, on the
 * homepage Trusted Partners wall). Every buyer-facing call to action routes through a
 * GHI introduction request (/contact?partner=<slug>), never straight to the partner —
 * so `referralUrl` is an internal handoff field and is never projected to the website.
 */
export const partner = defineType({
	name: 'partner',
	title: 'Partner',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			description:
				'Stable identifier passed to the introduction request (/contact?partner=…). Keep stable once published.',
			options: { source: 'name', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'reference',
			to: [{ type: 'partnerCategory' }],
			description: 'Which section of the Partners page this partner appears under.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'countries',
			title: 'Countries',
			type: 'array',
			of: [{ type: 'string' }],
			options: { list: [...COUNTRY_OPTIONS], layout: 'grid' },
			description:
				'Which markets this partner covers. A listing shows this partner in its enquiry shelf only when the listing sits in one of these countries — so a partner with no country here appears on no listing. This is the structured filter; "Coverage" below is the human-readable label.',
			validation: (Rule) => Rule.required().min(1).unique()
		}),
		defineField({
			name: 'coverage',
			title: 'Coverage',
			type: 'string',
			description:
				'Where the partner operates — shown as a quiet label on the card, e.g. "Spain · Costa del Sol".',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'logo',
			title: 'Logo',
			type: 'mediaAssetMetadata',
			description:
				'Partner logo. Rendered grayscale at rest and resolving to colour on hover, against a white cell. A transparent PNG or SVG works best.'
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'text',
			rows: 4,
			description: 'One tight paragraph in brand voice.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'referralUrl',
			title: 'Referral URL (internal)',
			type: 'url',
			description:
				"The partner's own booking or referral link. For the GHI team's handoff only — never shown to visitors.",
			validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] })
		}),
		defineField({
			name: 'order',
			title: 'Order',
			type: 'number',
			description: 'Manual ordering within the category. Lower numbers appear first.',
			validation: (Rule) => Rule.min(0).integer()
		})
	],
	orderings: [
		{ name: 'order', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }
	],
	preview: {
		select: {
			title: 'name',
			coverage: 'coverage',
			category: 'category.name',
			media: 'logo.asset'
		},
		prepare({ title, coverage, category, media }) {
			return {
				title: title || 'Partner',
				subtitle: [category, coverage].filter(Boolean).join(' · ') || undefined,
				media
			};
		}
	}
});
