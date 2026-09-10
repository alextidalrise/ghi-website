import { describe, expect, it } from 'vitest';
import { CurrencyStore } from './currency.svelte';
import { FALLBACK_RATES, RATES_AS_OF } from './rates';

// Server-side semantics: `browser` is false under vitest's node environment, so the store
// must behave exactly as it does during SSR — inert, answering nothing for the visitor.
describe('CurrencyStore (server-side / pre-hydration)', () => {
	it('starts with no choice, the fallback rates, and nothing announced', () => {
		const store = new CurrencyStore();
		expect(store.chosen).toBeNull();
		expect(store.hydrated).toBe(false);
		expect(store.announcement).toBe('');
		expect(store.rates).toBe(FALLBACK_RATES);
		expect(store.asOf).toBe(RATES_AS_OF);
	});

	it('carries the live table it is given', () => {
		const rates = { EUR: 1, GBP: 1.2, USD: 0.9, AED: 0.25 };
		const store = new CurrencyStore({ rates, asOf: '2026-09-10' });
		expect(store.rates).toBe(rates);
		expect(store.asOf).toBe('2026-09-10');
	});

	it('adopt() is the DOM-free hydration transition', () => {
		const store = new CurrencyStore();
		store.adopt('GBP');
		expect(store.chosen).toBe('GBP');
		expect(store.hydrated).toBe(true);
		store.adopt(null);
		expect(store.chosen).toBeNull();
		expect(store.hydrated).toBe(true);
	});

	it('hydrate() and select() are no-ops without a browser', () => {
		const store = new CurrencyStore();
		store.hydrate();
		expect(store.hydrated).toBe(false);
		store.select('USD');
		expect(store.chosen).toBeNull();
		expect(store.announcement).toBe('');
	});

	it('accepts a seeded initial choice for tests', () => {
		expect(new CurrencyStore(undefined, 'AED').chosen).toBe('AED');
	});
});
