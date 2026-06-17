import { defineField, defineType } from 'sanity';

/**
 * Pricing for a single property listing. Unlike the shared `pricingFields`
 * (developments / units / unit types), a property has no price range, qualifier,
 * confirmation gate, or availability/completion/build status: it shows its
 * numeric price directly. To hide the number, type "POA" into Price display.
 */
export const propertyPricingFields = defineType({
	name: 'propertyPricingFields',
	title: 'Pricing',
	type: 'object',
	fields: [
		defineField({
			name: 'price',
			title: 'Price',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'priceDisplay',
			title: 'Price display',
			type: 'string',
			description:
				'Optional override text shown to buyers (e.g. "€895,000", "POA"). Type "POA" to hide the numeric price.'
		}),
		defineField({
			name: 'currency',
			title: 'Currency',
			type: 'string',
			initialValue: 'EUR',
			validation: (Rule) => Rule.max(3)
		})
	],
	preview: {
		select: {
			priceDisplay: 'priceDisplay',
			currency: 'currency'
		},
		prepare({ priceDisplay, currency }) {
			return {
				title: priceDisplay || 'Pricing',
				subtitle: currency || undefined
			};
		}
	}
});
