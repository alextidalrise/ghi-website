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

export function effectiveBrochurePublic(development: PublicDevelopment): boolean {
	return development.media?.brochurePublic === true;
}
