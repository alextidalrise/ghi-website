<script lang="ts">
	import PropertyLocation from '$lib/components/property/PropertyLocation.svelte';
	import { usingMapTiler } from '$lib/listing/mapStyle';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const location = $derived(data.location);
</script>

<svelte:head>
	<title>Area map prototype · Internal</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="proto">
	<header class="proto__head content-wrap">
		<p class="text-overline">Internal · prototype</p>
		<h1>Listing area map</h1>
		<p class="proto__lede">
			The styled area map as it sits inside a property page's Location section: the
			community shown as a soft area, the linked golf courses pinned exactly. Click
			<em>Explore map</em> to pan and zoom; tap a gold marker for the course.
		</p>
		<p class="proto__source">
			Tiles: {usingMapTiler ? 'MapTiler (PUBLIC_MAPTILER_KEY set)' : 'OpenFreeMap (keyless fallback — add PUBLIC_MAPTILER_KEY to switch)'}
		</p>
	</header>

	<PropertyLocation
		description={location.description}
		address={location.address}
		map={location.map}
		golf={location.golf}
	/>
</main>

<style>
	.proto {
		padding-block: var(--space-2xl);
	}

	.proto__head {
		margin-bottom: var(--space-md);
	}

	.proto__head h1 {
		margin: var(--space-xs) 0 var(--space-sm);
	}

	.proto__lede {
		max-width: 60ch;
		color: var(--charcoal);
	}

	.proto__lede em {
		font-style: italic;
		color: var(--green);
	}

	.proto__source {
		margin-top: var(--space-sm);
		font-size: var(--text-small);
		color: var(--muted);
	}
</style>
