<script lang="ts">
	import GuideTextHero from '$lib/components/guides/GuideTextHero.svelte';
	import GuideCardLink from '$lib/components/guides/GuideCardLink.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const groups = $derived(data.groups);
	const hasGuides = $derived(groups.length > 0);
	// One group renders without its own heading; multiple groups each get a heading to
	// separate the categories.
	const showGroupHeadings = $derived(groups.length > 1);

	const pageTitle = 'Guides | Golf Homes International';
	const metaDescription =
		'Detailed, current guidance on buying property near the finest golf in Spain and Portugal: the legal process, the costs, and the decisions that matter.';
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={data.canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.canonicalUrl} />
	<meta property="og:title" content="Guides" />
	<meta property="og:description" content={metaDescription} />
	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<GuideTextHero
	title="Guides"
	lead="Considered, current guidance on buying and owning a home near the finest golf in Spain and Portugal."
	breadcrumbs={data.breadcrumbs}
/>

<div class="guides-hub">
	{#if hasGuides}
		{#each groups as group (group.category)}
			<section class="guides-hub__group content-wrap" aria-labelledby={`group-${group.category}`}>
				<div class="guides-hub__group-head">
					<h2 class="guides-hub__group-heading" id={`group-${group.category}`}>
						{showGroupHeadings ? group.meta.label : 'Where to start'}
					</h2>
					<p class="guides-hub__group-blurb">{group.meta.blurb}</p>
				</div>
				<ul class="guides-hub__list">
					{#each group.guides as card (card._id)}
						<li class="guides-hub__item">
							<GuideCardLink {card} />
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{:else}
		<section class="guides-hub__empty content-wrap">
			<p>The first guides are being written. Check back shortly.</p>
		</section>
	{/if}
</div>

<style>
	.guides-hub {
		padding-block: var(--space-2xl);
	}

	.guides-hub__group + .guides-hub__group {
		margin-top: var(--section-gap);
	}

	.guides-hub__group-head {
		max-width: 44rem;
		margin-bottom: var(--space-md);
	}

	.guides-hub__group-blurb {
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: clamp(1.0625rem, 0.95rem + 0.4vw, 1.2rem);
		font-weight: 300;
		line-height: 1.6;
		color: var(--muted);
		text-wrap: pretty;
	}

	.guides-hub__list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--border);
	}

	.guides-hub__item {
		border-bottom: 1px solid var(--border);
	}

	.guides-hub__empty {
		padding-block: var(--space-xl);
		font-family: var(--sans);
		color: var(--muted);
	}
</style>
