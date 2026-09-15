import { describe, expect, it } from 'vitest';
import { toFrontlineCourseOptions } from './frontline';
import { buildGolfCourseFacetQuery } from './listingSearch';

describe('toFrontlineCourseOptions', () => {
	it('collects each course once with every place its rows sit in, ordered by name', () => {
		const options = toFrontlineCourseOptions({
			rows: [
				{
					country: 'spain',
					location: 'sotogrande',
					courses: [
						{ label: 'Real Club Valderrama', value: 'real-club-valderrama' },
						{ label: 'La Reserva Club Sotogrande', value: 'la-reserva-club-sotogrande' }
					]
				},
				{
					country: 'spain',
					location: 'estepona',
					courses: [{ label: 'Real Club Valderrama', value: 'real-club-valderrama' }, null]
				},
				{ country: 'portugal', location: 'vilamoura', courses: null }
			],
			selected: []
		});

		expect(options).toEqual([
			{
				label: 'La Reserva Club Sotogrande',
				value: 'la-reserva-club-sotogrande',
				countries: ['spain'],
				locations: ['sotogrande']
			},
			{
				label: 'Real Club Valderrama',
				value: 'real-club-valderrama',
				countries: ['spain'],
				locations: ['estepona', 'sotogrande']
			}
		]);
	});

	it('keeps a selected course no row matches, with no places', () => {
		const options = toFrontlineCourseOptions({
			rows: [],
			selected: [{ label: 'Monte Rei Golf & Country Club', value: 'monte-rei-golf-and-country-club' }]
		});

		expect(options).toEqual([
			{
				label: 'Monte Rei Golf & Country Club',
				value: 'monte-rei-golf-and-country-club',
				countries: [],
				locations: []
			}
		]);
	});

	it('tolerates an empty result', () => {
		expect(toFrontlineCourseOptions(null)).toEqual([]);
	});
});

describe('buildGolfCourseFacetQuery', () => {
	it('reads rows through the grid filter, developments included, and the linked-course field', () => {
		const query = buildGolfCourseFacetQuery({ type: 'global' });
		expect(query).toContain('_type == "development"');
		expect(query).toContain('!defined($golfCourse)');
		expect(query).toContain('golf.linkedGolfCourses[]->{ "label": name, "value": slug.current }');
		expect(query).toContain('slug.current in $selectedCourses');
	});
});
