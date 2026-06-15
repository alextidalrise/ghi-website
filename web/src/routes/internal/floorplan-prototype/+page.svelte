<script lang="ts">
	import Floorplan from '$lib/components/property/Floorplan.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Floorplan prototype · Internal</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="proto">
	<header class="proto__head content-wrap">
		<p class="text-overline">Internal · prototype</p>
		<h1>Listing floorplan</h1>
		<p class="proto__lede">
			The floorplan module as it sits in the property page's right-hand info column, under
			Key Facts. Click a preview to open the lightbox; with more than one plan, page between
			floors with the arrows, swipe, or arrow keys.
		</p>
		<p class="proto__source">
			No listing in the dev dataset has an uploaded <code>media.floorplans[]</code> yet, so the
			populated states below borrow gallery photos from <em>{data.sampleTitle}</em> as stand-in
			plans. Production floorplans are line drawings on white; the frame's contain-fit and the
			lightbox's white matte are built for that. The third column is the real empty state.
		</p>
	</header>

	<div class="proto__grid content-wrap">
		<section class="demo">
			<h2 class="demo__title">Two plans</h2>
			<div class="demo__column">
				<Floorplan floorplans={data.plans.multi} title={data.sampleTitle} />
			</div>
		</section>

		<section class="demo">
			<h2 class="demo__title">Single plan</h2>
			<div class="demo__column">
				<Floorplan floorplans={data.plans.single} title={data.sampleTitle} />
			</div>
		</section>

		<section class="demo">
			<h2 class="demo__title">No floorplan</h2>
			<div class="demo__column">
				<Floorplan floorplans={[]} title={data.sampleTitle} />
			</div>
		</section>
	</div>

	{#if !data.hasSampleImages}
		<p class="proto__warn content-wrap">
			The sample listing returned no public gallery images, so the populated columns fall back to
			the empty state. Check that preview-all mode is on (dev default) and the read token is set.
		</p>
	{/if}
</main>

<style>
	.proto {
		padding-block: var(--space-2xl);
	}

	.proto__head {
		margin-bottom: var(--space-xl);
	}

	.proto__head h1 {
		margin: var(--space-xs) 0 var(--space-sm);
	}

	.proto__lede {
		max-width: 60ch;
		color: var(--charcoal);
	}

	.proto__source {
		margin-top: var(--space-sm);
		max-width: 60ch;
		font-size: var(--text-small);
		line-height: 1.6;
		color: var(--muted);
	}

	.proto__source code {
		font-family: var(--sans);
		font-size: 0.95em;
		color: var(--green);
	}

	.proto__source em {
		font-style: italic;
		color: var(--green);
	}

	/* Each demo sits in a ~22rem column so the module is reviewed at the real
	   width it renders at in the listing info rail, not full-bleed. */
	.proto__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 18rem));
		gap: var(--space-2xl) clamp(1.5rem, 3vw, 2.5rem);
		align-items: start;
	}

	.demo__title {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
		padding-bottom: var(--space-sm);
		margin-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border);
	}

	.proto__warn {
		margin-top: var(--space-xl);
		font-size: var(--text-small);
		color: var(--muted);
	}
</style>
