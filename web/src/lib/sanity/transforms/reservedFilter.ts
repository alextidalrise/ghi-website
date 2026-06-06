import type { PricingInput } from './pricingFilter';
import type { MediaAssetInput } from './mediaFilter';

export type UnitLike = {
	_id?: string;
	unitName?: string;
	unitNumber?: string;
	unitTypeName?: string;
	typeName?: string;
	listingKind?: string;
	pricing?: PricingInput | null;
	specs?: Record<string, unknown> | null;
	floorplan?: MediaAssetInput | null;
	floorplans?: MediaAssetInput[] | null;
	unitGallery?: MediaAssetInput[] | null;
	gallery?: MediaAssetInput[] | null;
	[key: string]: unknown;
};

/** Exclude reserved or non-visible child units from development public payloads. */
export function filterReservedUnits<T extends UnitLike>(units: T[] | null | undefined): T[] {
	if (!Array.isArray(units)) {
		return [];
	}

	return units.filter((unit) => {
		const pricing = unit.pricing;
		if (!pricing) {
			return true;
		}

		const visibility = pricing.publicVisibility ?? 'visible';
		if (visibility !== 'visible') {
			return false;
		}

		return pricing.availabilityStatus !== 'reserved';
	});
}

export function filterReservedUnitTypes<T extends UnitLike>(unitTypes: T[] | null | undefined): T[] {
	return filterReservedUnits(unitTypes);
}

/**
 * Units shown in the development inventory table. Hidden/internal/preview units are
 * dropped, but reserved and sold units are KEPT so the table can list them in a
 * locked, non-clickable row (matching the agreed inventory design). Availability
 * gating for clickability happens in the UI, not here.
 */
export function filterDisplayableUnits<T extends UnitLike>(units: T[] | null | undefined): T[] {
	if (!Array.isArray(units)) {
		return [];
	}

	return units.filter((unit) => {
		const visibility = unit.pricing?.publicVisibility ?? 'visible';
		return visibility === 'visible';
	});
}
