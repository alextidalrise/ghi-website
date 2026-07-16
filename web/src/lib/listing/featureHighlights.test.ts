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
		const labels = Array.from({ length: 60 }, (_, i) => `Amenity ${i}`);
		expect(toFeatureOptions(labels, { optionsLimit: 40 })).toHaveLength(40);
	});

	it('drops generic filler and per-listing measurements, keeps numbered features', () => {
		const options = toFeatureOptions([
			'Sea view',
			'Homes',
			'Location',
			'Price range',
			'Amenities',
			'154 m² Built Area',
			'12-hectare private enclave',
			'62 apartments',
			'3–5 Bedroom',
			'24 Hour Security',
			'24/7 Concierge'
		]);
		expect(options.map((option) => option.label)).toEqual([
			'24 Hour Security',
			'24/7 Concierge',
			'Sea view'
		]);
	});

	it('minCount drops labels seen on fewer than N listings', () => {
		const labels = ['Sea view', 'Sea view', 'Golf view', 'Golf view', 'One-off descriptor'];
		expect(toFeatureOptions(labels, { minCount: 2 }).map((option) => option.label)).toEqual([
			'Golf view',
			'Sea view'
		]);
	});

	it('blocklist hides a label however often it appears (case-insensitive)', () => {
		const labels = ['Sea view', 'Sea view', 'Show home', 'Show home', 'Show home'];
		expect(
			toFeatureOptions(labels, { minCount: 2, blocklist: ['show HOME'] }).map((o) => o.label)
		).toEqual(['Sea view']);
	});

	it('allowlist keeps a rare label and bypasses the baseline junk rules', () => {
		const labels = ['Sea view', 'Sea view', 'Golf view', 'Amenities'];
		// 'Golf view' (1×, below minCount) and 'Amenities' (a baseline stopword) both survive
		// only because they are allowlisted.
		expect(
			toFeatureOptions(labels, {
				minCount: 2,
				allowlist: ['Golf view', 'Amenities']
			}).map((o) => o.label)
		).toEqual(['Sea view', 'Amenities', 'Golf view']);
	});
});
