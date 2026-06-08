import { describe, expect, it } from 'vitest';
import { set, unset } from 'sanity';
import { buildParentRefPatches, isParentChainSynced } from './locationFieldsSync';

describe('buildParentRefPatches', () => {
	it('sets location and country when community parent chain is known', () => {
		const patches = buildParentRefPatches(
			{
				community: { _type: 'reference', _ref: 'places-community-aloha' },
				location: { _type: 'reference', _ref: 'sample.location' },
				country: { _type: 'reference', _ref: 'sample.country' }
			},
			{
				locationRef: 'places-location-nueva-andalucia',
				countryRef: 'places-country-spain'
			}
		);

		expect(patches).toEqual([
			set({ _type: 'reference', _ref: 'places-location-nueva-andalucia' }, ['location']),
			set({ _type: 'reference', _ref: 'places-country-spain' }, ['country'])
		]);
	});

	it('unsets derived refs when community is cleared', () => {
		const patches = buildParentRefPatches(
			{
				location: { _type: 'reference', _ref: 'sample.location' },
				country: { _type: 'reference', _ref: 'sample.country' }
			},
			null
		);

		expect(patches).toEqual([unset(['location']), unset(['country'])]);
	});

	it('returns no patches when refs already match the parent chain', () => {
		const value = {
			community: { _type: 'reference' as const, _ref: 'places-community-aloha' },
			location: { _type: 'reference' as const, _ref: 'places-location-nueva-andalucia' },
			country: { _type: 'reference' as const, _ref: 'places-country-spain' }
		};

		expect(
			buildParentRefPatches(value, {
				locationRef: 'places-location-nueva-andalucia',
				countryRef: 'places-country-spain'
			})
		).toEqual([]);
		expect(
			isParentChainSynced(value, {
				locationRef: 'places-location-nueva-andalucia',
				countryRef: 'places-country-spain'
			})
		).toBe(true);
	});
});
