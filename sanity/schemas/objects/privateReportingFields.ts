import { defineField, defineType } from 'sanity';
import { COMMISSION_VISIBILITY } from '../constants/enums';
import { validatePrivateReportingFields } from '../validators/rules';

export const privateReportingFields = defineType({
	name: 'privateReportingFields',
	title: 'Private reporting (commission)',
	type: 'object',
	description:
		'Private/internal commission and financial reporting — never expose to public pages, APIs, SEO, or customer-facing content.',
	fields: [
		defineField({
			name: 'commissionAmount',
			title: 'Commission amount',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'commissionPercentage',
			title: 'Commission percentage',
			type: 'number',
			validation: (Rule) => Rule.min(0).max(100)
		}),
		defineField({
			name: 'commissionCurrency',
			title: 'Commission currency',
			type: 'string',
			initialValue: 'EUR',
			validation: (Rule) => Rule.max(3)
		}),
		defineField({
			name: 'commissionNotes',
			title: 'Commission notes',
			type: 'text',
			rows: 3
		}),
		defineField({
			name: 'commissionSource',
			title: 'Commission source',
			type: 'string'
		}),
		defineField({
			name: 'commissionVisibility',
			title: 'Commission visibility',
			type: 'string',
			options: { list: [...COMMISSION_VISIBILITY], layout: 'dropdown' },
			initialValue: 'private_internal',
			readOnly: true,
			validation: (Rule) => Rule.required()
		})
	],
	validation: (Rule) =>
		Rule.custom((value) =>
			validatePrivateReportingFields(value as Parameters<typeof validatePrivateReportingFields>[0])
		),
	preview: {
		select: {
			commissionPercentage: 'commissionPercentage',
			commissionAmount: 'commissionAmount',
			commissionCurrency: 'commissionCurrency'
		},
		prepare({ commissionPercentage, commissionAmount, commissionCurrency }) {
			const parts = [
				commissionPercentage != null ? `${commissionPercentage}%` : null,
				commissionAmount != null ? `${commissionAmount} ${commissionCurrency || 'EUR'}` : null
			].filter(Boolean);

			return {
				title: 'Commission (private)',
				subtitle: parts.length ? parts.join(' · ') : 'No commission data'
			};
		}
	}
});
