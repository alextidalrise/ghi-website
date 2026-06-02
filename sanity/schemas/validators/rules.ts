import type { StringRule } from 'sanity';

type PricingValue = {
	price?: number | null;
	priceFrom?: number | null;
	priceTo?: number | null;
	priceDisplay?: string | null;
	priceSourceStatus?: string | null;
	availabilityStatus?: string | null;
	publicVisibility?: string | null;
};

type MediaAssetValue = {
	assetBrandingType?: string | null;
	imageRightsStatus?: string | null;
	publicUseApproved?: boolean | null;
};

/** Public price cannot rely on folder_hint_only source status. */
export function validatePricingFields(value: PricingValue | undefined) {
	if (!value) return true;

	const hasPublicPrice =
		value.price != null ||
		value.priceFrom != null ||
		value.priceTo != null ||
		(Boolean(value.priceDisplay) && value.priceDisplay !== 'POA');

	if (value.priceSourceStatus === 'folder_hint_only' && hasPublicPrice) {
		return 'Public price cannot be published when price source status is "Folder hint only".';
	}

	if (
		value.availabilityStatus === 'reserved' &&
		value.publicVisibility &&
		!['hidden', 'internal_only'].includes(value.publicVisibility)
	) {
		return 'Reserved items must have public visibility set to Hidden or Internal only.';
	}

	return true;
}

/** Restricted assets cannot be marked public-use approved. */
export function validateMediaAssetMetadata(value: MediaAssetValue | undefined) {
	if (!value) return true;

	const blockedRights = new Set(['restricted', 'do_not_use', 'rejected']);

	if (blockedRights.has(value.imageRightsStatus ?? '') && value.publicUseApproved) {
		return 'Assets marked rejected (or legacy restricted/do-not-use) cannot be approved for public use.';
	}

	return true;
}

/** Commission visibility must remain private/internal for v1. */
export function validatePrivateReportingFields(value: { commissionVisibility?: string } | undefined) {
	if (!value) return true;

	if (value.commissionVisibility && value.commissionVisibility !== 'private_internal') {
		return 'Commission visibility must remain private/internal for v1.';
	}

	return true;
}

/** Fees and tax visibility must remain private/internal for v1. */
export function validateFeesTaxVisibility(value: string | undefined) {
	if (value && value !== 'private_internal') {
		return 'Fees and tax visibility must remain private/internal for v1.';
	}

	return true;
}

/** Map privacy rules for location fields. Country/location refs are auto-derived from community. */
export function validateLocationFields(
	value:
		| {
				mapPrivacyLevel?: string;
				mapDisplayApproved?: boolean;
				coordinates?: { lat?: number; lng?: number };
		  }
		| undefined
) {
	if (!value) return true;

	if (value.mapPrivacyLevel === 'exact' && value.coordinates && !value.mapDisplayApproved) {
		return 'Exact map privacy requires map display approval when coordinates are set.';
	}

	return true;
}

/** GHI listing ID format: GHI followed by 5 digits. */
export function ghiListingIdRule(Rule: StringRule) {
	return Rule.required().regex(/^GHI[0-9]{5}$/, {
		name: 'GHI ID',
		invert: false
	});
}
