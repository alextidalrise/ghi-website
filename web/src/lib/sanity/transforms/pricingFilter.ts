export type PricingInput = {
	price?: number | null;
	priceFrom?: number | null;
	priceTo?: number | null;
	priceDisplay?: string | null;
	currency?: string | null;
	priceQualifier?: string | null;
	priceSourceStatus?: string | null;
	availabilityStatus?: string | null;
	completionStatus?: string | null;
	completionDate?: string | null;
	buildStatus?: string | null;
	publicVisibility?: string | null;
};

export type PublicPricing = Omit<PricingInput, 'priceSourceStatus' | 'publicVisibility'>;

/**
 * Strip price fields when source is folder_hint_only (defence in depth after GROQ allowlist).
 * Also removes governance fields from the public payload.
 */
export function filterPublicPricing(pricing: PricingInput | null | undefined): PublicPricing | null {
	if (!pricing) {
		return null;
	}

	const visibility = pricing.publicVisibility ?? 'visible';
	if (visibility !== 'visible' || pricing.availabilityStatus === 'reserved') {
		return null;
	}

	const { priceSourceStatus, publicVisibility: _visibility, ...rest } = pricing;

	if (priceSourceStatus === 'folder_hint_only') {
		return {
			...rest,
			price: undefined,
			priceFrom: undefined,
			priceTo: undefined,
			priceDisplay: pricing.priceDisplay === 'POA' ? 'POA' : undefined
		};
	}

	return rest;
}
