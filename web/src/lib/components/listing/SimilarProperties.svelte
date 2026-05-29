<script lang="ts">
	import SimilarListingGrid from './SimilarListingGrid.svelte';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		cards: SimilarListingCard[];
		heading?: string;
	};

	let { cards, heading = 'Similar properties' }: Props = $props();
</script>

{#if cards.length > 0}
	<section class="similar-properties" aria-labelledby="similar-properties-heading">
		<div class="similar-properties__head">
			<h2 id="similar-properties-heading">{heading}</h2>
			<p class="similar-properties__summary">
				{cards.length === 1 ? '1 listing' : `${cards.length} listings`}
			</p>
		</div>

		<SimilarListingGrid {cards} />
	</section>
{/if}

<style>
	.similar-properties {
		margin-top: var(--space-xl);
	}

	.similar-properties__head {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.similar-properties__summary {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}
</style>
