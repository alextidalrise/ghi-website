<script lang="ts">
	import ListingRail from './ListingRail.svelte';
	import SpotlightCard from './SpotlightCard.svelte';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		cards: SimilarListingCard[];
		heading?: string;
	};

	let { cards, heading = 'Similar properties' }: Props = $props();

	const summaryLine = $derived(cards.length === 1 ? '1 listing' : `${cards.length} listings`);
</script>

{#if cards.length > 0}
	<section class="similar content-wrap" aria-labelledby="similar-properties-heading">
		<div class="similar__head">
			<div class="similar__heading">
				<h2 id="similar-properties-heading">{heading}</h2>
				<p class="similar__summary">{summaryLine}</p>
			</div>
			{#if cards.length > 1}
				<span class="similar__cue" aria-hidden="true">‹ scroll ›</span>
			{/if}
		</div>

		<ListingRail
			items={cards}
			getKey={(item, i) => `${item.card._id}-${i}`}
			labelledby="similar-properties-heading"
		>
			{#snippet card(item)}
				{#if item.kind === 'development'}
					<SpotlightCard card={item.card} kind="development" surface="light" />
				{:else}
					<SpotlightCard card={item.card} surface="light" />
				{/if}
			{/snippet}
		</ListingRail>
	</section>
{/if}

<style>
	.similar {
		margin-top: var(--space-2xl);
		padding-bottom: var(--space-2xl);
	}

	.similar__head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.similar__summary {
		margin-top: var(--space-xs);
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.similar__cue {
		flex-shrink: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: 0.04em;
		color: var(--muted);
		white-space: nowrap;
	}

	@media (max-width: 600px) {
		.similar__cue {
			display: none;
		}
	}
</style>
