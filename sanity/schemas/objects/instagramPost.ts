import { defineArrayMember, defineField, defineType } from 'sanity';
import { InstagramGalleryInput } from '../../components/InstagramGalleryInput';

/** Instagram carousels accept at most 10 items. */
export const INSTAGRAM_MAX_IMAGES = 10;

export const instagramPostImage = defineType({
	name: 'instagramPostImage',
	title: 'Instagram post image',
	type: 'object',
	fields: [
		defineField({
			name: 'assetRef',
			title: 'Asset reference',
			type: 'string',
			description: 'The Sanity image asset ID. This is what a publisher actually posts.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'sourceKey',
			title: 'Source key',
			type: 'string',
			description: 'The _key of the gallery entry this image was picked from.'
		}),
		defineField({
			name: 'sourcePath',
			title: 'Source path',
			type: 'string',
			description: 'Where the image came from, e.g. "media.gallery" or "parentDevelopment.sharedGallery".'
		}),
		defineField({
			name: 'altText',
			title: 'Alt text',
			type: 'string'
		})
	],
	preview: {
		select: { title: 'altText', subtitle: 'sourcePath' },
		prepare({ title, subtitle }) {
			return { title: title || 'Selected image', subtitle };
		}
	}
});

export const instagramPost = defineType({
	name: 'instagramPost',
	title: 'Instagram post',
	type: 'object',
	description:
		"Which of this listing's images go into its Instagram post, and in what order. Selection only — this never adds new images and is never shown on the public website.",
	fields: [
		defineField({
			name: 'images',
			title: 'Post images',
			type: 'array',
			of: [defineArrayMember({ type: 'instagramPostImage' })],
			components: { input: InstagramGalleryInput },
			validation: (Rule) =>
				Rule.max(INSTAGRAM_MAX_IMAGES).error(
					`An Instagram carousel holds at most ${INSTAGRAM_MAX_IMAGES} images.`
				)
		})
	],
	preview: {
		select: { images: 'images' },
		prepare({ images }) {
			const count = Array.isArray(images) ? images.length : 0;
			return {
				title: 'Instagram post',
				subtitle: count === 0 ? 'No images selected' : `${count} image(s) selected`
			};
		}
	}
});
