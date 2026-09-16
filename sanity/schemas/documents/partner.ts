import { defineField, defineType } from 'sanity';
import { COUNTRY_REFERENCE_OPTIONS, COUNTRY_REFERENCE_TO } from '../constants/countryRef';

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
			name: 'categories',
			title: 'Categories',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'partnerCategory' }] }],
			description:
				'Which sections of the Partners page this partner appears under — its full card shows in each. The FIRST is the primary discipline, used where only one label fits (the homepage badge, the contact introduction). Drag to reorder.',
			validation: (Rule) => Rule.required().min(1).unique()
		}),
		defineField({
			name: 'countries',
			title: 'Countries',
			type: 'array',
			of: [
				{ type: 'reference', to: COUNTRY_REFERENCE_TO, options: COUNTRY_REFERENCE_OPTIONS }
			],
			description:
				'Which markets this partner covers. Drives the coverage filter on the Partners page, the market tags on its card, and whether the partner can appear in a listing\'s enquiry shelf — a partner with no country here appears on no listing.',
			validation: (Rule) => Rule.required().min(1).unique()
		}),
		defineField({
			name: 'coverage',
			title: 'Coverage detail',
			type: 'string',
			// Was the only record of which markets a partner covered, and it drifted: WillU
			// carried "Spain, Portugal & UAE" while its structured countries included
			// Montenegro. The countries above are now the truth and the card renders their
			// names itself, so this field keeps only what they cannot say — the region
			// inside a market.
			description:
				'Optional refinement WITHIN those markets, e.g. "Costa del Sol and Sotogrande". Leave blank unless the partner is genuinely regional — the card already names the countries above, so repeating them here just duplicates them.',
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
			name: 'logoAlt',
			title: 'Logo — reversed / mark',
			type: 'mediaAssetMetadata',
			description:
				'Optional alternate logo for dark surfaces — a LIGHT-coloured version (often the icon/mark on its own). Used on the co-brand article hero plate and the partner-profile credential plate, shown as-is on the brand green. Leave blank to fall back to the partner name in those places.'
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
			description:
				'Manual ordering within a category — one value that positions this partner in every section it appears in. Lower numbers appear first.',
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
			category: 'categories.0.name',
			media: 'logo.asset'
		},
		prepare({ title, coverage, category, media }) {
			// The primary (first) category leads the subtitle; the full list lives in the field.
			return {
				title: title || 'Partner',
				subtitle: [category, coverage].filter(Boolean).join(' · ') || undefined,
				media
			};
		}
	}
});
