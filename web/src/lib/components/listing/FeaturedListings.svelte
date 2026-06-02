<script lang="ts">
	import ListingRail from './ListingRail.svelte';
	import type { PublicPropertyCard } from '$lib/sanity/transforms/propertyCard';

	type Props = {
		cards: PublicPropertyCard[];
		heading: string;
		/** Optional editorial subtitle; falls back to a plain count. */
		summary?: string;
	};

	let { cards, heading, summary }: Props = $props();

	const summaryLine = $derived(
		summary ?? (cards.length === 1 ? '1 property' : `${cards.length} properties`)
	);
</script>

{#if cards.length > 0}
	<section class="featured" aria-labelledby="featured-heading">
		<div class="featured__head">
			<div class="featured__heading">
				<h2 id="featured-heading">{heading}</h2>
				<p class="featured__summary">{summaryLine}</p>
			</div>
			{#if cards.length > 1}
				<span class="featured__cue" aria-hidden="true">‹ scroll ›</span>
			{/if}
		</div>

		<ListingRail {cards} surface="light" labelledby="featured-heading" />
	</section>
{/if}

<style>
	.featured__head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.featured__summary {
		margin-top: var(--space-xs);
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.featured__cue {
		flex-shrink: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: 0.04em;
		color: var(--muted);
		white-space: nowrap;
	}

	@media (max-width: 600px) {
		.featured__cue {
			display: none;
		}
	}
</style>
