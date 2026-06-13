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
		})
	]
});
