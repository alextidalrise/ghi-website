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
		'Internal audit record of where a specific piece of information came from. None of these fields are shown on the website.',
	fields: [
		defineField({
			name: 'factField',
			title: 'Fact / field',
			type: 'string',
			description: 'The field or claim this record supports (e.g. price, bedrooms, golf course distance).'
		}),
		defineField({
			name: 'sourceFolderUrl',
			title: 'Source folder URL',
			type: 'url',
			description: 'Internal Google Drive reference for this source. Not shown on the website.'
		}),
		defineField({
			name: 'sourceFolderId',
			title: 'Source folder ID',
			type: 'string',
			description: 'Internal Google Drive reference for this source. Not shown on the website.'
		}),
		defineField({
			name: 'driveFolderReference',
			title: 'Drive folder reference',
			type: 'string',
			description: 'Internal Google Drive reference for this source. Not shown on the website.'
		}),
		defineField({
			name: 'sourceFileReferences',
			title: 'Source file references',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Internal list of source file names or IDs. Not shown on the website.'
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
			initialValue: 'unknown',
			description: 'How confident we are that this information is accurate (e.g. confirmed, uncertain, unverified).'
		}),
		defineField({
			name: 'publicSafeStatus',
			title: 'Public safe status',
			type: 'string',
			options: { list: [...PUBLIC_SAFE_STATUSES], layout: 'dropdown' },
			initialValue: 'unknown',
			description: 'Whether this piece of information has been reviewed and confirmed safe to show on the website.'
		}),
		defineField({
			name: 'notes',
			title: 'Internal notes',
			type: 'text',
			rows: 3,
			description: 'Internal notes from when this information was extracted or reviewed. Not shown on the website.'
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
