<script lang="ts">
	import ListingFilters from './ListingFilters.svelte';
	import ListingGrid from './ListingGrid.svelte';
	import Pagination from './Pagination.svelte';
	import type { ListingSearchParams, PaginationMeta } from '$lib/listing/searchParams';
	import type { PublicPropertyCard } from '$lib/sanity/transforms/propertyCard';

	type Props = {
		basePath: string;
		searchParams: ListingSearchParams;
		cards: PublicPropertyCard[];
		total: number;
		pagination: PaginationMeta;
		heading?: string;
	};

	let { basePath, searchParams, cards, total, pagination, heading = 'Properties' }: Props = $props();

	const summary = $derived(formatSummary(total, pagination));
	const hasActiveFilters = $derived(
		searchParams.propertyType != null ||
			searchParams.minPrice != null ||
			searchParams.maxPrice != null ||
			searchParams.minBeds != null ||
			searchParams.golfRelevance.length > 0 ||
			searchParams.sort !== 'title'
	);

	function formatSummary(totalCount: number, meta: PaginationMeta): string {
		if (totalCount === 0) return 'No properties match your filters.';
		if (totalCount === 1) return '1 property';
		if (meta.totalPages <= 1) return `${totalCount} properties`;
		return `Showing ${meta.start}–${meta.end} of ${totalCount} properties`;
	}
</script>

<section class="listing-results" aria-labelledby="listing-results-heading">
	<div class="listing-results__head">
		<h2 id="listing-results-heading">{heading}</h2>
		<p class="listing-results__summary">{summary}</p>
	</div>

	<ListingFilters {basePath} {searchParams} />

	{#if cards.length > 0}
		<ListingGrid {cards} />
		<Pagination {basePath} {searchParams} {pagination} />
	{:else}
		<div class="listing-results__empty">
			<p>
				{#if hasActiveFilters}
					Try adjusting your filters or <a href={basePath}>reset all filters</a>.
				{:else}
					Listings will appear here once published in Sanity.
				{/if}
			</p>
		</div>
	{/if}
</section>

<style>
	.listing-results {
		margin-top: var(--space-xl);
	}

	.listing-results__head {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.listing-results__summary {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.listing-results__empty {
		padding-block: var(--space-xl);
		color: var(--muted);
	}

	.listing-results__empty a {
		color: var(--green);
	}
</style>
