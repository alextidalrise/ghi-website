<script lang="ts">
	import DevelopmentCard from './DevelopmentCard.svelte';
	import PropertyCard from './PropertyCard.svelte';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		cards: SimilarListingCard[];
	};

	let { cards }: Props = $props();
</script>

{#if cards.length > 0}
	<div class="listing-grid">
		{#each cards as item (item.card._id)}
			<div class="listing-grid__cell" class:listing-grid__cell--wide={item.kind === 'development'}>
				{#if item.kind === 'development'}
					<DevelopmentCard card={item.card} />
				{:else}
					<PropertyCard card={item.card} />
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	/* Four across on desktop, easing to two on phones (never one — paired cards
	   keep scroll depth shallow on mobile, per the brand's vertical-space priority).
	   Developments take a double-width, double-height cell to read as collections rather
	   than single homes. Spanning two rows lets two ordinary listings stack alongside the
	   development instead of one card stretching to its full height. `dense` flow keeps the
	   grid gap-free by backfilling those single-width slots, so the visual order may not
	   perfectly match the query sort where a development sits beside single listings. */
	.listing-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-auto-flow: row dense;
		gap: var(--space-lg);
	}

	/* The cell is the grid track; the card stretches to fill it (height: 100%). */
	.listing-grid__cell {
		display: flex;
	}

	.listing-grid__cell > :global(.property-card) {
		width: 100%;
	}

	.listing-grid__cell--wide {
		grid-column: span 2;
		grid-row: span 2;
	}

	@media (max-width: 1100px) {
		.listing-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 760px) {
		.listing-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-md);
		}

		/* Full-width and a single row on phones — nothing sits beside it to stack. */
		.listing-grid__cell--wide {
			grid-row: span 1;
		}
	}
</style>
