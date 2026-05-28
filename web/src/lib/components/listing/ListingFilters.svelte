<script lang="ts">
	import type { ListingSearchParams } from '$lib/listing/searchParams';
	import {
		GOLF_RELEVANCE,
		MIN_BEDS_OPTIONS,
		PROPERTY_TYPES,
		SORT_OPTIONS
	} from '$lib/listing/filterOptions';

	type Props = {
		basePath: string;
		searchParams: ListingSearchParams;
	};

	let { basePath, searchParams }: Props = $props();
</script>

<form class="listing-filters" method="GET" action={basePath} aria-label="Filter property listings">
	<fieldset class="listing-filters__group">
		<legend class="listing-filters__legend">Sort and filter</legend>

		<div class="listing-filters__fields">
			<label class="listing-filters__field">
				<span>Sort by</span>
				<select name="sort">
					{#each SORT_OPTIONS as option (option.value)}
						<option value={option.value} selected={searchParams.sort === option.value}>
							{option.label}
						</option>
					{/each}
				</select>
			</label>

			<label class="listing-filters__field">
				<span>Property type</span>
				<select name="propertyType">
					<option value="">Any type</option>
					{#each PROPERTY_TYPES as option (option.value)}
						<option value={option.value} selected={searchParams.propertyType === option.value}>
							{option.label}
						</option>
					{/each}
				</select>
			</label>

			<label class="listing-filters__field">
				<span>Minimum beds</span>
				<select name="minBeds">
					{#each MIN_BEDS_OPTIONS as option (option.value)}
						<option
							value={option.value}
							selected={String(searchParams.minBeds ?? '') === option.value}
						>
							{option.label}
						</option>
					{/each}
				</select>
			</label>

			<label class="listing-filters__field">
				<span>Min price (EUR)</span>
				<input
					type="number"
					name="minPrice"
					min="0"
					step="50000"
					value={searchParams.minPrice ?? ''}
					placeholder="No minimum"
				/>
			</label>

			<label class="listing-filters__field">
				<span>Max price (EUR)</span>
				<input
					type="number"
					name="maxPrice"
					min="0"
					step="50000"
					value={searchParams.maxPrice ?? ''}
					placeholder="No maximum"
				/>
			</label>
		</div>
	</fieldset>

	<fieldset class="listing-filters__group">
		<legend class="listing-filters__legend">Golf relevance</legend>
		<div class="listing-filters__checkboxes">
			{#each GOLF_RELEVANCE as option (option.value)}
				<label class="listing-filters__checkbox">
					<input
						type="checkbox"
						name="golfRelevance"
						value={option.value}
						checked={searchParams.golfRelevance.includes(option.value)}
					/>
					<span>{option.label}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="listing-filters__actions">
		<button class="button button--primary" type="submit">Apply filters</button>
		<a class="listing-filters__reset" href={basePath}>Reset</a>
	</div>
</form>

<style>
	.listing-filters {
		display: grid;
		gap: var(--space-lg);
		padding-block: var(--space-lg);
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}

	.listing-filters__group {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	.listing-filters__legend {
		margin-bottom: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	.listing-filters__fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: var(--space-md) var(--space-lg);
	}

	.listing-filters__field {
		display: grid;
		gap: var(--space-xs);
	}

	.listing-filters__field span {
		font-family: var(--sans);
		font-size: 0.8rem;
		color: var(--charcoal);
	}

	.listing-filters__field input,
	.listing-filters__field select {
		width: 100%;
		padding: 0.875rem 0;
		border: 0;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		background: transparent;
		color: var(--charcoal);
		font: inherit;
	}

	.listing-filters__field select {
		appearance: none;
	}

	.listing-filters__field input:focus,
	.listing-filters__field select:focus {
		outline: 0;
		border-color: var(--green);
	}

	.listing-filters__checkboxes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-lg);
	}

	.listing-filters__checkbox {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
	}

	.listing-filters__actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md);
	}

	.listing-filters__reset {
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}
</style>
