import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Single namespace for everything categorically internal: commission, fees and
 * tax, internal notes, source folder URLs and source provenance entries, plus
 * legal docs Drive folder. GROQ allowlists never project `internal` — that is
 * the privacy mechanism. Validators and the public website ignore this object.
 */
export const internalSourceEntry = defineType({
	name: 'internalSourceEntry',
	title: 'Source entry',
	type: 'object',
	fields: [
		defineField({
			name: 'factField',
			title: 'Fact / field',
			type: 'string',
			description: 'The field or claim this record supports (e.g. price, bedrooms, golf distance).'
		}),
		defineField({
			name: 'driveFolderUrl',
			title: 'Drive folder URL',
			type: 'url',
			description: 'Internal Google Drive link for this source. Never shown on the website.'
		}),
		defineField({
			name: 'extractedAt',
			title: 'Extracted at',
			type: 'datetime'
		}),
		defineField({
			name: 'notes',
			title: 'Notes',
			type: 'text',
			rows: 3
		})
	],
	preview: {
		select: { title: 'factField', subtitle: 'driveFolderUrl' }
	}
});

export const internalCommission = defineType({
	name: 'internalCommission',
	title: 'Commission',
	type: 'object',
	fields: [
		defineField({
			name: 'amount',
			title: 'Amount',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'percentage',
			title: 'Percentage',
			type: 'number',
			validation: (Rule) => Rule.min(0).max(100)
		}),
		defineField({
			name: 'currency',
			title: 'Currency',
			type: 'string',
			initialValue: 'EUR',
			validation: (Rule) => Rule.max(3)
		}),
		defineField({
			name: 'notes',
			title: 'Notes',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'source',
			title: 'Source',
			type: 'string',
			description: 'Where this commission figure came from (e.g. developer agreement).'
		})
	],
	preview: {
		select: { percentage: 'percentage', amount: 'amount', currency: 'currency' },
		prepare({ percentage, amount, currency }) {
			const parts = [
				percentage != null ? `${percentage}%` : null,
				amount != null ? `${amount} ${currency || 'EUR'}` : null
			].filter(Boolean);
			return {
				title: 'Commission',
				subtitle: parts.length ? parts.join(' · ') : 'No commission data'
			};
		}
	}
});

export const internalFeesTax = defineType({
	name: 'internalFeesTax',
	title: 'Fees & tax',
	type: 'object',
	fields: [
		defineField({
			name: 'communityFeesAmount',
			title: 'Community fees amount',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'communityFeesPeriod',
			title: 'Community fees period',
			type: 'string',
			description: 'Whether community fees are charged monthly or annually.'
		}),
		defineField({
			name: 'ibiAmount',
			title: 'IBI amount',
			type: 'number',
			description: 'Spanish property tax (IBI) annual amount.',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'garbageTaxAmount',
			title: 'Garbage tax amount',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'source',
			title: 'Source',
			type: 'string'
		})
	]
});

export const internalFields = defineType({
	name: 'internalFields',
	title: 'Internal',
	type: 'object',
	description: 'Categorically private fields. GROQ allowlists never project this object.',
	options: { collapsible: true, collapsed: false },
	fields: [
		defineField({
			name: 'notes',
			title: 'Internal notes',
			type: 'text',
			rows: 4,
			description: 'Sensitive internal notes about this listing. Never shown on the website.'
		}),
		defineField({
			name: 'commission',
			title: 'Commission',
			type: 'internalCommission',
			options: { collapsible: true, collapsed: true }
		}),
		defineField({
			name: 'feesTax',
			title: 'Fees & tax',
			type: 'internalFeesTax',
			options: { collapsible: true, collapsed: true }
		}),
		defineField({
			name: 'sources',
			title: 'Sources & Drive links',
			type: 'array',
			of: [defineArrayMember({ type: 'internalSourceEntry' })],
			description: 'Audit trail of where this listing\'s data came from. Internal only.'
		}),
		defineField({
			name: 'sourceFolderUrl',
			title: 'Primary Drive folder',
			type: 'url',
			description: 'Top-level Drive folder for this listing\'s source files.'
		}),
		defineField({
			name: 'legalDocsDriveFolderId',
			title: 'Legal docs Drive folder ID',
			type: 'string',
			description: 'Internal Drive folder ID for legal documents.'
		}),
		defineField({
			name: 'feedImport',
			title: 'Feed import',
			type: 'object',
			description:
				'Provenance from an automated feed import (e.g. Kyero). The importer writes these; the external resolution agents read them to assign the community. Never shown on the website.',
			options: { collapsible: true, collapsed: true },
			fields: [
				defineField({
					name: 'sourceTown',
					title: 'Source town (raw)',
					type: 'string',
					description:
						"The feed's <town> value, stored verbatim. The importer never resolves it; the external agents map this to a community."
				}),
				defineField({
					name: 'sourceProvince',
					title: 'Source province',
					type: 'string',
					description:
						'Normalized province slug the importer derived deterministically (e.g. "murcia", "alicante"). Fixes the parent location for the community the agents assign.'
				}),
				defineField({
					name: 'importedAt',
					title: 'Imported at',
					type: 'datetime',
					description: 'When the importer last wrote this listing from the feed.'
				}),
				defineField({
					name: 'lastSeenAt',
					title: 'Last seen in feed',
					type: 'datetime',
					readOnly: true,
					description:
						'The most recent sync in which this listing was still present in the feed. Machine-written.'
				}),
				defineField({
					name: 'snapshotJson',
					title: 'Feed snapshot (machine)',
					type: 'text',
					rows: 3,
					readOnly: true,
					description:
						'JSON of the feed-owned field values as of the last sync. The re-sync uses this to detect what the FEED changed (vs what a human edited). Do not edit by hand.'
				}),
				defineField({
					name: 'pendingChanges',
					title: 'Pending feed changes',
					type: 'array',
					description:
						'Changes the feed has made since the last sync, awaiting human approval. The sync never auto-applies these — accept a change by editing the real field, then delete the row here.',
					of: [
						defineArrayMember({
							type: 'object',
							name: 'feedPendingChange',
							fields: [
								defineField({ name: 'field', title: 'Field', type: 'string' }),
								defineField({
									name: 'changeType',
									title: 'Change type',
									type: 'string',
									options: {
										list: [
											{ title: 'Update (field was untouched)', value: 'update' },
											{ title: 'Conflict (you had edited this field)', value: 'conflict' },
											{ title: 'Removed from feed', value: 'removed' }
										]
									},
									description:
										'"update" = the feed changed a field nobody had edited. "conflict" = the feed changed a field a human had already edited.'
								}),
								defineField({ name: 'oldValue', title: 'Current value', type: 'text', rows: 2 }),
								defineField({ name: 'newValue', title: 'New feed value', type: 'text', rows: 2 }),
								defineField({ name: 'detectedAt', title: 'Detected at', type: 'datetime' })
							],
							preview: {
								select: { field: 'field', changeType: 'changeType', newValue: 'newValue' },
								prepare({ field, changeType, newValue }) {
									return {
										title: `${field} — ${changeType}`,
										subtitle: newValue ? `→ ${newValue}` : undefined
									};
								}
							}
						})
					]
				})
			]
		})
	]
});
