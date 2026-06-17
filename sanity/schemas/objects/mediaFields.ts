import { defineArrayMember, defineField, defineType } from 'sanity';

export const galleryGroup = defineType({
	name: 'galleryGroup',
	title: 'Gallery group',
	type: 'object',
	fields: [
		defineField({
			name: 'title',
			title: 'Group title',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'images',
			title: 'Images',
			type: 'array',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			options: { layout: 'grid' }
		})
	],
	preview: {
		select: { title: 'title', count: 'images' },
		prepare({ title, count }) {
			return {
				title: title || 'Gallery group',
				subtitle: Array.isArray(count) ? `${count.length} image(s)` : undefined
			};
		}
	}
});

export const mediaFields = defineType({
	name: 'mediaFields',
	title: 'Media',
	type: 'object',
	fields: [
		defineField({
			name: 'gallery',
			title: 'Gallery',
			type: 'array',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			options: { layout: 'grid' },
			description: 'The first image is used as the listing hero on the website.'
		}),
		defineField({
			name: 'galleryGroups',
			title: 'Gallery groups',
			type: 'array',
			of: [defineArrayMember({ type: 'galleryGroup' })]
		}),
		defineField({
			name: 'thumbnailOverride',
			title: 'Thumbnail override',
			type: 'mediaAssetMetadata'
		}),
		defineField({
			name: 'floorplans',
			title: 'Floorplans',
			type: 'array',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			options: { layout: 'grid' }
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
