<script lang="ts">
	import ListingFilters from './ListingFilters.svelte';
	import ListingGrid from './ListingGrid.svelte';
	import Pagination from './Pagination.svelte';
	import {
		DEFAULT_LISTING_SEARCH_PARAMS,
		type ListingSearchParams,
		type PaginationMeta
	} from '$lib/listing/searchParams';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type CommunityOption = { label: string; value: string };
	type CourseOption = { label: string; value: string };
	type FeatureOption = { label: string; value: string };

	type Props = {
		basePath: string;
		searchParams: ListingSearchParams;
		cards: SimilarListingCard[];
		total: number;
		pagination: PaginationMeta;
		heading?: string;
		communityOptions?: CommunityOption[];
		courseOptions?: CourseOption[];
		/** Auto-derived feature-highlight options; when non-empty, renders the Features filter. */
		featureOptions?: FeatureOption[];
		showGolfRelevance?: boolean;
	};

	let {
		basePath,
		searchParams,
		cards,
		total,
		pagination,
		heading = 'Properties',
		communityOptions = [],
		courseOptions = [],
		featureOptions = [],
		showGolfRelevance = true
	}: Props = $props();

	const summary = $derived(formatSummary(total, pagination));
	const hasActiveFilters = $derived(
		searchParams.propertyType != null ||
			searchParams.community != null ||
			searchParams.minPrice != null ||
			searchParams.maxPrice != null ||
			searchParams.minBeds != null ||
			searchParams.golfRelevance.length > 0 ||
			searchParams.golfCourse.length > 0 ||
			searchParams.features.length > 0 ||
			searchParams.sort !== DEFAULT_LISTING_SEARCH_PARAMS.sort
	);

	function formatSummary(totalCount: number, meta: PaginationMeta): string {
		if (totalCount === 0) return 'No properties match your filters.';
		if (totalCount === 1) return '1 property';
		if (meta.totalPages <= 1) return `${totalCount} properties`;
		return `Showing ${meta.start}–${meta.end} of ${totalCount} properties`;
	}
</script>

<section id="listing-results" class="listing-results" aria-labelledby="listing-results-heading">
	<div class="listing-results__inner">
		<div class="listing-results__head">
			<h2 id="listing-results-heading">{heading}</h2>
			<p class="listing-results__summary">{summary}</p>
		</div>

		<ListingFilters
			{basePath}
			{searchParams}
			{communityOptions}
			{courseOptions}
			{featureOptions}
			{showGolfRelevance}
		/>

		{#if cards.length > 0}
			<div class="listing-results__grid">
				<ListingGrid {cards} />
			</div>
			<Pagination {basePath} {searchParams} {pagination} />
		{:else}
			<div class="listing-results__empty">
				<p>
					{#if hasActiveFilters}
						No properties match these filters. <a href={basePath}>Clear all filters</a> to see
						everything in this area.
					{:else}
						Listings will appear here once published.
					{/if}
				</p>
			</div>
		{/if}
	</div>
</section>

<style>
	.listing-results {
		margin-top: var(--section-gap);
		/* Pagination links back to #listing-results, so land below the sticky nav. */
		scroll-margin-top: calc(var(--nav-height) + var(--space-md));
	}

	/* The grid block earns more room than the 1060px editorial column above it:
	   three cards breathe at ~1280px. Self-centering so it can sit outside the
	   page's .content-wrap. */
	.listing-results__inner {
		max-width: 1280px;
		margin-inline: auto;
		padding-inline: var(--content-padding);
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

	.listing-results__grid {
		margin-top: var(--space-xl);
	}

	.listing-results__empty {
		padding-block: var(--space-2xl);
		color: var(--muted);
		font-family: var(--sans);
	}

	.listing-results__empty a {
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
</style>
