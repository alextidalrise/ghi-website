export type PricingInput = {
	price?: number | null;
	priceFrom?: number | null;
	priceTo?: number | null;
	priceDisplay?: string | null;
	currency?: string | null;
	priceQualifier?: string | null;
	priceConfirmed?: boolean | null;
	availabilityStatus?: string | null;
	completionStatus?: string | null;
	completionDate?: string | null;
	buildStatus?: string | null;
};

export type PublicPricing = Omit<PricingInput, 'priceConfirmed'>;

/**
 * Public-facing pricing projection.
 *
 * The document-level `status` gate decides whether ANY pricing renders at all,
 * so this transform no longer cares about visibility or reserved availability.
 * Its only job is to enforce POA fallback when `priceConfirmed` is false:
 * numeric prices are stripped, `priceDisplay` collapses to "POA".
 */
export function filterPublicPricing(pricing: PricingInput | null | undefined): PublicPricing | null {
	if (!pricing) {
		return null;
	}

	const { priceConfirmed, ...rest } = pricing;

	if (priceConfirmed === false) {
		return {
			...rest,
			price: undefined,
			priceFrom: undefined,
			priceTo: undefined,
			priceDisplay: 'POA'
		};
	}

	return rest;
}
