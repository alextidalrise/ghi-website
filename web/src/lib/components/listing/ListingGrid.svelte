<script lang="ts">
	import PropertyCard from './PropertyCard.svelte';
	import type { PublicPropertyCard } from '$lib/sanity/transforms/propertyCard';

	type Props = {
		cards: PublicPropertyCard[];
	};

	let { cards }: Props = $props();
</script>

{#if cards.length > 0}
	<div class="listing-grid">
		{#each cards as card (card._id)}
			<PropertyCard {card} />
		{/each}
	</div>
{/if}

<style>
	.listing-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-xl);
	}

	@media (max-width: 800px) {
		.listing-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
