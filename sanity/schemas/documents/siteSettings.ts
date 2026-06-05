import { defineField, defineType } from 'sanity';
import { featuredListingMember, noDuplicateListings } from '../objects/featuredListings';

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
		})
	],
	preview: {
		prepare() {
			return { title: 'Site settings' };
		}
	}
});
