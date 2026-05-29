declare module '@sanity/svelte-loader' {
	import type { QueryParams } from '@sanity/client';
	import type { Handle } from '@sveltejs/kit';
	import type { Readable } from 'svelte/store';

	export interface QueryResponseInitial<QueryResponseResult> {
		data: QueryResponseResult;
		sourceMap?: unknown;
		perspective?: string;
	}

	export type LoadQuery = <QueryResponseResult>(
		query: string,
		params?: QueryParams,
		options?: Record<string, unknown>
	) => Promise<QueryResponseInitial<QueryResponseResult>>;

	export interface LoaderLocals {
		preview: boolean;
		loadQuery: LoadQuery;
	}

	export function createRequestHandler(options?: Record<string, unknown>): Handle;
	export function setServerClient(client: unknown): void;
	export function setPreviewing(preview: boolean): void;

	export const isPreviewing: Readable<boolean>;

	export function useLiveMode(options?: Record<string, unknown>): void;

	export function useQuery<QueryResponseResult = unknown>(
		query: string,
		params?: QueryParams,
		options?: { initial?: QueryResponseInitial<QueryResponseResult> }
	): Readable<{ data: QueryResponseResult | undefined; loading: boolean }>;
}

declare module '@sanity/visual-editing' {
	export function enableVisualEditing(options?: Record<string, unknown>): () => void;
}
