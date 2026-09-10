// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			preview: boolean;
			loadQuery: import('@sanity/svelte-loader').LoadQuery;
			/** Resolved once per request by analyticsHandle; reused by +layout.server.ts. */
			analytics?: import('$lib/analytics/config').AnalyticsConfig;
			/**
			 * Live currency rates, kicked off (not awaited) in `ratesHandle` so the fetch
			 * overlaps the layout/page loads that `await` it. Never rejects — resolves to the
			 * static fallback on any failure (see `$lib/currency/rates.server`).
			 */
			exchangeRates: Promise<import('$lib/currency/rates.server').ExchangeRates>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
