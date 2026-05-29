<script lang="ts">
	import ListingGrid from './ListingGrid.svelte';
	import type { PublicPropertyCard } from '$lib/sanity/transforms/propertyCard';

	type Props = {
		cards: PublicPropertyCard[];
		heading: string;
		viewAllHref?: string;
	};

	let { cards, heading, viewAllHref }: Props = $props();
</script>

{#if cards.length > 0}
	<section class="frontline-listings" aria-labelledby="frontline-heading">
		<div class="frontline-listings__head">
			<h2 id="frontline-heading">{heading}</h2>
			<p class="frontline-listings__summary">
				{cards.length === 1 ? '1 property' : `${cards.length} properties`} on the golf course
			</p>
		</div>

		<ListingGrid {cards} />

		{#if viewAllHref}
			<p class="frontline-listings__footer">
				<a href={viewAllHref}>View all frontline properties</a>
			</p>
		{/if}
	</section>
{/if}

<style>
	.frontline-listings {
		margin-top: var(--space-xl);
	}

	.frontline-listings__head {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.frontline-listings__summary {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.frontline-listings__footer {
		margin-top: var(--space-md);
	}

	.frontline-listings__footer a {
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
</style>
