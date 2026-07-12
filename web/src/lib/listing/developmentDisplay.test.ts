import { describe, expect, it } from 'vitest';
import { isUnitAvailable, unitAvailability, unitsCtaLabel } from './developmentDisplay';
import type { PublicDevelopment } from '$lib/sanity/transforms';

type Unit = PublicDevelopment['units'][number];

/** Minimal unit shaped like the transform output; only availability is under test. */
function unit(availabilityStatus?: string | null): Unit {
	return { pricing: availabilityStatus === undefined ? null : { availabilityStatus } } as Unit;
}

describe('isUnitAvailable', () => {
	it('treats available, coming_soon and under_offer as browsable', () => {
		expect(isUnitAvailable(unit('available'))).toBe(true);
		expect(isUnitAvailable(unit('coming_soon'))).toBe(true);
		expect(isUnitAvailable(unit('under_offer'))).toBe(true);
	});

	it('treats reserved and sold as not browsable', () => {
		expect(isUnitAvailable(unit('reserved'))).toBe(false);
		expect(isUnitAvailable(unit('sold'))).toBe(false);
	});

	it('defaults a unit with no status to available', () => {
		expect(isUnitAvailable(unit())).toBe(true);
		expect(isUnitAvailable(unit(null))).toBe(true);
	});
});

describe('unitAvailability', () => {
	it('counts available units against the full inventory', () => {
		const units = [unit('available'), unit('sold'), unit('under_offer'), unit('reserved')];
		expect(unitAvailability(units)).toEqual({ available: 2, total: 4 });
	});

	it('handles a missing units list', () => {
		expect(unitAvailability(null)).toEqual({ available: 0, total: 0 });
		expect(unitAvailability(undefined)).toEqual({ available: 0, total: 0 });
	});
});

describe('unitsCtaLabel', () => {
	it('names the number of available homes', () => {
		expect(unitsCtaLabel({ available: 24, total: 30 })).toBe('View the 24 available homes');
	});

	it('avoids the clumsy "the 1" when a single home is left', () => {
		expect(unitsCtaLabel({ available: 1, total: 30 })).toBe('View the available home');
	});

	it('falls back to the full inventory when nothing is available', () => {
		// The table still lists sold rows, so the CTA still has somewhere to land.
		expect(unitsCtaLabel({ available: 0, total: 30 })).toBe('View all 30 homes');
	});

	it('stays grammatical for a sold-out single-home development', () => {
		expect(unitsCtaLabel({ available: 0, total: 1 })).toBe('View the home');
	});

	it('returns null when there is no inventory to anchor to', () => {
		// Mirrors UnitsInventory's own `{#if rows.length > 0}` guard: no table, no button.
		expect(unitsCtaLabel({ available: 0, total: 0 })).toBeNull();
	});
});
