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
	listingSearchQueryParams,
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
	params
}: {
	scope: ListingSearchScope;
	params: ListingSearchParams;
}): Promise<ListingSearchResult> {
	const start = (params.page - 1) * PAGE_SIZE;
	const end = start + PAGE_SIZE;
	const queryParams = listingSearchQueryParams(scope, {
		propertyType: params.propertyType,
		community: params.community,
		minPrice: params.minPrice,
		maxPrice: params.maxPrice,
		minBeds: params.minBeds,
		golfRelevance: params.golfRelevance,
		golfCourse: params.golfCourse,
		features: params.features,
		start,
		end
	});

	const cardsQuery = buildPaginatedListingCardsQuery(scope, params.sort);
	const countQuery = buildListingCardsCountQuery(scope);

	const [rawCards, total] = await Promise.all([
		fetchPublic<RawSimilarListingItem[]>(cardsQuery, { params: queryParams }),
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
