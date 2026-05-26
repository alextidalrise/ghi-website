import { defineField, defineType } from 'sanity';
import { LOCATION_TAXONOMY_TYPES, MAP_PRIVACY_LEVELS } from '../constants/enums';

export const locationTaxonomy = defineType({
	name: 'locationTaxonomy',
	title: 'Location',
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
			options: { source: 'name', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'type',
			title: 'Location type',
			type: 'string',
			options: { list: [...LOCATION_TAXONOMY_TYPES], layout: 'dropdown' },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'parent',
			title: 'Parent location',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			description: 'Parent in the hierarchy (community → location → country).'
		}),
		defineField({
			name: 'associatedLocations',
			title: 'Associated locations',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'locationTaxonomy' }] }],
			description:
				'Additional locations this community should appear under (beyond its canonical parent).',
			hidden: ({ document }) => document?.type !== 'community'
		}),
		defineField({
			name: 'breadcrumbLabel',
			title: 'Breadcrumb label',
			type: 'string',
			description: 'Optional override for breadcrumb display. Defaults to name when blank.'
		}),
		defineField({
			name: 'seoTitle',
			title: 'SEO title',
			type: 'string'
		}),
		defineField({
			name: 'metaDescription',
			title: 'Meta description',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'publicDescription',
			title: 'Public description',
			type: 'text',
			rows: 4,
			description: 'Editorial stub for v1 location landing pages.'
		}),
		defineField({
			name: 'mapPrivacyDefault',
			title: 'Map privacy default',
			type: 'string',
			options: { list: [...MAP_PRIVACY_LEVELS], layout: 'dropdown' },
			description: 'Default map privacy for listings in this location when not overridden.'
		})
	],
	preview: {
		select: {
			title: 'name',
			type: 'type',
			parentName: 'parent.name'
		},
		prepare({ title, type, parentName }) {
			const typeLabel = LOCATION_TAXONOMY_TYPES.find((t) => t.value === type)?.title ?? type;
			const subtitle = [typeLabel, parentName ? `in ${parentName}` : null].filter(Boolean).join(' · ');
			return { title: title || 'Location', subtitle: subtitle || undefined };
		}
	}
});
