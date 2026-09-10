import { displayAmount } from '$lib/currency/convert';
import { FALLBACK_RATES, type RateTable } from '$lib/currency/rates';
import type { PublicPricing } from '$lib/sanity/transforms/pricingFilter';

type AmountFormatter = { format(amount: number): string };

const currencyFormatters = new Map<string, AmountFormatter>();

/** Fallback used when a currency code is malformed or empty. `Intl.NumberFormat`
    throws `RangeError` on a code that is not three ASCII letters, so a single bad
    value (a hand-typed or imported code that slipped past the Studio dropdown) would
    otherwise crash every card grid and detail page rendering that listing. Degrade to
    a plain, grouped number prefixed with the raw code instead. */
function fallbackFormatter(currency: string): AmountFormatter {
	const prefix = currency ? `${currency} ` : '';
	return { format: (amount: number) => `${prefix}${amount.toLocaleString('en-GB')}` };
}

function formatter(currency: string): AmountFormatter {
	if (!currencyFormatters.has(currency)) {
		let created: AmountFormatter;
		try {
			created = new Intl.NumberFormat('en-GB', {
				style: 'currency',
				currency,
				maximumFractionDigits: 0
			});
		} catch {
			created = fallbackFormatter(currency);
		}
		currencyFormatters.set(currency, created);
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

/** The marker set before a converted figure. Exported so the one word lives in one place. */
export const APPROX_MARKER = 'approx.';

/**
 * A price broken into the pieces a renderer composes: the qualifier prefix ("From"), the
 * approximation marker (present when `approx`), and the figure itself. `kind` says what
 * the figure is so callers can frame it without inspecting the string (a development
 * frames a bare `single` as a starting price; a `poa` never converts).
 */
export type PriceParts = {
	kind: 'poa' | 'single' | 'range' | 'text';
	prefix: string | null;
	figure: string;
	/** The currency the figure is expressed in. */
	currency: string;
	/** The figure is a rounded conversion, not the listing's own price. */
	approx: boolean;
};

export type PriceDisplayOptions = {
	/** Currency to display in. Absent/unknown/equal to the native currency → native, exact. */
	to?: string | null;
	rates?: RateTable;
};

/**
 * Public-safe pricing as structured parts, optionally converted for display. Returns null
 * when no price may be shown. POA and free-text prices never convert.
 */
export function formatListingPriceParts(
	pricing: PublicPricing | null | undefined,
	{ to = null, rates = FALLBACK_RATES }: PriceDisplayOptions = {}
): PriceParts | null {
	if (!pricing) {
		return null;
	}

	const native = pricing.currency ?? 'EUR';

	if (pricing.priceDisplay === 'POA') {
		return { kind: 'poa', prefix: null, figure: 'POA', currency: native, approx: false };
	}

	const shown = (amount: number) => displayAmount(amount, native, to, rates);

	if (pricing.price != null) {
		const { amount, currency, approx } = shown(pricing.price);
		const prefix = pricing.priceQualifier ? (QUALIFIER_PREFIX[pricing.priceQualifier] ?? null) : null;
		return { kind: 'single', prefix: prefix || null, figure: formatAmount(amount, currency), currency, approx };
	}

	if (pricing.priceFrom != null && pricing.priceTo != null) {
		const lo = shown(pricing.priceFrom);
		const hi = shown(pricing.priceTo);
		return {
			kind: 'range',
			prefix: null,
			figure: `${formatAmount(lo.amount, lo.currency)} – ${formatAmount(hi.amount, hi.currency)}`,
			currency: lo.currency,
			approx: lo.approx
		};
	}

	if (pricing.priceFrom != null) {
		const { amount, currency, approx } = shown(pricing.priceFrom);
		return { kind: 'single', prefix: 'From', figure: formatAmount(amount, currency), currency, approx };
	}

	if (pricing.priceDisplay) {
		return { kind: 'text', prefix: null, figure: pricing.priceDisplay, currency: native, approx: false };
	}

	return null;
}

/** Compose parts back into one line: "From approx. £412,000". */
export function composePrice(parts: PriceParts): string {
	return [parts.prefix, parts.approx ? APPROX_MARKER : null, parts.figure]
		.filter((part): part is string => Boolean(part))
		.join(' ');
}

/** Format public-safe pricing for display. Returns null when no price may be shown. */
export function formatListingPrice(
	pricing: PublicPricing | null | undefined,
	options?: PriceDisplayOptions
): string | null {
	const parts = formatListingPriceParts(pricing, options);
	return parts ? composePrice(parts) : null;
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
