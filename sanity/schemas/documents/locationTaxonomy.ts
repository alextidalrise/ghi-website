import { defineField, defineType } from 'sanity';
import { LOCATION_TAXONOMY_TYPES } from '../constants/enums';
import { featuredListingMember, noDuplicateListings } from '../objects/featuredListings';

export const locationTaxonomy = defineType({
	name: 'locationTaxonomy',
	title: 'Place',
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
			description: "The parent location in the hierarchy. A community's parent is its location; a location's parent is its country."
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
			name: 'linkedLocations',
			title: 'Linked locations',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'linkedLocationEntry',
					fields: [
						defineField({
							name: 'location',
							title: 'Location',
							type: 'reference',
							to: [{ type: 'locationTaxonomy' }],
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'includeInGrid',
							title: 'Include properties in grid',
							type: 'boolean',
							initialValue: false,
							description:
								'When enabled, listings from this location appear in this page’s default property grid.'
						}),
						defineField({
							name: 'showLink',
							title: 'Show link on page',
							type: 'boolean',
							initialValue: true,
							description: 'When enabled, show a related-area link to this location’s page.'
						})
					],
					preview: {
						select: { title: 'location.name', includeInGrid: 'includeInGrid', showLink: 'showLink' },
						prepare({ title, includeInGrid, showLink }) {
							const flags = [
								includeInGrid ? 'in grid' : null,
								showLink ? 'link' : null
							].filter(Boolean);
							return {
								title: title || 'Linked location',
								subtitle: flags.length > 0 ? flags.join(' · ') : undefined
							};
						}
					}
				}
			],
			description:
				'Cross-promote other locations — merge their listings into the grid and/or show a link to their page.',
			hidden: ({ document }) => document?.type !== 'location'
		}),
		defineField({
			name: 'breadcrumbLabel',
			title: 'Breadcrumb label',
			type: 'string',
			description: 'A short alternative name for the breadcrumb trail shown at the top of the page. Uses the full name if left blank.'
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
			description: 'A short editorial description shown on this location\'s landing page (e.g. "Marbella is renowned for...").'
		}),
		defineField({
			name: 'coordinates',
			title: 'Coordinates',
			type: 'geopoint',
			description: 'Map pin for this community. Used on all listings in this community.',
			hidden: ({ document }) => document?.type !== 'community'
		}),
		defineField({
			name: 'featuredListings',
			title: 'Featured listings',
			type: 'array',
			of: [featuredListingMember],
			description:
				'Hand-picked listings for this country landing page (4–6). Order here is preserved on the site.',
			hidden: ({ document }) => document?.type !== 'country',
			validation: (Rule) => Rule.max(6).custom(noDuplicateListings)
		})
	],
	preview: {
		select: {
			title: 'name',
			taxonomyLevel: 'type',
			parentName: 'parent.name'
		},
		prepare({ title, taxonomyLevel, parentName }) {
			const typeLabel =
				LOCATION_TAXONOMY_TYPES.find((t) => t.value === taxonomyLevel)?.title ?? taxonomyLevel;
			const subtitle = [typeLabel, parentName ? `in ${parentName}` : null]
				.filter(Boolean)
				.join(' · ');
			return { title: title || 'Location', subtitle: subtitle || undefined };
		}
	}
});
