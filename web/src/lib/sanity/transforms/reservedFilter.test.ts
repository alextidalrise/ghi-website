import { describe, expect, it } from 'vitest';
import { filterDisplayableUnits, filterReservedUnits, type UnitLike } from './reservedFilter';

const unit = (overrides: Partial<UnitLike>): UnitLike => ({
	_id: 'ghi-unit-1',
	pricing: { availabilityStatus: 'available', priceConfirmed: true },
	...overrides
});

describe('filterDisplayableUnits', () => {
	it('drops withdrawn units and nulls', () => {
		const units = [
			unit({ _id: 'a' }),
			null as unknown as UnitLike,
			unit({ _id: 'b', pricing: { availabilityStatus: 'withdrawn' } })
		];
		expect(filterDisplayableUnits(units).map((u) => u._id)).toEqual(['a']);
	});

	it('keeps reserved and sold units (rendered as locked rows in the UI)', () => {
		const units = [
			unit({ _id: 'a', pricing: { availabilityStatus: 'reserved' } }),
			unit({ _id: 'b', pricing: { availabilityStatus: 'sold' } }),
			unit({ _id: 'c', pricing: { availabilityStatus: 'available' } })
		];
		expect(filterDisplayableUnits(units).map((u) => u._id)).toEqual(['a', 'b', 'c']);
	});

	// Regression: a development whose units[] references the same unit twice (duplicate
	// upload refs) used to reach the table's keyed {#each ... (row.id)} with a duplicate
	// key, throwing Svelte's fatal each_key_duplicate and killing the client-side router
	// site-wide. The displayable list must contain each _id at most once.
	it('collapses units that share an _id to the first occurrence', () => {
		const dupId = 'ghi00130-monte-rei-plot-25-review-only';
		const units = [
			unit({ _id: 'a' }),
			unit({ _id: dupId, unitNumber: '25' }),
			unit({ _id: dupId, unitNumber: '25-dup' }),
			unit({ _id: 'c' })
		];

		const result = filterDisplayableUnits(units);
		const ids = result.map((u) => u._id);

		expect(ids).toEqual(['a', dupId, 'c']);
		expect(new Set(ids).size).toBe(ids.length);
		expect(result.find((u) => u._id === dupId)?.unitNumber).toBe('25');
	});

	it('leaves units without an _id untouched', () => {
		const units = [
			unit({ _id: undefined, unitNumber: '1' }),
			unit({ _id: undefined, unitNumber: '2' })
		];
		expect(filterDisplayableUnits(units)).toHaveLength(2);
	});
});

describe('filterReservedUnits (alias of filterDisplayableUnits)', () => {
	it('matches the displayable policy (reserved kept, withdrawn dropped)', () => {
		const units = [
			unit({ _id: 'a', pricing: { availabilityStatus: 'reserved' } }),
			unit({ _id: 'b', pricing: { availabilityStatus: 'withdrawn' } }),
			unit({ _id: 'c', pricing: { availabilityStatus: 'available' } })
		];
		expect(filterReservedUnits(units).map((u) => u._id)).toEqual(['a', 'c']);
	});
});
