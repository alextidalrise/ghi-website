import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Price from './Price.svelte';
import { CURRENCY_CONTEXT_KEY, CurrencyStore } from '$lib/currency/currency.svelte';

// 1 GBP = 1.25 EUR, 1 USD = 0.8 EUR, 1 AED = 0.25 EUR — clean sums for readable assertions.
const rates = { EUR: 1, GBP: 1.25, USD: 0.8, AED: 0.25 };

function renderPrice(props: Record<string, unknown>, withContext = true): string {
	const context = withContext
		? new Map<symbol, unknown>([[CURRENCY_CONTEXT_KEY, new CurrencyStore({ rates, asOf: '2026-09-09' })]])
		: undefined;
	// Hydration markers are noise for these assertions.
	return render(Price, { props: props as never, context }).body.replace(/<!--[^>]*-->/g, '');
}

/** The visible+spoken text of each variant span, keyed by its data-ccy. */
function variants(html: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const chunk of html.split('<span class="price__v').slice(1)) {
		const code = /data-ccy="([A-Z]{3})"/.exec(chunk)?.[1];
		if (!code) continue;
		let content = chunk.slice(chunk.indexOf('>') + 1);
		const nativeLine = content.indexOf('<span class="price__native');
		if (nativeLine !== -1) content = content.slice(0, nativeLine);
		out[code] = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
	}
	return out;
}

describe('Price — pre-rendered variants', () => {
	it('renders the native figure plus one approximate variant per other currency', () => {
		const html = renderPrice({ pricing: { price: 1_245_000, currency: 'EUR' } });
		expect(html).toContain('data-native-ccy="EUR"');
		const v = variants(html);
		expect(v.EUR).toBe('€1,245,000');
		expect(v.GBP).toContain('approx. £996,000');
		expect(v.USD).toContain('approx. $1,560,000');
		expect(v.AED).toContain('approx.');
		// The native variant is the one marked data-native; the others carry the hover hint.
		expect(html).toMatch(/data-ccy="EUR" data-native/);
		expect(html).toContain('title="Listed at €1,245,000"');
		// Screen readers hear the listed price after a conversion.
		expect(html).toContain(', listed at €1,245,000');
	});

	it('keeps an AED listing native in AED and converts it for the other three', () => {
		const v = variants(renderPrice({ pricing: { price: 22_500_000, currency: 'AED' } }));
		expect(v.AED).toContain('22,500,000');
		expect(v.AED).not.toContain('approx');
		expect(v.EUR).toContain('approx. €5,630,000');
	});

	it('frames a development single figure with From ahead of the marker', () => {
		const v = variants(renderPrice({ pricing: { price: 515_000, currency: 'EUR' }, frame: 'development' }));
		expect(v.EUR).toBe('From €515,000');
		expect(v.GBP).toContain('From approx. £412,000');
	});

	it('shows the listed price as a visible line when asked', () => {
		const html = renderPrice({ pricing: { price: 1_245_000, currency: 'EUR' }, native: 'line' });
		expect(html).toContain('class="price__native');
		expect(html).toContain('>Listed at €1,245,000<');
		// No hover title in line mode: the line already says it.
		expect(html).not.toContain('title=');
	});

	it('says "Listed from" for a from-priced development', () => {
		const html = renderPrice({
			pricing: { priceFrom: 515_000, currency: 'EUR' },
			frame: 'development',
			native: 'line'
		});
		expect(html).toContain('>Listed from €515,000<');
	});

	it('renders POA and free text as a single plain span, never converted', () => {
		expect(renderPrice({ pricing: { priceDisplay: 'POA' } })).toMatch(/price--plain[^>]*>POA</);
		expect(renderPrice({ pricing: { priceDisplay: 'Prices on request' } })).toContain('Prices on request');
		expect(renderPrice({ pricing: { priceDisplay: 'POA' } })).not.toContain('data-ccy');
	});

	it('uses the fallback for nothing-to-show and in place of a bare POA', () => {
		expect(renderPrice({ pricing: null, fallback: 'Price on application' })).toContain(
			'Price on application'
		);
		expect(renderPrice({ pricing: { priceDisplay: 'POA' }, fallback: 'Price on application' })).toContain(
			'Price on application'
		);
		expect(renderPrice({ pricing: null })).not.toContain('price');
	});

	it('leaves a malformed native code as one plain figure', () => {
		const html = renderPrice({ pricing: { price: 500_000, currency: 'AE' } });
		expect(html).toContain('AE 500,000');
		expect(html).not.toContain('data-ccy');
	});

	it('renders with the static fallback rates outside the root layout', () => {
		const v = variants(renderPrice({ pricing: { price: 1_000_000, currency: 'EUR' } }, false));
		expect(v.GBP).toContain('approx. £859,000');
	});
});
