import type { RateTable } from '../../currency/rates';
import {
	buildPaginationMeta,
	PAGE_SIZE,
	type ListingSearchParams,
	type PaginationMeta
} from '../../listing/searchParams';
import {
	toSimilarListingCard,
	type RawSimilarListingItem,
	type SimilarListingCard
} from '../transforms/similarListingCard';
import { fetchPublic } from './fetch';
import {
	buildListingCardsCountQuery,
	buildPaginatedListingCardsQuery,
	buildPinnedListingCardsQuery,
	listingSearchQueryParams,
	mergePinnedPage,
	NATURAL_SORT,
	pinnedRestStart,
	type ListingSearchScope
} from './listingSearch';

export type ListingSearchResult = {
	cards: SimilarListingCard[];
	total: number;
	pagination: PaginationMeta;
};

/**
 * Route-facing listing search API.
 * Applies allowlisted GROQ, public gates, and card transforms before returning page data.
 */
export async function fetchListingCards({
	scope,
	params,
	rates
}: {
	scope: ListingSearchScope;
	params: ListingSearchParams;
	rates?: RateTable;
}): Promise<ListingSearchResult> {
	const start = (params.page - 1) * PAGE_SIZE;
	const end = start + PAGE_SIZE;
	// Pins lead only the unsorted grid; a visitor's chosen sort is always strict.
	const pinnedQuery = params.sort ? null : buildPinnedListingCardsQuery(scope);
	const restStart = pinnedRestStart(start);
	const queryParams = listingSearchQueryParams(
		scope,
		{
			propertyType: params.propertyType,
			community: params.community,
			location: params.location,
			minPrice: params.minPrice,
			maxPrice: params.maxPrice,
			minBeds: params.minBeds,
			golfRelevance: params.golfRelevance,
			golfCourse: params.golfCourse,
			features: params.features,
			start,
			end,
			...(pinnedQuery ? { restStart } : {})
		},
		rates
	);

	const countQuery = buildListingCardsCountQuery(scope);

	const [rawCards, total] = await Promise.all([
		pinnedQuery
			? fetchPublic<{ pinned?: RawSimilarListingItem[]; rest?: RawSimilarListingItem[] }>(
					pinnedQuery,
					{ params: queryParams }
				).then((result) =>
					mergePinnedPage(result?.pinned ?? [], result?.rest ?? [], { start, end, restStart })
				)
			: fetchPublic<RawSimilarListingItem[]>(
					buildPaginatedListingCardsQuery(scope, params.sort ?? NATURAL_SORT),
					{ params: queryParams }
				),
		fetchPublic<number>(countQuery, { params: queryParams })
	]);

	const cards = (rawCards ?? [])
		.map(toSimilarListingCard)
		.filter((card): card is SimilarListingCard => card !== null);
	const pagination = buildPaginationMeta({
		total: total ?? 0,
		page: params.page,
		pageSize: PAGE_SIZE
	});

	return {
		cards,
		total: total ?? 0,
		pagination
	};
}
