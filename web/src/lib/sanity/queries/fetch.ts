import type { QueryParams } from '@sanity/client';
import type { LoadQuery } from '@sanity/svelte-loader';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { previewClient, publicClient } from '../client';
import { PUBLIC_QUERY_PARAMS } from '../constants';
import {
	toPublicDevelopment,
	toPublicPropertyListing,
	toPublicUnitListing,
	type PublicDevelopment,
	type PublicPropertyListing,
	type RawDevelopment,
	type RawPropertyListing,
	type RawUnitListing,
	type UnitCanonicalContext
} from '../transforms';

export type PublicFetchOptions = {
	params?: QueryParams;
};

/**
 * Dev preview mode: surface draft + hidden + governance-held listings locally so the
 * site can be designed against real content before it clears governance/publishing.
 * When on, `$previewAll` short-circuits the readiness/visibility/reserved gates and
 * queries route through the drafts-reading client (requires a read token).
 *
 * Off by default in production. On in local dev. In a deployed environment it is on
 * ONLY when PREVIEW_ALL_LISTINGS=true. Set PREVIEW_ALL_LISTINGS=false to force the
 * real production gates even in dev.
 */
function previewAllListings(): boolean {
	if (env.PREVIEW_ALL_LISTINGS === 'true') return true;
	if (env.PREVIEW_ALL_LISTINGS === 'false') return false;
	return dev;
}

function withPublicParams(params: QueryParams = {}): QueryParams {
	return {
		...PUBLIC_QUERY_PARAMS,
		previewAll: previewAllListings(),
		...params
	};
}

/** The drafts client only when preview is on AND a token configured it; else public. */
function activeClient() {
	return previewAllListings() && previewClient ? previewClient : publicClient;
}

/**
 * Fetch via the public client (or the drafts client in dev preview mode) and apply
 * server-side transforms. Query strings must come from allowlisted modules in ./ —
 * never ad-hoc GROQ.
 */
export async function fetchPublic<T>(
	query: string,
	options: PublicFetchOptions = {}
): Promise<T | null> {
	return activeClient().fetch<T | null>(query, withPublicParams(options.params ?? {}));
}

/** Fetch taxonomy or other docs via preview drafts when preview mode is active. */
export async function fetchMaybePreview<T>(
	query: string,
	params: QueryParams,
	loadQuery: LoadQuery | undefined,
	preview: boolean
): Promise<T | null> {
	if (preview && loadQuery) {
		const result = await loadQuery<T>(query, params);
		return result.data;
	}

	return fetchPublic<T>(query, { params });
}

export async function fetchPublicProperty(
	query: string,
	options: PublicFetchOptions = {}
): Promise<PublicPropertyListing | null> {
	const raw = await fetchPublic<RawPropertyListing>(query, options);
	return toPublicPropertyListing(raw);
}

export async function fetchPublicDevelopment(
	query: string,
	options: PublicFetchOptions = {}
): Promise<PublicDevelopment | null> {
	const raw = await fetchPublic<RawDevelopment>(query, options);
	return toPublicDevelopment(raw);
}

export async function fetchPublicUnit(
	query: string,
	options: PublicFetchOptions = {}
): Promise<{ listing: PublicPropertyListing; context: UnitCanonicalContext } | null> {
	const raw = await fetchPublic<RawUnitListing>(query, options);
	return toPublicUnitListing(raw);
}

export { withPublicParams };
