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

/**
 * Collapse entries that share a defined `_id` to the first occurrence, preserving order.
 * A development's `units[]`/`unitTypes[]` can contain the same document twice when the
 * uploader writes duplicate references (e.g. both a `drafts.`-prefixed and a canonical
 * ref to one unit). Rendered keyed by `_id`, the duplicate trips Svelte's
 * `each_key_duplicate`, a fatal error that aborts the render and takes down the whole
 * client-side router. Entries without an `_id` are left untouched.
 */
function dedupeById<T extends UnitLike>(units: T[]): T[] {
	const seen = new Set<string>();
	return units.filter((unit) => {
		const id = unit?._id;
		if (!id) return true;
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
}

/** Exclude reserved or non-visible child units from development public payloads. */
export function filterReservedUnits<T extends UnitLike>(units: T[] | null | undefined): T[] {
	if (!Array.isArray(units)) {
		return [];
	}

	return dedupeById(
		units.filter((unit): unit is T => {
			if (!unit) return false;

			const pricing = unit.pricing;
			if (!pricing) {
				return true;
			}

			const visibility = pricing.publicVisibility ?? 'visible';
			if (visibility !== 'visible') {
				return false;
			}

			return pricing.availabilityStatus !== 'reserved';
		})
	);
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

	return dedupeById(
		units.filter((unit): unit is T => {
			if (!unit) return false;

			const visibility = unit.pricing?.publicVisibility ?? 'visible';
			return visibility === 'visible';
		})
	);
}
