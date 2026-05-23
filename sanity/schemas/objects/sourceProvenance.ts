import { defineField, defineType } from 'sanity';
import {
	PUBLIC_SAFE_STATUSES,
	SOURCE_CONFIDENCE,
	SOURCE_EXTRACTION_METHODS
} from '../constants/enums';

export const sourceProvenance = defineType({
	name: 'sourceProvenance',
	title: 'Source provenance',
	type: 'object',
	description:
		'Structured provenance for publish-critical facts and internal reporting. Never expose raw Drive IDs, links, or extraction notes publicly.',
	fields: [
		defineField({
			name: 'factField',
			title: 'Fact / field',
			type: 'string',
			description: 'Which field or claim this provenance record supports (e.g. price, bedrooms, golf).'
		}),
		defineField({
			name: 'sourceFolderUrl',
			title: 'Source folder URL',
			type: 'url',
			description: 'Private/internal — never expose publicly.'
		}),
		defineField({
			name: 'sourceFolderId',
			title: 'Source folder ID',
			type: 'string',
			description: 'Private/internal — never expose publicly.'
		}),
		defineField({
			name: 'driveFolderReference',
			title: 'Drive folder reference',
			type: 'string',
			description: 'Private/internal — never expose publicly.'
		}),
		defineField({
			name: 'sourceFileReferences',
			title: 'Source file references',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Private/internal file names or IDs — never expose publicly.'
		}),
		defineField({
			name: 'sourceExtractedAt',
			title: 'Source extracted at',
			type: 'datetime'
		}),
		defineField({
			name: 'sourceExtractionMethod',
			title: 'Source extraction method',
			type: 'string',
			options: { list: [...SOURCE_EXTRACTION_METHODS], layout: 'dropdown' }
		}),
		defineField({
			name: 'sourceConfidence',
			title: 'Source confidence',
			type: 'string',
			options: { list: [...SOURCE_CONFIDENCE], layout: 'dropdown' },
			initialValue: 'unknown'
		}),
		defineField({
			name: 'publicSafeStatus',
			title: 'Public safe status',
			type: 'string',
			options: { list: [...PUBLIC_SAFE_STATUSES], layout: 'dropdown' },
			initialValue: 'unknown',
			description: 'Whether the sourced fact is safe for public output after review.'
		}),
		defineField({
			name: 'notes',
			title: 'Internal notes',
			type: 'text',
			rows: 3,
			description: 'Private/internal extraction or review notes — never expose publicly.'
		})
	],
	preview: {
		select: {
			factField: 'factField',
			confidence: 'sourceConfidence',
			publicSafeStatus: 'publicSafeStatus'
		},
		prepare({ factField, confidence, publicSafeStatus }) {
			return {
				title: factField || 'Source provenance',
				subtitle: [confidence, publicSafeStatus].filter(Boolean).join(' · ')
			};
		}
	}
});
