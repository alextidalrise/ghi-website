import type { PublicPropertyListing } from '$lib/sanity/transforms';

type Pricing = NonNullable<PublicPropertyListing['pricing']>;

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

/** Format public-safe pricing for display. Returns null when no price may be shown. */
export function formatListingPrice(pricing: Pricing | null | undefined): string | null {
	if (!pricing) {
		return null;
	}

	if (pricing.priceDisplay === 'POA') {
		return 'POA';
	}

	const currency = pricing.currency ?? 'EUR';

	if (pricing.price != null) {
		const qualifier = pricing.priceQualifier ? `${pricing.priceQualifier} ` : '';
		return `${qualifier}${formatAmount(pricing.price, currency)}`.trim();
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
