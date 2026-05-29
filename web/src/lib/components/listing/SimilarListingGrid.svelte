<script lang="ts">
	import DevelopmentListingCard from './DevelopmentListingCard.svelte';
	import PropertyCard from './PropertyCard.svelte';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		cards: SimilarListingCard[];
	};

	let { cards }: Props = $props();
</script>

{#if cards.length > 0}
	<div class="similar-listing-grid">
		{#each cards as item (item.card._id)}
			{#if item.kind === 'property'}
				<PropertyCard card={item.card} />
			{:else}
				<DevelopmentListingCard card={item.card} />
			{/if}
		{/each}
	</div>
{/if}

<style>
	.similar-listing-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-xl);
	}

	@media (max-width: 800px) {
		.similar-listing-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
