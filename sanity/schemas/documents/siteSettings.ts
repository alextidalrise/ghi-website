import { defineField, defineType } from 'sanity';
import { featuredListingMember, noDuplicateListings } from '../objects/featuredListings';
import { featuredLocationMember, noDuplicateLocations } from '../objects/featuredLocations';

export const siteSettings = defineType({
	name: 'siteSettings',
	title: 'Site settings',
	type: 'document',
	fields: [
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
			name: 'homepageFeaturedLocations',
			title: 'Homepage featured locations',
			type: 'array',
			of: [featuredLocationMember],
			description:
				'Hand-picked locations for the homepage featured grid (up to 6). Order here is preserved on the site.',
			validation: (Rule) => Rule.max(6).custom(noDuplicateLocations)
		})
	],
	preview: {
		prepare() {
			return { title: 'Site settings' };
		}
	}
});
