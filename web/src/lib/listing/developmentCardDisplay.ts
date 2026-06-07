/**
 * Pure formatters for the compact development card shown in listing grids and rails.
 * Shared by DevelopmentCard.svelte (grid) and SpotlightCard.svelte (rails) so both
 * surfaces present inventory consistently.
 */
import { formatListingPrice } from './formatPrice';
import type { PublicPricing } from '$lib/sanity/transforms/pricingFilter';

/**
 * Card price for a development. Mirrors the detail-page Summary: a range already
 * reads "€X – €Y" and a "From/Guide" figure is kept verbatim; a bare single figure
 * is framed as a starting price ("From €X"). Returns null when no price may show.
 */
export function formatDevelopmentCardPrice(
	pricing: PublicPricing | null | undefined
): string | null {
	const price = formatListingPrice(pricing);
	if (!price || price === 'POA') return null;
	if (/^(from|guide)/i.test(price) || price.includes('–')) return price;
	return `From ${price}`;
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
