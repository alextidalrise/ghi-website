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
			description: 'Public when attached to an approved public asset.'
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
			initialValue: 'unknown'
		}),
		defineField({
			name: 'imageRightsStatus',
			title: 'Image rights status',
			type: 'string',
			options: { list: [...IMAGE_RIGHTS_STATUSES], layout: 'dropdown' },
			initialValue: 'assumed_approved',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'publicUseApproved',
			title: 'Public use approved',
			type: 'boolean',
			initialValue: false,
			description:
				'Required for non-GHI branded assets before public output. Blocked when rights status is restricted or do-not-use.'
		}),
		defineField({
			name: 'requiresRebrandOrCrop',
			title: 'Requires rebrand or crop',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'brandingNotes',
			title: 'Branding notes',
			type: 'text',
			rows: 3,
			description: 'Private/internal — never expose publicly.'
		}),
		defineField({
			name: 'imageUsageNotes',
			title: 'Image usage notes',
			type: 'text',
			rows: 3,
			description: 'Private/internal — never expose publicly.'
		}),
		defineField({
			name: 'sourceDriveFileId',
			title: 'Source Drive file ID',
			type: 'string',
			description: 'Private/internal — never expose publicly.'
		}),
		defineField({
			name: 'sourceMediaFolderUrl',
			title: 'Source media folder URL',
			type: 'url',
			description: 'Private/internal — never expose publicly.'
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
