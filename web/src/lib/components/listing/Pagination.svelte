<script lang="ts">
	import { buildListingSearchHref } from '$lib/listing/searchParams';
	import type { ListingSearchParams, PaginationMeta } from '$lib/listing/searchParams';

	type Props = {
		basePath: string;
		searchParams: ListingSearchParams;
		pagination: PaginationMeta;
	};

	let { basePath, searchParams, pagination }: Props = $props();

	const pageNumbers = $derived(buildPageNumbers(pagination.totalPages, searchParams.page));

	function buildPageNumbers(totalPages: number, currentPage: number): number[] {
		if (totalPages <= 1) return [];

		const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
		return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
	}

	function pageHref(page: number): string {
		return buildListingSearchHref(basePath, searchParams, { page });
	}
</script>

{#if pagination.totalPages > 1}
	<nav class="listing-pagination" aria-label="Listing results pages">
		{#if pagination.hasPrev}
			<a class="listing-pagination__control" href={pageHref(searchParams.page - 1)} rel="prev">
				Previous
			</a>
		{:else}
			<span class="listing-pagination__control listing-pagination__control--disabled" aria-hidden="true">
				Previous
			</span>
		{/if}

		<ol class="listing-pagination__pages">
			{#each pageNumbers as page, index (page)}
				{#if index > 0 && pageNumbers[index - 1] !== page - 1}
					<li class="listing-pagination__ellipsis" aria-hidden="true">…</li>
				{/if}
				<li>
					{#if page === searchParams.page}
						<span class="listing-pagination__page" aria-current="page">{page}</span>
					{:else}
						<a class="listing-pagination__page" href={pageHref(page)}>{page}</a>
					{/if}
				</li>
			{/each}
		</ol>

		{#if pagination.hasNext}
			<a class="listing-pagination__control" href={pageHref(searchParams.page + 1)} rel="next">
				Next
			</a>
		{:else}
			<span class="listing-pagination__control listing-pagination__control--disabled" aria-hidden="true">
				Next
			</span>
		{/if}
	</nav>
{/if}

<style>
	.listing-pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		margin-top: var(--space-xl);
	}

	.listing-pagination__pages {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.listing-pagination__control,
	.listing-pagination__page {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		background: var(--white);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		text-decoration: none;
	}

	.listing-pagination__page[aria-current='page'] {
		background: var(--green);
		border-color: var(--green);
		color: var(--linen);
	}

	.listing-pagination__control--disabled {
		color: var(--muted);
		border-color: var(--border);
	}

	.listing-pagination__ellipsis {
		padding-inline: var(--space-xs);
		color: var(--muted);
	}
</style>
