import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped collector for the Vercel cache tags a page depends on.
 *
 * The Sanity fetch layer (queries/fetch.ts) and load functions run *inside*
 * `cacheHandle`'s `resolve`, which establishes the store via `runWithCacheTags`.
 * They add tags with `addCacheTags`; `cacheHandle` then reads the finished set and
 * emits the `Vercel-Cache-Tag` header. AsyncLocalStorage carries the store to the
 * fetch layer without threading `event`/`locals` through every call site — the same
 * request-context trick SvelteKit itself uses for `getRequestEvent`.
 *
 * Off a request (unit tests, scripts) `getStore()` is undefined and every add is a
 * no-op, so callers never need to guard.
 */
export interface CacheTagStore {
	tags: Set<string>;
}

const storage = new AsyncLocalStorage<CacheTagStore>();

/** Run `fn` with a fresh tag store bound to the async context. */
export function runWithCacheTags<T>(store: CacheTagStore, fn: () => T): T {
	return storage.run(store, fn);
}

/** Add cache tags to the current request's store. No-op outside a request. */
export function addCacheTags(...tags: string[]): void {
	const store = storage.getStore();
	if (!store) return;
	for (const tag of tags) {
		if (tag) store.tags.add(tag);
	}
}

/* Depth/size caps: Sanity results (portable text, nested content) can be deep, and
   this runs on every fetch. These bound the scan cost without affecting real data,
   whose document `_id`s sit well within them. */
const MAX_DEPTH = 12;
const MAX_NODES = 5000;

/* Asset ids (`image-…`, `file-…`) are not documents an editor publishes, so tagging
   them would only spend the 128-tag budget on noise. Everything else with an `_id`
   is a real doc whose publish should purge this page. */
function isDocumentId(id: string): boolean {
	return !id.startsWith('image-') && !id.startsWith('file-');
}

/**
 * Deep-scan a fetched Sanity result and add a `doc:<_id>` tag for every document it
 * contains — the detail doc plus every card/rail/embedded reference. This is what
 * makes tag coverage automatic for every cacheable route: any page that renders a
 * doc declares the dependency here, so purging `doc:<id>` on publish refreshes it.
 */
export function collectDocTags(value: unknown): void {
	const store = storage.getStore();
	if (!store) return;

	let visited = 0;
	const walk = (node: unknown, depth: number): void => {
		if (node === null || typeof node !== 'object' || depth > MAX_DEPTH) return;
		if (++visited > MAX_NODES) return;

		if (Array.isArray(node)) {
			for (const item of node) walk(item, depth + 1);
			return;
		}

		const record = node as Record<string, unknown>;
		const id = record._id;
		if (typeof id === 'string' && isDocumentId(id)) {
			store.tags.add(`doc:${id}`);
		}
		for (const key in record) {
			if (key === '_id' || key === '_type' || key === '_key' || key === '_ref') continue;
			walk(record[key], depth + 1);
		}
	};

	walk(value, 0);
}
