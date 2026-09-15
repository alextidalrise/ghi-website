import { describe, expect, it } from 'vitest';
import { toFrontlinePlaceOptions } from './frontline';

describe('toFrontlinePlaceOptions', () => {
	it('de-duplicates countries and locations and orders them by name', () => {
		const result = toFrontlinePlaceOptions([
			{ countryName: 'Spain', countrySlug: 'spain', locationName: 'Estepona', locationSlug: 'estepona' },
			{ countryName: 'Portugal', countrySlug: 'portugal', locationName: 'Vilamoura', locationSlug: 'vilamoura' },
			{ countryName: 'Spain', countrySlug: 'spain', locationName: 'Benahavis', locationSlug: 'benahavis' },
			{ countryName: 'Spain', countrySlug: 'spain', locationName: 'Estepona', locationSlug: 'estepona' }
		]);

		expect(result.countryOptions).toEqual([
			{ label: 'Portugal', value: 'portugal' },
			{ label: 'Spain', value: 'spain' }
		]);
		expect(result.locationOptions).toEqual([
			{ label: 'Benahavis', value: 'benahavis', country: 'spain' },
			{ label: 'Estepona', value: 'estepona', country: 'spain' },
			{ label: 'Vilamoura', value: 'vilamoura', country: 'portugal' }
		]);
	});

	it('keeps a country whose listings have no location, and skips rows with no country', () => {
		const result = toFrontlinePlaceOptions([
			{ countryName: 'UAE', countrySlug: 'uae', locationName: null, locationSlug: null },
			{ countryName: null, countrySlug: null, locationName: 'Dubai', locationSlug: 'dubai' }
		]);

		expect(result.countryOptions).toEqual([{ label: 'UAE', value: 'uae' }]);
		expect(result.locationOptions).toEqual([]);
	});
});
