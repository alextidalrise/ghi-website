import { defineArrayMember, defineField, defineType } from 'sanity';
import {
	CHANNEL_KEYS,
	CHANNEL_READINESS_STATUSES,
	CONTENT_STATUSES,
	PUBLISH_READINESS
} from '../constants/enums';
import { ReviewItemsInput } from '../../components/ReviewItemsInput';

type ReviewItemEntry = {
	blocksPublish?: boolean;
};

export const channelReadinessItem = defineType({
	name: 'channelReadinessItem',
	title: 'Channel readiness',
	type: 'object',
	fields: [
		defineField({
			name: 'channel',
			title: 'Channel',
			type: 'string',
			options: { list: [...CHANNEL_KEYS], layout: 'dropdown' },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'status',
			title: 'Status',
			type: 'string',
			options: { list: [...CHANNEL_READINESS_STATUSES], layout: 'dropdown' },
			initialValue: 'not_ready',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'notes',
			title: 'Notes',
			type: 'string'
		})
	],
	preview: {
		select: { title: 'channel', subtitle: 'status' }
	}
});

export const workflowFields = defineType({
	name: 'workflowFields',
	title: 'Workflow & readiness',
	type: 'object',
	description: 'Private/internal workflow fields — never returned in public payloads.',
	fields: [
		defineField({
			name: 'contentStatus',
			title: 'Content status',
			type: 'string',
			options: { list: [...CONTENT_STATUSES], layout: 'dropdown' },
			initialValue: 'draft',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'publishReadiness',
			title: 'Publish readiness',
			type: 'string',
			options: { list: [...PUBLISH_READINESS], layout: 'dropdown' },
			initialValue: 'metadata_only',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'channelReadiness',
			title: 'Channel readiness',
			type: 'array',
			of: [defineArrayMember({ type: 'channelReadinessItem' })]
		}),
		defineField({
			name: 'reviewItems',
			title: 'Review items',
			type: 'array',
			of: [defineArrayMember({ type: 'reviewItem' })],
			description: 'Structured review queue — use instead of legacy string arrays.',
			components: {
				input: ReviewItemsInput
			}
		}),
		defineField({
			name: 'factsNeedingConfirmation',
			title: 'Facts needing confirmation (legacy)',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Deprecated — use review items instead.',
			hidden: true
		}),
		defineField({
			name: 'missingSourceFields',
			title: 'Missing source fields (legacy)',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Deprecated — use review items instead.',
			hidden: true
		}),
		defineField({
			name: 'approvalNotes',
			title: 'Approval notes',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'approvedBy',
			title: 'Approved by',
			type: 'string',
			description: 'Any approved team member — capture identity rather than hard-coding a single owner.'
		}),
		defineField({
			name: 'approvedAt',
			title: 'Approved at',
			type: 'datetime'
		}),
		defineField({
			name: 'lastSourceReviewAt',
			title: 'Last source review at',
			type: 'datetime'
		}),
		defineField({
			name: 'doNotPublishReason',
			title: 'Do not publish reason',
			type: 'text',
			rows: 3,
			description: 'Private/internal blocker — never expose publicly.'
		}),
		defineField({
			name: 'humanReviewed',
			title: 'Human reviewed',
			type: 'boolean',
			initialValue: false
		})
	],
	validation: (Rule) =>
		Rule.custom((value) => {
			if (!value) return true;

			const readiness = value.publishReadiness as string | undefined;
			const reviewItems = (value.reviewItems ?? []) as ReviewItemEntry[];
			const legacyFacts = value.factsNeedingConfirmation as string[] | undefined;
			const doNotPublish = value.doNotPublishReason as string | undefined;

			const blockers = reviewItems.filter((item) => item.blocksPublish);

			if (readiness === 'approved_for_publish' && blockers.length > 0) {
				return `Cannot approve for publish: ${blockers.length} publish-blocking review item(s) remain.`;
			}

			if (
				readiness === 'approved_for_publish' &&
				Array.isArray(legacyFacts) &&
				legacyFacts.length > 0
			) {
				return 'Cannot approve for publish while legacy facts still need confirmation.';
			}

			if (readiness === 'approved_for_publish' && doNotPublish) {
				return 'Cannot approve for publish while a do-not-publish reason is set.';
			}

			if (readiness === 'approved_for_publish' && !value.approvedBy) {
				return 'Approved for publish requires an approver identity.';
			}

			return true;
		}),
	preview: {
		select: {
			contentStatus: 'contentStatus',
			publishReadiness: 'publishReadiness'
		},
		prepare({ contentStatus, publishReadiness }) {
			return {
				title: publishReadiness || 'Workflow',
				subtitle: contentStatus
			};
		}
	}
});
