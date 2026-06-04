import { defineArrayMember, defineField, defineType } from 'sanity';
import { SCHEMA_TYPES } from '../constants/enums';

export const seoFields = defineType({
	name: 'seoFields',
	title: 'SEO metadata',
	type: 'object',
	fieldsets: [
		{
			name: 'openGraph',
			title: 'Social sharing',
			description:
				'Controls how this page appears when shared on WhatsApp, LinkedIn, and similar apps. Leave blank to fall back to SEO title, description, and the first gallery image.',
			options: { collapsible: true, collapsed: false }
		}
	],
	fields: [
		defineField({
			name: 'seoTitle',
			title: 'SEO title',
			type: 'string',
			description: 'Page title shown in Google search results and browser tabs. Keep under 70 characters. No prices, fees, or internal notes.',
			validation: (Rule) => Rule.max(70).warning('Keep SEO titles under 70 characters where possible.')
		}),
		defineField({
			name: 'metaDescription',
			title: 'Meta description',
			type: 'text',
			rows: 3,
			validation: (Rule) => Rule.max(160).warning('Keep meta descriptions under 160 characters where possible.')
		}),
		defineField({
			name: 'openGraphTitle',
			title: 'Open Graph title',
			type: 'string',
			fieldset: 'openGraph'
		}),
		defineField({
			name: 'openGraphDescription',
			title: 'Open Graph description',
			type: 'text',
			rows: 3,
			fieldset: 'openGraph'
		}),
		defineField({
			name: 'openGraphImage',
			title: 'Open Graph image',
			type: 'mediaAssetMetadata',
			fieldset: 'openGraph'
		}),
		defineField({
			name: 'noindex',
			title: 'Noindex',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'schemaType',
			title: 'Schema.org type',
			type: 'string',
			options: { list: [...SCHEMA_TYPES], layout: 'dropdown' },
			initialValue: 'RealEstateListing'
		}),
		defineField({
			name: 'primaryKeyword',
			title: 'Primary keyword',
			type: 'string',
			description: 'The main search phrase this page is targeting. Internal use only — not shown on the website.'
		}),
		defineField({
			name: 'secondaryKeywords',
			title: 'Secondary keywords',
			type: 'array',
			of: [{ type: 'string' }]
		}),
		defineField({
			name: 'canonicalCluster',
			title: 'Canonical cluster',
			type: 'string',
			description: 'Internal label used to group related pages for SEO strategy. Not shown publicly.'
		}),
		defineField({
			name: 'backLinks',
			title: 'Back links',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						defineField({ name: 'label', title: 'Label', type: 'string' }),
						defineField({ name: 'url', title: 'URL', type: 'string' })
					]
				})
			]
		}),
		defineField({
			name: 'supportingArticles',
			title: 'Supporting articles',
			type: 'array',
			of: [{ type: 'string' }],
			description: "Links to related editorial articles that support this listing's search ranking. Add when available."
		})
	],
	preview: {
		select: {
			seoTitle: 'seoTitle',
			noindex: 'noindex'
		},
		prepare({ seoTitle, noindex }) {
			return {
				title: seoTitle || 'SEO',
				subtitle: noindex ? 'Noindex' : 'Indexable'
			};
		}
	}
});
