import { defineArrayMember, defineField, defineType } from 'sanity';
import {
	CHANNEL_KEYS,
	CHANNEL_READINESS_STATUSES,
	CONTENT_STATUSES,
	PUBLISH_READINESS
} from '../constants/enums';

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
			name: 'factsNeedingConfirmation',
			title: 'Facts needing confirmation',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Publish-blocking facts that must be resolved before approval.'
		}),
		defineField({
			name: 'missingSourceFields',
			title: 'Missing source fields',
			type: 'array',
			of: [{ type: 'string' }]
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
			const blockers = value.factsNeedingConfirmation as string[] | undefined;
			const doNotPublish = value.doNotPublishReason as string | undefined;

			if (
				readiness === 'approved_for_publish' &&
				Array.isArray(blockers) &&
				blockers.length > 0
			) {
				return 'Cannot set publish readiness to approved for publish while facts still need confirmation.';
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
