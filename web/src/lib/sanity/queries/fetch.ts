import type { QueryParams } from '@sanity/client';
import { publicClient } from '../client';
import { PUBLIC_QUERY_PARAMS } from '../constants';
import {
	toPublicDevelopment,
	toPublicPropertyListing,
	type PublicDevelopment,
	type PublicPropertyListing,
	type RawDevelopment,
	type RawPropertyListing
} from '../transforms';

export type PublicFetchOptions = {
	params?: QueryParams;
};

function withPublicParams(params: QueryParams = {}): QueryParams {
	return { ...PUBLIC_QUERY_PARAMS, ...params };
}

/**
 * Fetch via the public CDN client and apply server-side transforms.
 * Query strings must come from allowlisted modules in ./ — never ad-hoc GROQ.
 */
export async function fetchPublic<T>(
	query: string,
	options: PublicFetchOptions = {}
): Promise<T | null> {
	return publicClient.fetch<T | null>(query, withPublicParams(options.params ?? {}));
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

export { withPublicParams };
