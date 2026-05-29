import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { publicClient } from './client';

const studioUrl =
	publicEnv.PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333/development';

/**
 * Authenticated client for draft preview (server-only).
 * Requires SANITY_API_READ_TOKEN with viewer access to the dataset.
 */
export const serverClient = publicClient.withConfig({
	token: privateEnv.SANITY_API_READ_TOKEN,
	useCdn: false,
	stega: {
		studioUrl,
		enabled: true
	}
});
