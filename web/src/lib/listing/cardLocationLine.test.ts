import { describe, expect, it } from 'vitest';
import { resolveCardLocationLine } from './cardLocationLine';

describe('resolveCardLocationLine', () => {
	it('prefers the community name when it differs from the title', () => {
		const line = resolveCardLocationLine(
			{
				location: { name: 'Malaga' },
				community: { name: 'Nueva Andalucia' },
				addressDisplay: 'Nueva Andalucia, Malaga, Spain'
			},
			'Villa Arco Iris'
		);
		expect(line).toBe('Nueva Andalucia');
	});

	it('falls back to the wider area when the community just echoes the title', () => {
		// The regression: a Murcia listing borrows its community name as the title,
		// so the community must be suppressed but "Murcia" should still show.
		const line = resolveCardLocationLine(
			{
				location: { name: 'Murcia' },
				community: { name: 'Los Alcázares' },
				addressDisplay: 'Los Alcázares, Murcia, Spain'
			},
			'Los Alcázares'
		);
		expect(line).toBe('Murcia');
	});

	it('ignores case and surrounding whitespace when detecting an echo', () => {
		const line = resolveCardLocationLine(
			{
				location: { name: 'Alicante' },
				community: { name: '  Torrevieja  ' }
			},
			'torrevieja'
		);
		expect(line).toBe('Alicante');
	});

	it('falls back to the full address when both community and area echo the title', () => {
		const line = resolveCardLocationLine(
			{
				location: { name: 'Murcia' },
				community: { name: 'Murcia' },
				addressDisplay: 'Murcia city centre'
			},
			'Murcia'
		);
		expect(line).toBe('Murcia city centre');
	});

	it('uses the wider area when the community is absent', () => {
		const line = resolveCardLocationLine(
			{ location: { name: 'Murcia' }, addressDisplay: 'Somewhere, Murcia' },
			'Villa Sol'
		);
		expect(line).toBe('Murcia');
	});

	it('returns null when every candidate echoes the title', () => {
		const line = resolveCardLocationLine({ community: { name: 'Murcia' } }, 'Murcia');
		expect(line).toBeNull();
	});

	it('returns null when there is no location data', () => {
		expect(resolveCardLocationLine(null, 'Villa Sol')).toBeNull();
		expect(resolveCardLocationLine(undefined, 'Villa Sol')).toBeNull();
	});
});
