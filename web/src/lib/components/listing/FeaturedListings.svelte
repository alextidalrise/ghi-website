<script lang="ts">
	import ListingGrid from './ListingGrid.svelte';
	import type { PublicPropertyCard } from '$lib/sanity/transforms/propertyCard';

	type Props = {
		cards: PublicPropertyCard[];
		heading: string;
	};

	let { cards, heading }: Props = $props();
</script>

{#if cards.length > 0}
	<section class="featured-listings" aria-labelledby="featured-heading">
		<div class="featured-listings__head">
			<h2 id="featured-heading">{heading}</h2>
			<p class="featured-listings__summary">
				{cards.length === 1 ? '1 property' : `${cards.length} properties`}
			</p>
		</div>

		<ListingGrid {cards} />
	</section>
{/if}

<style>
	.featured-listings {
		margin-top: var(--space-xl);
	}

	.featured-listings__head {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.featured-listings__summary {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}
</style>
