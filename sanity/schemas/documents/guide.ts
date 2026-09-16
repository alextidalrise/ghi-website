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
				'Which market this guide covers. It groups the guide under that country on the Guides hub, and listings in that country surface it in their enquiry shelf. Leave blank for a guide that is not market-specific — those lead the hub under "Start here".'
		}),
		defineField({
			name: 'audienceLabel',
			title: 'Audience label',
			type: 'string',
			group: 'content',
			description:
				'Short chip shown on the guide hero, e.g. "For UK buyers". Not shown on the Guides hub rows, where the title already names the audience.',
			validation: (Rule) => Rule.max(40)
		}),
		defineField({
			name: 'order',
			title: 'Order',
			type: 'number',
			group: 'content',
			description:
				'Manual ordering within this guide\'s country group on the Guides hub (the countries themselves are ordered by "Market order" on the country). Lower numbers appear first. Note that this also picks the default: the lowest-numbered buying guide for a country is the one shown on every listing in that country, so reordering the hub changes the listings too. To pin a different guide to a listing regardless, set it on the listing itself under Enquiry shelf: guide.',
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
