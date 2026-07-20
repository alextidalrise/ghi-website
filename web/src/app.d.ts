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
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
