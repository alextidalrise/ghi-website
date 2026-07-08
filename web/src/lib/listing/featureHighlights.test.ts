import { describe, expect, it } from 'vitest';
import { cleanFeatureLabel, cleanFeatureLabels, toFeatureOptions } from './featureHighlights';

describe('cleanFeatureLabel', () => {
	it('trims and strips the stray provenance suffix', () => {
		expect(cleanFeatureLabel('  Sea view  ')).toBe('Sea view');
		expect(cleanFeatureLabel('Sea view, per source text')).toBe('Sea view');
		expect(cleanFeatureLabel('Private pool per source.')).toBe('Private pool');
		expect(cleanFeatureLabel(null)).toBe('');
	});
});

describe('cleanFeatureLabels', () => {
	it('cleans, drops empties, and dedupes case-insensitively in order', () => {
		expect(
			cleanFeatureLabels(['Sea view', 'sea view', '  ', null, 'Private pool, per source text'])
		).toEqual(['Sea view', 'Private pool']);
	});
});

describe('toFeatureOptions', () => {
	it('orders by frequency then alphabetically, keying on the cleaned label', () => {
		const options = toFeatureOptions([
			'Sea view',
			'Sea view, per source text',
			'Private pool',
			'Gym'
		]);
		expect(options).toEqual([
			{ label: 'Sea view', value: 'sea view' },
			{ label: 'Gym', value: 'gym' },
			{ label: 'Private pool', value: 'private pool' }
		]);
	});

	it('caps the number of options', () => {
		const labels = Array.from({ length: 60 }, (_, i) => `Feature ${i}`);
		expect(toFeatureOptions(labels, 40)).toHaveLength(40);
	});
});
