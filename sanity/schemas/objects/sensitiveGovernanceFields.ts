import { defineField, defineType } from 'sanity';
import { SENSITIVE_ASSET_TYPES, SENSITIVE_REVIEW_STATUSES } from '../constants/enums';

export const sensitiveGovernanceFields = defineType({
	name: 'sensitiveGovernanceFields',
	title: 'Sensitive governance',
	type: 'object',
	description:
		'Private/internal summary flags and workflow blockers — never expose details or notes publicly.',
	fields: [
		defineField({
			name: 'sensitiveAssetsPresent',
			title: 'Sensitive assets present',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'sensitiveAssetTypes',
			title: 'Sensitive asset types',
			type: 'array',
			of: [{ type: 'string' }],
			options: { list: SENSITIVE_ASSET_TYPES.map((t) => t.value) }
		}),
		defineField({
			name: 'sensitiveReviewStatus',
			title: 'Sensitive review status',
			type: 'string',
			options: { list: [...SENSITIVE_REVIEW_STATUSES], layout: 'dropdown' },
			initialValue: 'not_required'
		}),
		defineField({
			name: 'sensitiveReviewApprovedBy',
			title: 'Sensitive review approved by',
			type: 'string'
		}),
		defineField({
			name: 'sensitiveReviewApprovedAt',
			title: 'Sensitive review approved at',
			type: 'datetime'
		}),
		defineField({
			name: 'internalOnlyNotes',
			title: 'Internal only notes',
			type: 'text',
			rows: 4,
			description: 'Never expose publicly.'
		}),
		defineField({
			name: 'requiresHumanApproval',
			title: 'Requires human approval',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'legalDocsPresent',
			title: 'Legal docs present',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'legalDocsReviewed',
			title: 'Legal docs reviewed',
			type: 'boolean',
			initialValue: false
		}),
		defineField({
			name: 'legalDocsDriveFolderId',
			title: 'Legal docs Drive folder ID',
			type: 'string',
			description: 'Private/internal — never expose publicly.'
		}),
		defineField({
			name: 'legalPublicUseAllowed',
			title: 'Legal public use allowed',
			type: 'boolean',
			initialValue: false,
			description: 'Defaults to false. Legal/cadastral contents stay in Drive unless explicitly approved.'
		})
	],
	preview: {
		select: {
			sensitiveReviewStatus: 'sensitiveReviewStatus',
			requiresHumanApproval: 'requiresHumanApproval'
		},
		prepare({ sensitiveReviewStatus, requiresHumanApproval }) {
			return {
				title: 'Sensitive governance',
				subtitle: [sensitiveReviewStatus, requiresHumanApproval ? 'Needs approval' : null]
					.filter(Boolean)
					.join(' · ')
			};
		}
	}
});
