import type { DevelopmentDisplayMode, PublicDevelopment } from '$lib/sanity/transforms';

/** Whether development-level pricing may appear in hero and key facts. */
export function shouldShowDevelopmentPricing(
	displayMode: DevelopmentDisplayMode | null | undefined
): boolean {
	return displayMode !== 'enquiry_led';
}

export function showsUnitTypes(displayMode: DevelopmentDisplayMode | null | undefined): boolean {
	return displayMode === 'unit_types';
}

export function showsUnits(displayMode: DevelopmentDisplayMode | null | undefined): boolean {
	return displayMode === 'units';
}

export function showsPriceSummary(displayMode: DevelopmentDisplayMode | null | undefined): boolean {
	return displayMode === 'price_from_summary';
}

export function formatEnumLabel(value: string | null | undefined): string {
	if (!value) return '';
	return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Statuses that keep a unit browsable: it still links through to its own page. */
const AVAILABLE_STATUSES = new Set(['available', 'coming_soon', 'under_offer']);

/** A unit carrying no explicit status is treated as available. */
export function isUnitAvailable(unit: PublicDevelopment['units'][number]): boolean {
	const { pricing } = unit as { pricing?: { availabilityStatus?: string | null } | null };
	return AVAILABLE_STATUSES.has(pricing?.availabilityStatus ?? 'available');
}

export type UnitAvailability = { available: number; total: number };

/** Shared by the units table and the hero CTA that anchors to it, so the two can
    never disagree about how many homes are on offer. */
export function unitAvailability(
	units: PublicDevelopment['units'] | null | undefined
): UnitAvailability {
	const list = units ?? [];
	return { available: list.filter(isUnitAvailable).length, total: list.length };
}

/** Label for the hero CTA. `null` when there is no inventory to anchor to, which is
    the same condition under which UnitsInventory renders nothing. */
export function unitsCtaLabel({ available, total }: UnitAvailability): string | null {
	if (total === 0) return null;
	// Sold out: the table still lists the sold rows, so the CTA still has somewhere to go.
	if (available === 0) return total === 1 ? 'View the home' : `View all ${total} homes`;
	// "View the 1 available home" is clumsy, and "the last home" would be the scarcity
	// pitch this brand doesn't make.
	if (available === 1) return 'View the available home';
	return `View the ${available} available homes`;
}

export function effectiveBrochurePublic(development: PublicDevelopment): boolean {
	return development.media?.brochurePublic === true;
}
