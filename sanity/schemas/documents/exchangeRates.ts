import { defineField, defineType } from 'sanity';

/**
 * Exchange-rate settings singleton (currency project, Step 2).
 *
 * A daily Vercel cron (`/api/rates-refresh`) writes `gbpPerEur`/`usdPerEur` from the ECB
 * euro reference rates plus `asOf`/`updatedByCron`. The website converts every native price
 * to a EUR-equivalent for cross-currency sort and filtering (AED is derived from the USD
 * peg). The base rates are cron-owned; the per-rate overrides are the manual lever — set one
 * to pin that currency's rate (as EUR per 1 unit), and the cron leaves it alone.
 */
export const exchangeRates = defineType({
	name: 'exchangeRates',
	title: 'Exchange rates',
	type: 'document',
	fields: [
		defineField({
			name: 'gbpPerEur',
			title: 'GBP per 1 EUR',
			type: 'number',
			description:
				'ECB reference rate: pounds sterling per 1 euro. Written by the daily rates cron.',
			initialValue: 0.85898,
			validation: (Rule) => Rule.positive()
		}),
		defineField({
			name: 'usdPerEur',
			title: 'USD per 1 EUR',
			type: 'number',
			description:
				'ECB reference rate: US dollars per 1 euro. Written by the daily rates cron. AED is derived from this via the fixed 3.6725 AED/USD peg.',
			initialValue: 1.1652,
			validation: (Rule) => Rule.positive()
		}),
		defineField({
			name: 'asOf',
			title: 'Rates as of',
			type: 'date',
			description: 'ECB publication date of the base rates above. Written by the cron.'
		}),
		defineField({
			name: 'updatedByCron',
			title: 'Last cron update',
			type: 'datetime',
			description: 'When the rates cron last wrote this document. For reference only.',
			readOnly: true
		}),
		defineField({
			name: 'gbpOverride',
			title: 'GBP override (EUR per 1 GBP)',
			type: 'number',
			description:
				'Optional manual pin for the GBP rate, expressed as euros per 1 pound. Set it to override the cron-derived rate; clear it to hand control back to the cron.',
			validation: (Rule) => Rule.positive()
		}),
		defineField({
			name: 'usdOverride',
			title: 'USD override (EUR per 1 USD)',
			type: 'number',
			description: 'Optional manual pin for the USD rate, expressed as euros per 1 dollar.',
			validation: (Rule) => Rule.positive()
		}),
		defineField({
			name: 'aedOverride',
			title: 'AED override (EUR per 1 AED)',
			type: 'number',
			description:
				'Optional manual pin for the AED rate, expressed as euros per 1 dirham. Overrides the value derived from the USD peg.',
			validation: (Rule) => Rule.positive()
		})
	],
	preview: {
		select: { asOf: 'asOf' },
		prepare({ asOf }) {
			return { title: 'Exchange rates', subtitle: asOf ? `as of ${asOf}` : 'not yet refreshed' };
		}
	}
});
