/** Publish readiness values that may appear on public website routes. */
export const APPROVED_PUBLISH_READINESS = ['approved_for_publish', 'published'] as const;

export type ApprovedPublishReadiness = (typeof APPROVED_PUBLISH_READINESS)[number];

/** GROQ param object passed to every public listing query. */
export const PUBLIC_QUERY_PARAMS = {
	approvedReadiness: APPROVED_PUBLISH_READINESS
} as const;

export const SANITY_PROJECT_ID = 's88o8sjb';

export const SANITY_API_VERSION = '2025-05-01';
