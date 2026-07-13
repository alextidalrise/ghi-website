<script lang="ts">
	import { insightsIndexHref } from '$lib/insights/routes';
	import type { InsightCategory } from '$lib/insights/types';
	import type { InsightCategoryFilter } from '$lib/insights/categories';

	type Props = {
		filters: InsightCategoryFilter[];
		/** The active category, or null for "All". */
		active: InsightCategory | null;
	};

	let { filters, active }: Props = $props();
</script>

<nav class="insight-filters" aria-label="Filter insights by topic">
	<ul class="insight-filters__list">
		{#each filters as filter (filter.value ?? 'all')}
			{@const isActive = filter.value === active}
			<li>
				<a
					class="insight-filters__chip"
					class:insight-filters__chip--active={isActive}
					href={insightsIndexHref({ category: filter.value })}
					aria-current={isActive ? 'true' : undefined}
					data-sveltekit-noscroll
				>
					{filter.label}
					<span class="insight-filters__count">{filter.count}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.insight-filters {
		border-block: 1px solid var(--border);
		padding-block: var(--space-md);
	}

	.insight-filters__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.insight-filters__chip {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.55rem 1rem;
		border: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 400;
		color: var(--green);
		text-decoration: none;
		white-space: nowrap;
		transition:
			border-color var(--duration-hover) var(--ease),
			background-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.insight-filters__count {
		font-size: var(--text-small);
		font-feature-settings: 'tnum';
		color: var(--muted);
		transition: color var(--duration-hover) var(--ease);
	}

	.insight-filters__chip:hover,
	.insight-filters__chip:focus-visible {
		border-color: var(--green);
	}

	/* Active = the sanctioned gold-fill button treatment (gold bg, green ink). */
	.insight-filters__chip--active {
		background: var(--gold);
		border-color: var(--gold);
		color: var(--green);
	}

	.insight-filters__chip--active .insight-filters__count {
		color: var(--green);
		opacity: 0.7;
	}

	.insight-filters__chip--active:hover,
	.insight-filters__chip--active:focus-visible {
		border-color: var(--gold);
	}

	@media (prefers-reduced-motion: reduce) {
		.insight-filters__chip,
		.insight-filters__count {
			transition: none;
		}
	}
</style>
