<script lang="ts">
	/**
	 * The coverage filter on /partners: one chip per market, each carrying the number of
	 * vetted firms covering it.
	 *
	 * The count is the point. The network's credibility comes from its totality, which is
	 * why the directory stays discipline-first and the market is a filter rather than a
	 * section — but a buyer in Montenegro reading "Montenegro 1" learns something true
	 * before they click, instead of discovering it by finding eight Spanish firms.
	 *
	 * Deliberately the InsightFilters chip row rather than the ListingFilters tray: that
	 * tray is built to narrow 393 listings across six facets, and a dozen partner records
	 * do not earn it. Same vocabulary as the Insights index — hairline-bracketed band,
	 * tabular counts, gold fill on the active chip — so the site has one filter idiom at
	 * this scale.
	 *
	 * Links, not buttons: the filter is URL state (`?covering=uae`), so it works without
	 * JavaScript, survives a refresh, and is linkable from the country page's routes panel.
	 */
	import type { MarketWithCount } from '$lib/markets/markets';
	import { partnersPath } from '$lib/markets/markets';

	type Props = {
		markets: MarketWithCount[];
		/** The market slug currently filtered to, or null for the whole network. */
		active: string | null;
		/** Total partners across every market, for the "All" chip. */
		total: number;
	};

	let { markets, active, total }: Props = $props();
</script>

{#if markets.length > 1}
	<nav class="coverage" aria-label="Filter partners by market">
		<ul class="coverage__list">
			<li>
				<a
					class="coverage__chip"
					class:coverage__chip--active={active === null}
					href={partnersPath()}
					aria-current={active === null ? 'true' : undefined}
					data-sveltekit-noscroll
				>
					All markets
					<span class="coverage__count">{total}</span>
				</a>
			</li>
			{#each markets as market (market.slug)}
				{@const isActive = market.slug === active}
				<li>
					<a
						class="coverage__chip"
						class:coverage__chip--active={isActive}
						href={partnersPath(market.slug)}
						aria-current={isActive ? 'true' : undefined}
						data-sveltekit-noscroll
					>
						{market.name}
						<span class="coverage__count">{market.count}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	.coverage {
		border-block: 1px solid var(--border);
		padding-block: var(--space-md);
	}

	.coverage__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.coverage__chip {
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

	.coverage__count {
		font-size: var(--text-small);
		font-feature-settings: 'tnum';
		color: var(--muted);
		transition: color var(--duration-hover) var(--ease);
	}

	.coverage__chip:hover,
	.coverage__chip:focus-visible {
		border-color: var(--green);
	}

	.coverage__chip:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* Active = the sanctioned gold-fill treatment (gold bg, green ink), matching the
	   Insights filter chips. */
	.coverage__chip--active {
		background: var(--gold);
		border-color: var(--gold);
		color: var(--green);
	}

	.coverage__chip--active .coverage__count {
		color: var(--green);
		opacity: 0.7;
	}

	.coverage__chip--active:hover,
	.coverage__chip--active:focus-visible {
		border-color: var(--gold);
	}

	@media (prefers-reduced-motion: reduce) {
		.coverage__chip,
		.coverage__count {
			transition: none;
		}
	}
</style>
