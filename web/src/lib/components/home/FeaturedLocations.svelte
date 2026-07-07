<script lang="ts">
	import type { FeaturedLocationCard } from '$lib/sanity/transforms/taxonomyHero';
	import LocationTiles from '$lib/components/home/LocationTiles.svelte';

	type Props = {
		locations: FeaturedLocationCard[];
		heading?: string;
		summary?: string;
		/** Hard cap on tiles per row in the desktop grid; passed straight to LocationTiles. */
		maxColumns?: number;
	};

	let {
		locations,
		heading = 'Featured locations',
		summary = 'Ten destinations across Spain and Portugal.',
		maxColumns = 4
	}: Props = $props();
</script>

{#if locations.length > 0}
	<section class="featured-locations" aria-labelledby="locations-heading">
		<div class="featured-locations__head">
			<h2 id="locations-heading">{heading}</h2>
			{#if summary}
				<p class="featured-locations__summary">{summary}</p>
			{/if}
		</div>

		<!-- Shared tile grid. showCountry labels each tile with its country: on the country
		     page every tile belongs to the same country, so the overline is a quiet
		     wayfinding echo rather than the grouping the homepage gets from its headers. -->
		<LocationTiles {locations} {maxColumns} showCountry />
	</section>
{/if}

<style>
	.featured-locations {
		min-width: 0;
	}

	.featured-locations__head {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
	}

	.featured-locations__summary {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}
</style>
