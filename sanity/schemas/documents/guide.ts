import { defineField, defineType } from 'sanity';
import { GUIDE_CATEGORIES } from '../constants/enums';
import { COUNTRY_REFERENCE_OPTIONS, COUNTRY_REFERENCE_TO } from '../constants/countryRef';

/**
 * A long-form editorial guide. One document type serves every guide kind: the
 * `guideCategory` field branches the section (buying / location / golf), mirroring
 * how `locationTaxonomy` branches on `type`. New guide kinds need only a new enum
 * value, not a new schema or route.
 */
export const guide = defineType({
	name: 'guide',
	title: 'Guide',
	type: 'document',
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'seo', title: 'SEO' }
	],
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'content',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'content',
			options: { source: 'title', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'guideCategory',
			title: 'Category',
			type: 'string',
			group: 'content',
			options: { list: [...GUIDE_CATEGORIES], layout: 'dropdown' },
			initialValue: 'buying',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'country',
			title: 'Country',
			type: 'reference',
			to: COUNTRY_REFERENCE_TO,
			options: COUNTRY_REFERENCE_OPTIONS,
			group: 'content',
			description:
				'Which market this guide covers. On the Guides hub it answers "Where are you looking?", and listings in that country surface it in their enquiry shelf. Leave blank for a guide that is not market-specific — the hub then offers it for its buyer type wherever a market has no guide of its own.'
		}),
		defineField({
			name: 'audience',
			title: 'Buyer type',
			type: 'reference',
			to: [{ type: 'buyerType' }],
			group: 'content',
			description:
				'Who this guide is written for. The Guides hub asks "Who are you buying as?" and "Where are you looking?", and shows the guide matching both. Leave blank for a guide that applies to every buyer in its country.'
		}),
		defineField({
			name: 'audienceLabel',
			title: 'Audience label',
			type: 'string',
			group: 'content',
			description:
				'Short chip shown on the guide page hero, e.g. "For UK buyers". The Guides hub uses Buyer type above instead.',
			validation: (Rule) => Rule.max(40)
		}),
		defineField({
			name: 'order',
			title: 'Order',
			type: 'number',
			group: 'content',
			description:
				'Manual ordering. Decides which guide the Guides hub shows when more than one matches the same buyer type and country, and the order of the "All guides" list. Lower numbers appear first. Note that this also picks the default: the lowest-numbered buying guide for a country is the one shown on every listing in that country, so reordering the hub changes the listings too. To pin a different guide to a listing regardless, set it on the listing itself under Enquiry shelf: guide.',
			validation: (Rule) => Rule.min(0).integer()
		}),
		defineField({
			name: 'tagline',
			title: 'Tagline',
			type: 'string',
			group: 'content',
			description: 'Short positioning line under the hero headline and on the hub card.',
			validation: (Rule) => Rule.max(100)
		}),
		defineField({
			name: 'intro',
			title: 'Introduction',
			type: 'text',
			rows: 4,
			group: 'content',
			description:
				'Standfirst shown below the hero, before the chapters. Sets up the guide in 2–4 sentences.'
		}),
		defineField({
			name: 'heroImage',
			title: 'Hero image',
			type: 'mediaAssetMetadata',
			group: 'content',
			description: 'Full-bleed photograph for the guide hero. A typographic hero is used when blank.'
		}),
		defineField({
			name: 'lastReviewed',
			title: 'Last reviewed',
			type: 'date',
			group: 'content',
			description: 'Shown as a freshness signal, e.g. "Reviewed June 2026".'
		}),
		defineField({
			name: 'sections',
			title: 'Sections',
			type: 'array',
			group: 'content',
			of: [{ type: 'guideSection' }],
			description: 'The chapters of the guide, in reading order. Each becomes a contents-rail entry.',
			validation: (Rule) => Rule.required().min(1)
		}),
		defineField({
			name: 'advisorHeading',
			title: 'Advisor band heading',
			type: 'string',
			group: 'content',
			description: 'Optional override for the closing "speak to an advisor" band heading.'
		}),
		defineField({
			name: 'advisorBody',
			title: 'Advisor band body',
			type: 'text',
			rows: 3,
			group: 'content',
			description: 'Optional override for the closing advisor band copy.'
		}),
		defineField({
			name: 'seo',
			title: 'SEO metadata',
			type: 'seoFields',
			group: 'seo'
		})
	],
	preview: {
		select: {
			title: 'title',
			category: 'guideCategory',
			audience: 'audienceLabel',
			media: 'heroImage.asset'
		},
		prepare({ title, category, audience, media }) {
			const categoryLabel = GUIDE_CATEGORIES.find((c) => c.value === category)?.title ?? category;
			const subtitle = [categoryLabel, audience].filter(Boolean).join(' · ');
			return { title: title || 'Guide', subtitle: subtitle || undefined, media };
		}
	}
});
