<script lang="ts">
	import SpotlightCard from './SpotlightCard.svelte';
	import type { PublicPropertyCard } from '$lib/sanity/transforms/propertyCard';

	type Props = {
		cards: PublicPropertyCard[];
		surface?: 'light' | 'green';
		/** id of the section heading this rail belongs to, for the list's accessible name. */
		labelledby?: string;
		/**
		 * `false` (default): contained rail that scrolls within its column (Featured).
		 * `true`: the first card aligns to the page content column and the rail runs off
		 * the right screen edge. Must sit inside a full-bleed (100vw) parent (Frontline).
		 */
		bleed?: boolean;
	};

	let { cards, surface = 'light', labelledby, bleed = false }: Props = $props();
</script>

<ul class="rail" class:rail--bleed={bleed} aria-labelledby={labelledby}>
	{#each cards as card, index (card._id)}
		<li class="rail__item" style="--reveal-delay: {index * 70}ms">
			<SpotlightCard {card} {surface} />
		</li>
	{/each}
</ul>

<style>
	/* A horizontal scroll-snap rail: a curated selection that invites a swipe, not a
	   results grid. The next card peeks to signal more. */
	.rail {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: clamp(15rem, 26vw, 20rem);
		gap: var(--space-md);
		margin: 0;
		padding: 0;
		list-style: none;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		/* Breathing room so the focus ring and hover lift aren't clipped by overflow. */
		padding-block: 0.5rem;
	}

	.rail::-webkit-scrollbar {
		display: none;
	}

	.rail__item {
		min-width: 0;
		scroll-snap-align: start;
	}

	/* Contained rail (Featured): bleed to the viewport edges on phones so a full card
	   width is usable and the next card peeks. Mirrors the Featured Locations rail. */
	@media (max-width: 767px) {
		.rail:not(.rail--bleed) {
			grid-auto-columns: clamp(14rem, 72vw, 18.5rem);
			margin-inline: calc(-1 * var(--content-padding));
			padding-inline: var(--content-padding);
			scroll-padding-inline-start: var(--content-padding);
		}
	}

	/* Bleed rail (Frontline): the rail spans the full viewport width. Cards begin at
	   the page's edge gutter and run off the right edge, so the premier band fills with
	   listings rather than leaving flat green at the sides. (The heading above stays in
	   the content column; the contained-heading / full-bleed-media offset is deliberate.) */
	.rail--bleed {
		grid-auto-columns: clamp(16rem, 22vw, 21rem);
		padding-inline-start: var(--content-padding);
		padding-inline-end: 0;
		scroll-padding-inline-start: var(--content-padding);
	}

	@media (max-width: 767px) {
		.rail--bleed {
			grid-auto-columns: clamp(14rem, 72vw, 18.5rem);
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.rail__item {
			opacity: 0;
			transform: translateY(16px);
			animation: rail-reveal 0.6s var(--ease) forwards;
			animation-delay: var(--reveal-delay, 0ms);
		}

		@keyframes rail-reveal {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
