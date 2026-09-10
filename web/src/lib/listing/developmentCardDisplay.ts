/**
 * Pure formatters for the compact development card shown in listing grids and rails.
 * Shared by DevelopmentCard.svelte (grid) and SpotlightCard.svelte (rails) so both
 * surfaces present inventory consistently.
 */
import {
	composePrice,
	formatListingPriceParts,
	type PriceDisplayOptions,
	type PriceParts
} from './formatPrice';
import type { PublicPricing } from '$lib/sanity/transforms/pricingFilter';

/**
 * A development's price parts, framed for display: a range already reads "€X – €Y" and a
 * "From/Guide" figure keeps its prefix; a bare single figure becomes a starting price
 * ("From €X"). POA yields null — a development never shows the bare word. Shared by the
 * cards, the detail Summary and the Price component so the rule lives once.
 */
export function developmentPriceParts(
	pricing: PublicPricing | null | undefined,
	options?: PriceDisplayOptions
): PriceParts | null {
	const parts = formatListingPriceParts(pricing, options);
	if (!parts || parts.kind === 'poa') return null;
	if (parts.kind === 'single' && !parts.prefix) return { ...parts, prefix: 'From' };
	return parts;
}

/** Card price for a development as one line. Returns null when no price may show. */
export function formatDevelopmentCardPrice(
	pricing: PublicPricing | null | undefined,
	options?: PriceDisplayOptions
): string | null {
	const parts = developmentPriceParts(pricing, options);
	return parts ? composePrice(parts) : null;
}

/** "1–3 beds" / "2 beds" / "1 bed" — or null when no bedroom data is available. */
export function formatBedroomRange(
	from: number | null | undefined,
	to: number | null | undefined
): string | null {
	const lo = from ?? to;
	const hi = to ?? from;
	if (lo == null || hi == null) return null;

	if (lo === hi) {
		return `${lo} ${lo === 1 ? 'bed' : 'beds'}`;
	}
	return `${lo}–${hi} beds`;
}

/** "5 units available" / "1 unit available" — or null when none are available. */
export function formatUnitsAvailable(count: number | null | undefined): string | null {
	if (!count || count <= 0) return null;
	return `${count} ${count === 1 ? 'unit' : 'units'} available`;
}

/**
 * The meta line parts for a development card: bedroom range then units-available.
 * Empty entries are dropped so callers can `.join(' · ')`.
 */
export function buildDevelopmentMetaParts(card: {
	bedroomsFrom?: number | null;
	bedroomsTo?: number | null;
	unitsAvailable?: number | null;
}): string[] {
	return [
		formatBedroomRange(card.bedroomsFrom, card.bedroomsTo),
		formatUnitsAvailable(card.unitsAvailable)
	].filter((part): part is string => part !== null);
}
