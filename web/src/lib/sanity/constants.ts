/** Publish readiness values that may appear on public website routes. */
export const APPROVED_PUBLISH_READINESS = ['approved_for_publish', 'published'] as const;

export type ApprovedPublishReadiness = (typeof APPROVED_PUBLISH_READINESS)[number];

/**
 * GROQ param object passed to every public listing query.
 *
 * `previewAll` is the production default (false): the readiness/visibility/reserved
 * gates apply normally. It is flipped to true only by the env-gated dev preview mode
 * in queries/fetch.ts, which short-circuits those gates so draft/hidden/held listings
 * render in local dev. Kept here so `$previewAll` is always a defined GROQ param.
 */
export const PUBLIC_QUERY_PARAMS = {
	approvedReadiness: APPROVED_PUBLISH_READINESS,
	previewAll: false
} as const;

export const SANITY_PROJECT_ID = 's88o8sjb';

export const SANITY_API_VERSION = '2025-05-01';
