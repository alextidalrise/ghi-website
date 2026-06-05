import { createClient, type ClientConfig } from '@sanity/client';
import { SANITY_API_VERSION, SANITY_PROJECT_ID } from './constants';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

function resolveDataset(): string {
	return (
		publicEnv.PUBLIC_SANITY_DATASET ??
		privateEnv.SANITY_DATASET ??
		privateEnv.SANITY_STUDIO_DATASET ??
		'production'
	);
}

function resolveProjectId(): string {
	return (
		publicEnv.PUBLIC_SANITY_PROJECT_ID ??
		privateEnv.SANITY_PROJECT_ID ??
		privateEnv.SANITY_STUDIO_PROJECT_ID ??
		SANITY_PROJECT_ID
	);
}

const publicClientConfig: ClientConfig = {
	projectId: resolveProjectId(),
	dataset: resolveDataset(),
	apiVersion: SANITY_API_VERSION,
	useCdn: true,
	perspective: 'published'
};

/**
 * Anonymous CDN client for public website queries only.
 * Never pass a token — all sensitive fields must be excluded upstream via allowlists.
 */
export const publicClient = createClient(publicClientConfig);

export function getPublicClientConfig(): Readonly<ClientConfig> {
	return { ...publicClientConfig };
}

/**
 * Drafts-reading client for the env-gated dev preview mode (see queries/fetch.ts).
 * Reads the `drafts` perspective with the read token so unpublished listings render
 * in local dev. Server-only and null when no token is configured — the public site
 * never depends on it. The same allowlists still strip sensitive fields.
 */
function resolveReadToken(): string | undefined {
	return privateEnv.SANITY_API_READ_TOKEN ?? privateEnv.SANITY_API_TOKEN ?? undefined;
}

export const previewClient = resolveReadToken()
	? createClient({
			...publicClientConfig,
			useCdn: false,
			perspective: 'drafts',
			token: resolveReadToken()
		})
	: null;
