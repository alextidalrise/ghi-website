import { defineField, defineType } from 'sanity';
import {
	ASSET_BRANDING_TYPES,
	ASSET_CATEGORIES,
	IMAGE_RIGHTS_STATUSES
} from '../constants/enums';
import { validateMediaAssetMetadata } from '../validators/rules';

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
			name: 'assetCategory',
			title: 'Asset category',
			type: 'string',
			options: { list: [...ASSET_CATEGORIES], layout: 'dropdown' }
		}),
		defineField({
			name: 'order',
			title: 'Display order',
			type: 'number',
			validation: (Rule) => Rule.min(0).integer()
		}),
		defineField({
			name: 'altText',
			title: 'Alt text',
			type: 'string',
			description: 'Descriptive text for screen readers and search engines (e.g. "Living room with sea view"). Required for accessibility on approved public images.'
		}),
		defineField({
			name: 'caption',
			title: 'Caption',
			type: 'string'
		}),
		defineField({
			name: 'assetBrandingType',
			title: 'Asset branding type',
			type: 'string',
			options: { list: [...ASSET_BRANDING_TYPES], layout: 'dropdown' },
			initialValue: 'unknown',
			description: 'Whether this image carries GHI branding, developer branding, or is unbranded.'
		}),
		defineField({
			name: 'imageRightsStatus',
			title: 'Image rights status',
			type: 'string',
			options: { list: [...IMAGE_RIGHTS_STATUSES], layout: 'dropdown' },
			initialValue: 'source_pack_provided',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'publicUseApproved',
			title: 'Public use approved',
			type: 'boolean',
			initialValue: false,
			description:
				'Tick to approve this image for use on the website. Required for any non-GHI branded image, and only valid when image rights have been confirmed.'
		}),
		defineField({
			name: 'requiresRebrandOrCrop',
			title: 'Requires rebrand or crop',
			type: 'boolean',
			initialValue: false,
			description: 'Tick if this image needs to be rebranded or cropped before it can be used on the website.'
		}),
		defineField({
			name: 'brandingNotes',
			title: 'Branding notes',
			type: 'text',
			rows: 3,
			description: 'Internal notes about branding work needed for this image. Not shown on the website.'
		}),
		defineField({
			name: 'imageUsageNotes',
			title: 'Image usage notes',
			type: 'text',
			rows: 3,
			description: 'Internal notes about how or where this image may be used. Not shown on the website.'
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
		}),
		defineField({
			name: 'approvedBy',
			title: 'Approved by',
			type: 'string'
		}),
		defineField({
			name: 'approvedAt',
			title: 'Approved at',
			type: 'datetime'
		})
	],
	validation: (Rule) =>
		Rule.custom((value) => validateMediaAssetMetadata(value as Parameters<typeof validateMediaAssetMetadata>[0])),
	preview: {
		select: {
			title: 'altText',
			caption: 'caption',
			category: 'assetCategory',
			media: 'asset'
		},
		prepare({ title, caption, category, media }) {
			return {
				title: title || caption || 'Media asset',
				subtitle: category,
				media
			};
		}
	}
});
