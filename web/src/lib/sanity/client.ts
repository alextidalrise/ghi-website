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
