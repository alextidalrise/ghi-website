import { defineArrayMember, defineField, defineType } from 'sanity';
import { SCHEMA_TYPES, SIMILAR_PROPERTIES_MODES } from '../constants/enums';

export const seoFields = defineType({
	name: 'seoFields',
	title: 'SEO & related content',
	type: 'object',
	fields: [
		defineField({
			name: 'seoTitle',
			title: 'SEO title',
			type: 'string',
			description: 'Must not include commission, fees, raw source references, or private fields.',
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
			type: 'string'
		}),
		defineField({
			name: 'openGraphDescription',
			title: 'Open Graph description',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'openGraphImage',
			title: 'Open Graph image',
			type: 'mediaAssetMetadata'
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
			description: 'Private/internal SEO workflow — need not be exposed as a raw public field.'
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
			description: 'Private/internal SEO workflow grouping.'
		}),
		defineField({
			name: 'similarPropertiesMode',
			title: 'Similar properties mode',
			type: 'string',
			options: { list: [...SIMILAR_PROPERTIES_MODES], layout: 'dropdown' },
			initialValue: 'automatic'
		}),
		defineField({
			name: 'manualSimilarProperties',
			title: 'Manual similar properties',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'reference',
					to: [{ type: 'propertyListing' }, { type: 'development' }]
				})
			],
			description: 'Selected related items must be public-safe.'
		}),
		defineField({
			name: 'similarityTags',
			title: 'Similarity tags',
			type: 'array',
			of: [{ type: 'string' }]
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
			description: 'URLs or slugs for supporting editorial content when available.'
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
