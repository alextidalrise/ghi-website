import { describe, expect, it } from 'vitest';
import { filterDisplayableUnits, filterReservedUnits, type UnitLike } from './reservedFilter';

const unit = (overrides: Partial<UnitLike>): UnitLike => ({
	_id: 'ghi-unit-1',
	pricing: { publicVisibility: 'visible', availabilityStatus: 'available' },
	...overrides
});

describe('filterDisplayableUnits', () => {
	it('drops null and non-visible units', () => {
		const units = [
			unit({ _id: 'a' }),
			null as unknown as UnitLike,
			unit({ _id: 'b', pricing: { publicVisibility: 'hidden' } })
		];
		expect(filterDisplayableUnits(units).map((u) => u._id)).toEqual(['a']);
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
		// keeps the first occurrence's payload
		expect(result.find((u) => u._id === dupId)?.unitNumber).toBe('25');
	});

	it('leaves units without an _id untouched', () => {
		const units = [unit({ _id: undefined, unitNumber: '1' }), unit({ _id: undefined, unitNumber: '2' })];
		expect(filterDisplayableUnits(units)).toHaveLength(2);
	});
});

describe('filterReservedUnits', () => {
	it('dedupes by _id alongside reserved/visibility filtering', () => {
		const dupId = 'dup';
		const units = [
			unit({ _id: dupId }),
			unit({ _id: dupId }),
			unit({ _id: 'reserved', pricing: { publicVisibility: 'visible', availabilityStatus: 'reserved' } })
		];
		expect(filterReservedUnits(units).map((u) => u._id)).toEqual([dupId]);
	});
});
