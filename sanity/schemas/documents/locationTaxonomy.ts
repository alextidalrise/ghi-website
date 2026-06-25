import { defineField, defineType } from 'sanity';
import { LOCATION_TAXONOMY_TYPES } from '../constants/enums';
import { createFeaturedListingMember, noDuplicateListings } from '../objects/featuredListings';
import { featuredLocationMember, noDuplicateLocations } from '../objects/featuredLocations';

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
			name: 'overviewHeading',
			title: 'Overview heading',
			type: 'string',
			description:
				'Optional heading for the overview section below the hero. Leave blank to use the default ("The {Country} Golf Property Market" / "About {Location} Golf Property").',
			hidden: ({ document }) => document?.type === 'community'
		}),
		defineField({
			name: 'publicDescription',
			title: 'Overview / public description',
			type: 'text',
			rows: 10,
			description:
				'The editorial overview shown in the reveal section below the hero (country: ~150–200 words; location: ~300–400 words). Separate blank lines into paragraphs. Not used for the hero line (that is the Tagline) or the search snippet (that is the Meta description).'
		}),
		defineField({
			name: 'heroImage',
			title: 'Hero image',
			type: 'mediaAssetMetadata',
			description: 'Full-bleed photograph for the country or location landing page hero.',
			hidden: ({ document }) => document?.type === 'community'
		}),
		defineField({
			name: 'flag',
			title: 'Flag',
			type: 'image',
			description:
				'Country flag for the homepage "Explore by country" selector. Upload an SVG so it stays crisp at any size. Shown as a small framed stamp, not a background — a simple national flag works best.',
			options: { accept: 'image/svg+xml' },
			hidden: ({ document }) => document?.type !== 'country'
		}),
		defineField({
			name: 'tagline',
			title: 'Tagline',
			type: 'string',
			description:
				'Short positioning line under the hero headline and on location cards, e.g. "Polo, Valderrama, exclusive".',
			hidden: ({ document }) => document?.type === 'community',
			validation: (Rule) => Rule.max(60)
		}),
		defineField({
			name: 'coordinates',
			title: 'Coordinates',
			type: 'geopoint',
			description:
				'Map pin for this place. On a community it pins every listing within it; on a location it positions the area map on the location page.',
			hidden: ({ document }) => document?.type === 'country'
		}),
		defineField({
			name: 'isCatchAll',
			title: 'Catch-all community',
			type: 'boolean',
			initialValue: false,
			description:
				'Default bucket for listings without a specific micro-location. Public URLs omit this community segment.',
			hidden: ({ document }) => document?.type !== 'community',
			validation: (Rule) =>
				Rule.custom(async (value, context) => {
					if (!value) return true;

					const doc = context.document as
						| { type?: string; parent?: { _ref?: string }; _id?: string }
						| undefined;
					if (doc?.type !== 'community') return true;

					const parentRef = doc.parent?._ref;
					if (!parentRef) {
						return 'A catch-all community must have a parent location.';
					}

					const docId = doc._id?.replace(/^drafts\./, '') ?? '';
					const client = context.getClient({ apiVersion: '2024-01-01' });
					const existing = await client.fetch<string | null>(
						`*[
							_type == "locationTaxonomy"
							&& type == "community"
							&& isCatchAll == true
							&& parent._ref == $parentId
							&& !(_id in [$id, "drafts." + $id])
						][0]._id`,
						{ parentId: parentRef, id: docId }
					);

					if (existing) {
						return 'This location already has a catch-all community.';
					}

					return true;
				})
		}),
		defineField({
			name: 'featuredListings',
			title: 'Featured listings',
			type: 'array',
			of: [createFeaturedListingMember(['propertyListing', 'development'])],
			description:
				'Hand-picked properties and developments for this country landing page (4–6). Order here is preserved on the site.',
			hidden: ({ document }) => document?.type !== 'country',
			validation: (Rule) => Rule.max(6).custom(noDuplicateListings)
		}),
		defineField({
			name: 'featuredLocations',
			title: 'Featured locations',
			type: 'array',
			of: [featuredLocationMember],
			description:
				'Hand-picked locations for this country landing page (3–6). Order here is preserved on the site.',
			hidden: ({ document }) => document?.type !== 'country',
			validation: (Rule) => Rule.max(6).custom(noDuplicateLocations)
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
