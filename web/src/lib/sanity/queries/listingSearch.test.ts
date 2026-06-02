import { describe, expect, it } from 'vitest';
import { buildLocationGridIds } from './listingSearch';

describe('buildLocationGridIds', () => {
	it('includes the primary location only by default', () => {
		expect(buildLocationGridIds('loc-a', [])).toEqual(['loc-a']);
	});

	it('merges linked locations when includeInGrid is true', () => {
		expect(
			buildLocationGridIds('loc-a', [
				{ includeInGrid: true, location: { _id: 'loc-b' } },
				{ includeInGrid: false, location: { _id: 'loc-c' } },
				{ includeInGrid: true, location: { _id: 'loc-b' } }
			])
		).toEqual(['loc-a', 'loc-b']);
	});
});
