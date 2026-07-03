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
	/* Three across on desktop, easing to two on phones (never one — paired cards
	   keep scroll depth shallow on mobile, per the brand's vertical-space priority).
	   On desktop every listing gets an equal cell, developments included. On phones a
	   development still reads as a collection rather than a single home by spanning the
	   full row width. */
	.listing-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-lg);
	}

	/* The cell is the grid track; the card stretches to fill it (height: 100%). */
	.listing-grid__cell {
		display: flex;
	}

	.listing-grid__cell > :global(.property-card) {
		width: 100%;
	}

	@media (max-width: 760px) {
		.listing-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-md);
		}

		/* Full width across the two-up row so the development stands apart. */
		.listing-grid__cell--wide {
			grid-column: 1 / -1;
		}
	}
</style>
