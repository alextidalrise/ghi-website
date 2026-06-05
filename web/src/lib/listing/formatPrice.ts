import type { PublicPricing } from '$lib/sanity/transforms/pricingFilter';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
	if (!currencyFormatters.has(currency)) {
		currencyFormatters.set(
			currency,
			new Intl.NumberFormat('en-GB', {
				style: 'currency',
				currency,
				maximumFractionDigits: 0
			})
		);
	}
	return currencyFormatters.get(currency)!;
}

function formatAmount(amount: number, currency: string): string {
	return formatter(currency).format(amount);
}

/** Only qualifiers that read naturally in front of a price get a prefix. "exact"
    is the default (the price IS the price) and must not render; "reduced",
    "poa" and "enquiry_led" are handled elsewhere or carry no useful prefix. */
const QUALIFIER_PREFIX: Record<string, string> = {
	from: 'From',
	guide: 'Guide'
};

/** Format public-safe pricing for display. Returns null when no price may be shown. */
export function formatListingPrice(pricing: PublicPricing | null | undefined): string | null {
	if (!pricing) {
		return null;
	}

	if (pricing.priceDisplay === 'POA') {
		return 'POA';
	}

	const currency = pricing.currency ?? 'EUR';

	if (pricing.price != null) {
		const prefix = pricing.priceQualifier ? (QUALIFIER_PREFIX[pricing.priceQualifier] ?? '') : '';
		const amount = formatAmount(pricing.price, currency);
		return prefix ? `${prefix} ${amount}` : amount;
	}

	if (pricing.priceFrom != null && pricing.priceTo != null) {
		return `${formatAmount(pricing.priceFrom, currency)} – ${formatAmount(pricing.priceTo, currency)}`;
	}

	if (pricing.priceFrom != null) {
		return `From ${formatAmount(pricing.priceFrom, currency)}`;
	}

	return pricing.priceDisplay ?? null;
}

export function formatPropertyType(type: string | null | undefined): string {
	if (!type) return '';
	return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatTransactionType(type: string | null | undefined): string {
	if (!type) return '';
	const map: Record<string, string> = {
		sale: 'For sale',
		rent: 'For rent',
		short_term: 'Short term',
		other: 'Enquire'
	};
	return map[type] ?? formatPropertyType(type);
}
