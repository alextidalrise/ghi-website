<script lang="ts">
	import ListingRail from './ListingRail.svelte';
	import SpotlightCard from './SpotlightCard.svelte';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		cards: SimilarListingCard[];
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
	<!-- Full-bleed: the section breaks out of the content column to the viewport edges.
	     The head sits in an inner wrapper aligned to the content gutter; the rail bleeds
	     off the right edge, so the carousel fills the width instead of sitting in the
	     narrower page column. Stays on white — Frontline owns the page's one green band. -->
	<section class="featured" aria-labelledby="featured-heading">
		<div class="featured__inner">
			<div class="featured__head">
				<div class="featured__heading">
					<h2 id="featured-heading">{heading}</h2>
					<p class="featured__summary">{summaryLine}</p>
				</div>
				{#if cards.length > 1}
					<span class="featured__cue" aria-hidden="true">‹ scroll ›</span>
				{/if}
			</div>
		</div>

		<ListingRail
			items={cards}
			getKey={(c, i) => `${c.card._id}-${i}`}
			bleed
			labelledby="featured-heading"
		>
			{#snippet card(c)}
				{#if c.kind === 'development'}
					<SpotlightCard card={c.card} kind="development" surface="light" showLocation />
				{:else}
					<SpotlightCard card={c.card} surface="light" showLocation />
				{/if}
			{/snippet}
		</ListingRail>
	</section>
{/if}

<style>
	.featured {
		/* Escape the surrounding content column to the viewport edges. The page-level
		   `overflow-x: clip` on .site-main absorbs the scrollbar gutter. */
		width: 100vw;
		margin-inline: calc(50% - 50vw);
	}

	/* Re-establish the content gutter for the head so it aligns to the same edge as the
	   bleeding rail's first card. */
	.featured__inner {
		padding-inline: var(--content-padding);
	}

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
