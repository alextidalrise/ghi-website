import { defineArrayMember, defineField, defineType } from 'sanity';

export const propertyMediaFields = defineType({
	name: 'propertyMediaFields',
	title: 'Media',
	type: 'object',
	fields: [
		defineField({
			name: 'gallery',
			title: 'Gallery',
			type: 'array',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'The first image is used as the listing hero on the website.'
		}),
		defineField({
			name: 'floorplans',
			title: 'Floorplans',
			type: 'array',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })]
		}),
		defineField({
			name: 'videoUrl',
			title: 'Video URL',
			type: 'url'
		}),
		defineField({
			name: 'virtualTourUrl',
			title: 'Virtual tour URL',
			type: 'url'
		}),
		defineField({
			name: 'brochure',
			title: 'Brochure',
			type: 'mediaAssetMetadata',
			description:
				'The downloadable property brochure. Stays internal-only until "Brochure public" is ticked.'
		}),
		defineField({
			name: 'brochurePublic',
			title: 'Brochure public',
			type: 'boolean',
			initialValue: false,
			description: 'Tick to expose the brochure to public buyers. Off by default.'
		})
	],
	preview: {
		select: {
			firstAlt: 'gallery.0.altText',
			brochurePublic: 'brochurePublic',
			galleryCount: 'gallery'
		},
		prepare({ firstAlt, brochurePublic, galleryCount }) {
			const count = Array.isArray(galleryCount) ? galleryCount.length : 0;
			return {
				title: firstAlt || 'Media',
				subtitle: [count ? `${count} gallery item(s)` : null, brochurePublic ? 'Brochure public' : 'Brochure internal']
					.filter(Boolean)
					.join(' · ')
			};
		}
	}
});
