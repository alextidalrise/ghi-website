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
			description: 'Parent in the hierarchy (e.g. area → municipality → region → country).'
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
			const subtitle = [type?.replace(/_/g, ' '), parentName ? `in ${parentName}` : null]
				.filter(Boolean)
				.join(' · ');
			return { title: title || 'Location', subtitle: subtitle || undefined };
		}
	}
});
