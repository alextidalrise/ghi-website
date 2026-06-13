import { defineArrayMember, defineField, type FieldDefinition } from 'sanity';
import { LISTING_STATUSES } from '../constants/enums';
import { ReviewItemsInput } from '../../components/ReviewItemsInput';

/**
 * Reusable status + reviewItems[] field definitions, applied at the document
 * top level on every gateable doc. Together with `internal` they form the
 * single Studio "Internal" group on each document.
 *
 * Public website rendering keys off `status === 'published'`. The publish
 * gate validator (validators/rules.ts) refuses to set status = 'published'
 * while any reviewItem has blocksPublish = true.
 */
export function statusField(group: string = 'internal'): FieldDefinition<'string'> {
	return defineField({
		name: 'status',
		title: 'Status',
		type: 'string',
		group,
		options: { list: [...LISTING_STATUSES], layout: 'dropdown' },
		initialValue: 'draft',
		validation: (Rule) => Rule.required(),
		description:
			'Lifecycle of this document. The website renders only `published`. To publish, clear all blocking review items first — the publish gate validator enforces this.'
	});
}

export function reviewItemsField(group: string = 'internal') {
	return defineField({
		name: 'reviewItems',
		title: 'Review items',
		type: 'array',
		group,
		of: [defineArrayMember({ type: 'reviewItem' })],
		description:
			'Items flagged for review before this listing can be published. Each item either blocks publish or is a non-blocking note.',
		components: {
			input: ReviewItemsInput
		}
	});
}
