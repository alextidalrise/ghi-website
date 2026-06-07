import { describe, expect, it } from 'vitest';
import {
	buildDevelopmentMetaParts,
	formatBedroomRange,
	formatDevelopmentCardPrice,
	formatUnitsAvailable
} from './developmentCardDisplay';

describe('formatBedroomRange', () => {
	it('renders a range when bounds differ', () => {
		expect(formatBedroomRange(1, 3)).toBe('1–3 beds');
	});

	it('renders a singular figure when bounds match', () => {
		expect(formatBedroomRange(1, 1)).toBe('1 bed');
		expect(formatBedroomRange(2, 2)).toBe('2 beds');
	});

	it('tolerates a single defined bound', () => {
		expect(formatBedroomRange(2, null)).toBe('2 beds');
		expect(formatBedroomRange(null, 3)).toBe('3 beds');
	});

	it('returns null when no bedroom data exists', () => {
		expect(formatBedroomRange(null, null)).toBeNull();
		expect(formatBedroomRange(undefined, undefined)).toBeNull();
	});
});

describe('formatUnitsAvailable', () => {
	it('pluralises and drops zero/empty', () => {
		expect(formatUnitsAvailable(5)).toBe('5 units available');
		expect(formatUnitsAvailable(1)).toBe('1 unit available');
		expect(formatUnitsAvailable(0)).toBeNull();
		expect(formatUnitsAvailable(null)).toBeNull();
	});
});

describe('buildDevelopmentMetaParts', () => {
	it('combines beds range and units, dropping empties', () => {
		expect(buildDevelopmentMetaParts({ bedroomsFrom: 1, bedroomsTo: 3, unitsAvailable: 5 })).toEqual([
			'1–3 beds',
			'5 units available'
		]);
		expect(buildDevelopmentMetaParts({ bedroomsFrom: null, bedroomsTo: null, unitsAvailable: 0 })).toEqual(
			[]
		);
	});
});

describe('formatDevelopmentCardPrice', () => {
	it('keeps an explicit range verbatim', () => {
		expect(
			formatDevelopmentCardPrice({ priceFrom: 525000, priceTo: 1950000, currency: 'EUR' })
		).toContain('–');
	});

	it('frames a bare single figure as a starting price', () => {
		expect(formatDevelopmentCardPrice({ price: 525000, currency: 'EUR' })).toMatch(/^From /);
	});

	it('returns null for POA / no price', () => {
		expect(formatDevelopmentCardPrice({ priceDisplay: 'POA' })).toBeNull();
		expect(formatDevelopmentCardPrice(null)).toBeNull();
	});
});
