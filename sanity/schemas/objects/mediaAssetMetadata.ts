import { defineField, defineType } from 'sanity';

export const mediaAssetMetadata = defineType({
	name: 'mediaAssetMetadata',
	title: 'Media asset metadata',
	type: 'object',
	fields: [
		defineField({
			name: 'asset',
			title: 'Asset',
			type: 'image',
			options: { hotspot: true },
			fields: [
				defineField({
					name: 'alt',
					title: 'Alt text (legacy)',
					type: 'string',
					hidden: true
				})
			]
		}),
		defineField({
			name: 'fileAsset',
			title: 'File asset',
			description: 'Use for brochures, PDFs, and non-image files.',
			type: 'file'
		}),
		defineField({
			name: 'altText',
			title: 'Alt text',
			type: 'string',
			description:
				'Descriptive text for screen readers and search engines (e.g. "Living room with sea view").'
		}),
		defineField({
			name: 'sourceDriveFileId',
			title: 'Source Drive file ID',
			type: 'string',
			description: 'Internal Google Drive file ID for this image. For provenance tracking only.'
		}),
		defineField({
			name: 'sourceMediaFolderUrl',
			title: 'Source media folder URL',
			type: 'url',
			description: 'Internal link to the folder where this image was sourced. Not shown on the website.'
		}),
		defineField({
			name: 'sourceFileName',
			title: 'Source file name',
			type: 'string',
			description: 'The original file name from the source folder (e.g. villa_front_v2.jpg). For internal tracking only.'
		})
	],
	preview: {
		select: {
			title: 'altText',
			media: 'asset'
		},
		prepare({ title, media }) {
			return {
				title: title || 'Media asset',
				media
			};
		}
	}
});
