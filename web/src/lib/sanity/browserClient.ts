import { createClient } from '@sanity/client';
import { env as publicEnv } from '$env/dynamic/public';
import { SANITY_API_VERSION, SANITY_PROJECT_ID } from './constants';

/**
 * Anonymous client for the browser, used only by `useLiveMode` in the root layout.
 *
 * It exists separately from `publicClient` because `./client.ts` reads
 * `$env/dynamic/private` at module scope for the server-only draft token, and SvelteKit
 * refuses to bundle that into client code. Importing this module directly (never via
 * `./index.ts`, which re-exports `./client.ts`) keeps the private env out of the browser
 * chunk.
 *
 * No token, deliberately: `enableLiveMode` only ever reads `client.config()` for the
 * projectId/dataset/perspective it needs to filter comlink messages. Every live update
 * arrives from the Studio over comlink, fetched there with the editor's own credentials,
 * so nothing here needs — or should have — read access of its own.
 *
 * The projectId and dataset MUST match the workspace the Studio has open, because
 * `enableLiveMode` drops any `loader/perspective` or `loader/query-change` message whose
 * ids differ, and does it silently. A mismatch looks exactly like live mode not working.
 * `PUBLIC_SANITY_DATASET` is the only dataset source readable here — `./client.ts` also
 * falls back to the private `SANITY_DATASET`/`SANITY_STUDIO_DATASET`, so a deployment that
 * sets only those would render server-side from one dataset and listen client-side on
 * another.
 */
export const browserClient = createClient({
	projectId: publicEnv.PUBLIC_SANITY_PROJECT_ID ?? SANITY_PROJECT_ID,
	dataset: publicEnv.PUBLIC_SANITY_DATASET ?? 'production',
	apiVersion: SANITY_API_VERSION,
	useCdn: true,
	perspective: 'published'
});
