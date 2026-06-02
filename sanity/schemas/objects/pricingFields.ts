import { defineField, defineType } from 'sanity';
import {
	AVAILABILITY_STATUSES,
	BUILD_STATUSES,
	COMPLETION_STATUSES,
	FEES_TAX_VISIBILITY,
	PRICE_QUALIFIERS,
	PRICE_SOURCE_STATUSES,
	PUBLIC_VISIBILITY
} from '../constants/enums';
import { validateFeesTaxVisibility, validatePricingFields } from '../validators/rules';

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
			description: 'The price text shown to buyers on the website (e.g. "From €450,000", "POA", "Sold"). Must be approved before it goes live.'
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
			name: 'priceSourceStatus',
			title: 'Price source status',
			type: 'string',
			options: { list: [...PRICE_SOURCE_STATUSES], layout: 'dropdown' },
			initialValue: 'unknown',
			validation: (Rule) => Rule.required(),
			description: 'Records where the price came from. A price based only on a folder hint cannot be displayed publicly.'
		}),
		defineField({
			name: 'priceReviewedAt',
			title: 'Price reviewed at',
			type: 'datetime'
		}),
		defineField({
			name: 'priceReviewedBy',
			title: 'Price reviewed by',
			type: 'string'
		}),
		defineField({
			name: 'availabilityStatus',
			title: 'Availability status',
			type: 'string',
			options: { list: [...AVAILABILITY_STATUSES], layout: 'dropdown' },
			initialValue: 'unknown',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'publicVisibility',
			title: 'Public visibility',
			type: 'string',
			options: { list: [...PUBLIC_VISIBILITY], layout: 'dropdown' },
			initialValue: 'visible',
			description: 'Controls whether this listing appears on the website. Reserved listings must be set to hidden or internal — they will not appear publicly.'
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
		}),
		defineField({
			name: 'communityFeesAmount',
			title: 'Community fees amount',
			type: 'number',
			description: 'Annual community fees for this property. Internal only — not shown on the website yet.',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'communityFeesPeriod',
			title: 'Community fees period',
			type: 'string',
			description: 'Whether community fees are charged monthly or annually. Internal only.'
		}),
		defineField({
			name: 'ibiAmount',
			title: 'IBI amount',
			type: 'number',
			description: 'Spanish property tax (IBI) annual amount. Internal only — not shown on the website yet.',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'garbageTaxAmount',
			title: 'Garbage tax amount',
			type: 'number',
			description: 'Annual garbage collection tax. Internal only — not shown on the website yet.',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'feesTaxSource',
			title: 'Fees / tax source',
			type: 'string',
			description: 'Where the fees and tax figures came from. Internal use only.'
		}),
		defineField({
			name: 'feesTaxVisibility',
			title: 'Fees / tax visibility',
			type: 'string',
			options: { list: [...FEES_TAX_VISIBILITY], layout: 'dropdown' },
			initialValue: 'private_internal',
			readOnly: true,
			validation: (Rule) => Rule.custom((value) => validateFeesTaxVisibility(value))
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
