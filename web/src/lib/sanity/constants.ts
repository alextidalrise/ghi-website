/** The single status value that surfaces a document on the public website. */
export const PUBLISHED_STATUS = 'published' as const;

export type PublishedStatus = typeof PUBLISHED_STATUS;

/**
 * GROQ param object passed to every public listing query.
 *
 * `previewAll` is the production default (false): the publish-status gate
 * applies normally. It is flipped to true only by the env-gated dev preview
 * mode in queries/fetch.ts, which short-circuits the gate so non-published
 * listings render in local dev. Kept here so `$previewAll` is always a
 * defined GROQ param.
 */
export const PUBLIC_QUERY_PARAMS = {
	publishedStatus: PUBLISHED_STATUS,
	previewAll: false
} as const;

export const SANITY_PROJECT_ID = 's88o8sjb';

export const SANITY_API_VERSION = '2025-05-01';
