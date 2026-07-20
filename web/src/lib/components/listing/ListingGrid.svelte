<script lang="ts">
	import DevelopmentCard from './DevelopmentCard.svelte';
	import PropertyCard from './PropertyCard.svelte';
	import { listImpression, toAnalyticsItems, type ListContext } from '$lib/analytics';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		cards: SimilarListingCard[];
		/** Opt in to analytics by naming the list; omit and the grid behaves as before. */
		list?: ListContext;
	};

	let { cards, list }: Props = $props();

	// Built once here rather than per card: the grid owns the ordering, so this is the
	// only place that can give impressions and clicks a consistent position.
	const items = $derived(list ? toAnalyticsItems(cards, list) : []);
	const itemById = $derived(new Map(items.map((entry) => [entry.item_id, entry])));

	const analyticsFor = (card: { ghiListingId?: string | null }) =>
		card.ghiListingId ? (itemById.get(card.ghiListingId) ?? null) : null;
</script>

{#if cards.length > 0}
	<div
		class="listing-grid"
		use:listImpression={list ? { list, items } : undefined}
	>
		{#each cards as item (item.card._id)}
			<div class="listing-grid__cell" class:listing-grid__cell--wide={item.kind === 'development'}>
				{#if item.kind === 'development'}
					<DevelopmentCard card={item.card} item={analyticsFor(item.card)} />
				{:else}
					<PropertyCard card={item.card} item={analyticsFor(item.card)} />
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
