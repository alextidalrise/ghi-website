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
			{#if item.kind === 'development'}
				<DevelopmentCard card={item.card} />
			{:else}
				<PropertyCard card={item.card} />
			{/if}
		{/each}
	</div>
{/if}

<style>
	/* Four across on desktop, easing to two on phones (never one — paired cards
	   keep scroll depth shallow on mobile, per the brand's vertical-space priority). */
	.listing-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-lg);
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
	}
</style>
