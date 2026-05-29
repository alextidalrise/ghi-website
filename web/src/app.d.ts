// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			preview: boolean;
			loadQuery: import('@sanity/svelte-loader').LoadQuery;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
