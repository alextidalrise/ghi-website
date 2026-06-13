import { defineField, defineType } from 'sanity';
import {
	AVAILABILITY_STATUSES,
	BUILD_STATUSES,
	COMPLETION_STATUSES,
	PRICE_QUALIFIERS
} from '../constants/enums';
import { validatePricingFields } from '../validators/rules';

export const pricingFields = defineType({
	name: 'pricingFields',
	title: 'Pricing & availability',
	type: 'object',
	fields: [
		defineField({
			name: 'price',
			title: 'Price',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'priceFrom',
			title: 'Price from',
			type: 'number',
			description: 'The lowest price in the range. Used for developments — shown publicly once approved.',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'priceTo',
			title: 'Price to',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'priceDisplay',
			title: 'Price display',
			type: 'string',
			description:
				'Optional override text shown to buyers (e.g. "From €450,000", "POA"). When `priceConfirmed` is false, the website renders POA regardless of numeric price.'
		}),
		defineField({
			name: 'currency',
			title: 'Currency',
			type: 'string',
			initialValue: 'EUR',
			validation: (Rule) => Rule.max(3)
		}),
		defineField({
			name: 'priceQualifier',
			title: 'Price qualifier',
			type: 'string',
			options: { list: [...PRICE_QUALIFIERS], layout: 'dropdown' }
		}),
		defineField({
			name: 'priceConfirmed',
			title: 'Price confirmed',
			type: 'boolean',
			initialValue: false,
			description:
				'Tick once the numeric price has been confirmed against a reliable source. While unticked the website renders POA regardless of any numeric price entered above.'
		}),
		defineField({
			name: 'availabilityStatus',
			title: 'Availability status',
			type: 'string',
			options: { list: [...AVAILABILITY_STATUSES], layout: 'dropdown' },
			initialValue: 'unknown',
			validation: (Rule) => Rule.required(),
			description:
				'Whether this unit/listing is on the market. Reserved/sold units render as locked rows in the inventory; withdrawn units drop entirely. Use the document-level Status to take a listing offline.'
		}),
		defineField({
			name: 'completionStatus',
			title: 'Completion status',
			type: 'string',
			options: { list: [...COMPLETION_STATUSES], layout: 'dropdown' }
		}),
		defineField({
			name: 'completionDate',
			title: 'Completion date',
			type: 'date'
		}),
		defineField({
			name: 'buildStatus',
			title: 'Build status',
			type: 'string',
			options: { list: [...BUILD_STATUSES], layout: 'dropdown' }
		})
	],
	validation: (Rule) =>
		Rule.custom((value) => validatePricingFields(value as Parameters<typeof validatePricingFields>[0])),
	preview: {
		select: {
			priceDisplay: 'priceDisplay',
			currency: 'currency',
			availabilityStatus: 'availabilityStatus'
		},
		prepare({ priceDisplay, currency, availabilityStatus }) {
			return {
				title: priceDisplay || 'Pricing',
				subtitle: [currency, availabilityStatus].filter(Boolean).join(' · ')
			};
		}
	}
});
