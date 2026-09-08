import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';

// The image pipeline reads public env at import; stub it so the component can render in a plain
// node (SSR) test. isPublicMediaAsset stays real — the fixture images carry an uploaded asset.
vi.mock('$lib/sanity/image', () => ({
	buildPublicImageUrl: (asset: MediaAssetInput | null | undefined) =>
		asset?.asset ? 'https://cdn.example/card.jpg' : null,
	buildImageSrcset: (asset: MediaAssetInput | null | undefined) =>
		asset?.asset ? 'https://cdn.example/card.jpg 800w' : '',
	getImagePlaceholder: () => null
}));

const InsightExternalPropertyGrid = (await import('./InsightExternalPropertyGrid.svelte')).default;
const { albanyExternalPropertyGrid } = await import(
	'$lib/insights/fixtures/albanyExternalProperties'
);

function renderGrid(block = albanyExternalPropertyGrid): string {
	// The renderer only reads `portableText.value`; the rest of the PortableText prop is irrelevant.
	return render(InsightExternalPropertyGrid, {
		props: { portableText: { value: block } as never }
	}).body;
}

describe('InsightExternalPropertyGrid — refined card hierarchy', () => {
	it('renders the location directly below the name, before the facts block', () => {
		const html = renderGrid();
		const nameIdx = html.indexOf('Herdade do Sol');
		const locationIdx = html.indexOf('ext-card__location');
		const factsIdx = html.indexOf('ext-card__facts');
		expect(nameIdx).toBeGreaterThan(-1);
		// name → location → facts, in that document order.
		expect(nameIdx).toBeLessThan(locationIdx);
		expect(locationIdx).toBeLessThan(factsIdx);
	});

	it('does not repeat Location inside the facts list', () => {
		const html = renderGrid();
		// The facts <dl> carries only Guests, Bedrooms and From price now. (dt/dd carry a scoped
		// class hash, so match on the label text between tags rather than a bare `<dt>`.)
		expect(html).not.toContain('>Location<');
		expect(html).toContain('>Guests<');
		expect(html).toContain('>Bedrooms<');
		expect(html).toContain('>From price<');
	});

	it('shows each location exactly once (below the name, not duplicated in facts)', () => {
		const html = renderGrid();
		const occurrences = html.split('Comporta, Portugal').length - 1;
		expect(occurrences).toBe(1);
	});

	it('keeps the labelled facts in the order Guests, Bedrooms, From price', () => {
		const html = renderGrid();
		const guests = html.indexOf('>Guests<');
		const bedrooms = html.indexOf('>Bedrooms<');
		const price = html.indexOf('>From price<');
		expect(guests).toBeLessThan(bedrooms);
		expect(bedrooms).toBeLessThan(price);
	});

	it('renders features as a semantic list (scoped class hash tolerated)', () => {
		const html = renderGrid();
		expect(html).toContain('class="ext-card__features');
		// Each feature is a real list item with its authored (sentence-case) text.
		expect(html).toContain('Private pool');
		expect(html).toContain('Beach nearby');
		const items = html.split('<li').length - 1;
		// 4 cards × 3 features each = 12 feature <li> (plus none elsewhere in this component).
		expect(items).toBeGreaterThanOrEqual(12);
	});

	it('preserves the locked editorial order of all four cards', () => {
		const html = renderGrid();
		const order = ['Herdade do Sol', 'Villa Margarita', 'Villa Golfe Norte', 'Ocaso Penthouse'].map(
			(name) => html.indexOf(name)
		);
		expect(order.every((idx) => idx > -1)).toBe(true);
		expect(order).toEqual([...order].sort((a, b) => a - b));
	});

	it('leaves the description, price note and outbound CTA unchanged', () => {
		const html = renderGrid();
		expect(html).toContain('View on Albany Global Property');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer"');
		expect(html).toContain('opens in a new tab');
		expect(html).toContain(
			'Prices and availability are provided by Albany Global Property and may change.'
		);
		// A from-price still shows.
		expect(html).toContain('€2,250 per night');
	});
});
