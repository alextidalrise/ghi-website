<script lang="ts">
	import type { PublicMapPayload } from '$lib/sanity/transforms/mapPrivacy';
	import type { PublicGolf } from '$lib/sanity/transforms';
	import type { PortableTextBlock as PtBlock } from '@portabletext/types';
	import PortableTextBlock from './PortableTextBlock.svelte';
	import StyledAreaMap from './StyledAreaMap.svelte';
	import GolfCourseCard from './GolfCourseCard.svelte';
	import { buildGolfPins } from '$lib/listing/mapPins';

	type Props = {
		description?: PtBlock[] | null | undefined;
		address: string | null | undefined;
		map: PublicMapPayload | null | undefined;
		golf: PublicGolf | null | undefined;
	};

	let { description, address, map, golf }: Props = $props();

	const mapLabel = $derived(map?.label ?? address ?? null);
	const hasDescription = $derived(Boolean(description && description.length > 0));
	const hasCard = $derived(Boolean(golf?.linkedGolfCourses?.some((course) => course?.name)));
	const hasMap = $derived(Boolean(map?.coordinates));
	const golfPins = $derived(buildGolfPins(golf));
</script>

<section class="location content-wrap" aria-labelledby="location-heading">
	<div class="location__intro">
		<h2 id="location-heading">Location</h2>
		{#if mapLabel}
			<p class="location__address">{mapLabel}</p>
		{/if}
		{#if hasDescription}
			<div class="location__copy"><PortableTextBlock value={description} /></div>
		{/if}
	</div>

	{#if hasMap || hasCard}
		<div
			class="location__grid"
			class:location__grid--pair={hasMap && hasCard}
			class:location__grid--card-only={hasCard && !hasMap}
		>
			{#if hasMap}
				<StyledAreaMap {map} {golfPins} />
			{/if}
			{#if hasCard}
				<GolfCourseCard {golf} />
			{/if}
		</div>
	{/if}
</section>

<style>
	.location {
		padding-block: var(--space-xl);
	}

	.location__intro h2 {
		margin-bottom: var(--space-sm);
	}

	.location__address {
		font-family: var(--serif);
		font-size: 1.125rem;
		color: var(--green);
		margin-bottom: var(--space-md);
	}

	.location__copy {
		max-width: 65ch;
	}

	.location__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-lg);
		margin-top: var(--space-lg);
		align-items: start;
	}

	/* A lone course card shouldn't stretch the full text width; keep it aside-sized. */
	.location__grid--card-only {
		max-width: 26rem;
	}

	/* Map beside the course card on desktop; the map takes the larger share. A lone
	   map keeps the full width (single column). */
	@media (min-width: 880px) {
		.location__grid--pair {
			grid-template-columns: minmax(0, 1.6fr) minmax(16rem, 1fr);
		}
	}
</style>
