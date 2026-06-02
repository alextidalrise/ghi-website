import { defineArrayMember, defineField, defineType } from 'sanity';
import { BROCHURE_VISIBILITY } from '../constants/enums';

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
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })]
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
			name: 'heroImage',
			title: 'Hero image',
			type: 'mediaAssetMetadata',
			description: 'The main image displayed at the top of the listing page. Must be approved before it appears publicly.'
		}),
		defineField({
			name: 'gallery',
			title: 'Gallery',
			type: 'array',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })]
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
			description: 'The downloadable property brochure. Hidden by default — must be approved before buyers can access it.'
		}),
		defineField({
			name: 'brochureVisibility',
			title: 'Brochure visibility',
			type: 'string',
			options: { list: [...BROCHURE_VISIBILITY], layout: 'dropdown' },
			initialValue: 'request_only',
			description:
				'Controls whether buyers can download the brochure — disabled, available on request, or openly downloadable. Must be explicitly set to allow downloads.'
		})
	],
	preview: {
		select: {
			heroAlt: 'heroImage.altText',
			brochureVisibility: 'brochureVisibility',
			galleryCount: 'gallery'
		},
		prepare({ heroAlt, brochureVisibility, galleryCount }) {
			const count = Array.isArray(galleryCount) ? galleryCount.length : 0;
			return {
				title: heroAlt || 'Media',
				subtitle: [count ? `${count} gallery item(s)` : null, brochureVisibility]
					.filter(Boolean)
					.join(' · ')
			};
		}
	}
});
