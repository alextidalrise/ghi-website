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

/**
 * Inventory display policy (single source of truth):
 * - withdrawn → drop from public output entirely.
 * - reserved / sold → kept (rendered as a locked, non-clickable inventory row in the UI).
 * - everything else → kept and clickable.
 *
 * Document-level `status` gating is handled upstream by the GROQ filter; this
 * transform only encodes the availability-based display policy.
 */
export function filterDisplayableUnits<T extends UnitLike>(units: T[] | null | undefined): T[] {
	if (!Array.isArray(units)) {
		return [];
	}

	return dedupeById(
		units.filter((unit): unit is T => {
			if (!unit) return false;
			return unit.pricing?.availabilityStatus !== 'withdrawn';
		})
	);
}

/** Same policy applies to typology rows in the inventory. */
export function filterReservedUnitTypes<T extends UnitLike>(unitTypes: T[] | null | undefined): T[] {
	return filterDisplayableUnits(unitTypes);
}

/**
 * Back-compat alias: external callers (and tests) used `filterReservedUnits`
 * for the "exclude unsellable" view. Under the new policy, withdrawn-only is
 * the sole categorical exclusion, so this resolves to `filterDisplayableUnits`.
 */
export const filterReservedUnits = filterDisplayableUnits;
