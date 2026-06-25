import { defineField, defineType } from 'sanity';
import { featuredListingMember, noDuplicateListings } from '../objects/featuredListings';
import { featuredLocationMember, noDuplicateLocations } from '../objects/featuredLocations';

export const siteSettings = defineType({
	name: 'siteSettings',
	title: 'Site settings',
	type: 'document',
	fields: [
		defineField({
			name: 'headerNav',
			title: 'Header navigation',
			type: 'array',
			of: [{ type: 'navMenuItem' }],
			description:
				'The main menu in the site header. Drag to reorder. Each item can carry an optional dropdown of sub-items (for example the locations under a country). Leave this empty to fall back to the built-in default menu.',
			validation: (Rule) => Rule.max(8)
		}),
		defineField({
			name: 'headerCta',
			title: 'Header button',
			type: 'object',
			description: 'The highlighted button at the end of the header (currently “Contact”).',
			fields: [
				defineField({ name: 'label', title: 'Label', type: 'string' }),
				defineField({ name: 'link', title: 'Link', type: 'navLink' })
			],
			validation: (Rule) =>
				Rule.custom((value) => {
					const v = value as { label?: string; link?: { linkType?: string } } | undefined;
					if (!v) return true;
					const hasLabel = Boolean(v.label);
					const hasLink = Boolean(v.link?.linkType);
					if (hasLabel !== hasLink) return 'Give the button both a label and a link, or leave both empty.';
					return true;
				})
		}),
		defineField({
			name: 'homepageFeaturedListings',
			title: 'Homepage featured listings',
			type: 'array',
			of: [featuredListingMember],
			description:
				'Hand-picked listings for the homepage featured grid (6–8). Order here is preserved on the site.',
			validation: (Rule) => Rule.max(8).custom(noDuplicateListings)
		}),
		defineField({
			name: 'homepageHero',
			title: 'Homepage hero',
			type: 'object',
			fields: [
				defineField({
					name: 'image',
					title: 'Hero image',
					type: 'mediaAssetMetadata',
					validation: (Rule) => Rule.required()
				}),
				defineField({
					name: 'tagline',
					title: 'Tagline',
					type: 'string',
					description:
						'Optional lead line under the homepage headline. The "Homes beside the fairway" headline stays fixed on the site.'
				})
			]
		}),
		defineField({
			name: 'frontlineHero',
			title: 'Front Line Collection hero',
			type: 'object',
			description:
				'Hero band for the /front-line-collection page. Each field has a sensible default on the site if left empty.',
			fields: [
				defineField({
					name: 'image',
					title: 'Hero image',
					type: 'mediaAssetMetadata',
					description: 'Photograph shown beside the headline (right side on desktop).'
				}),
				defineField({
					name: 'eyebrow',
					title: 'Eyebrow',
					type: 'string',
					description: 'Short label in the gold marker. Defaults to "Frontline Golf".',
					validation: (Rule) => Rule.max(40)
				}),
				defineField({
					name: 'headline',
					title: 'Headline',
					type: 'string',
					description: 'Display headline. Wrap a phrase in *asterisks* to render it in italic.',
					validation: (Rule) => Rule.max(80)
				}),
				defineField({
					name: 'lead',
					title: 'Lead',
					type: 'text',
					rows: 3,
					description: 'Supporting sentence under the headline.',
					validation: (Rule) => Rule.max(280)
				})
			]
		}),
		defineField({
			name: 'homepageFeaturedLocations',
			title: 'Homepage featured locations',
			type: 'array',
			of: [featuredLocationMember],
			description:
				'Hand-picked locations for the homepage featured grid (up to 10). Order here is preserved on the site.',
			validation: (Rule) => Rule.max(10).custom(noDuplicateLocations)
		})
	],
	preview: {
		prepare() {
			return { title: 'Site settings' };
		}
	}
});
