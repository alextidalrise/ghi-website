<script lang="ts">
	import FrontlineHero from '$lib/components/listing/FrontlineHero.svelte';
	import ListingResults from '$lib/components/listing/ListingResults.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={data.seo.canonicalUrl} />
	{#if data.seo.noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.seo.canonicalUrl} />
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />

	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<article class="frontline-page">
	<FrontlineHero
		eyebrow={data.hero.eyebrow}
		headline={data.hero.headline}
		lead={data.hero.lead}
		image={data.hero.image}
		breadcrumbs={data.breadcrumbs}
		ctaHref="#properties"
		ctaLabel="Browse the collection"
	/>

	<div id="properties" class="frontline-page__results">
		<ListingResults
			basePath={data.basePath}
			searchParams={data.searchParams}
			cards={data.listingResults.cards}
			total={data.listingResults.total}
			pagination={data.listingResults.pagination}
			heading="Frontline golf homes"
			courseOptions={data.courseOptions}
			showGolfRelevance={false}
		/>
	</div>
</article>

<style>
	.frontline-page {
		padding-bottom: var(--space-2xl);
	}

	/* Offset the smooth-scroll target so the heading clears the sticky nav. */
	.frontline-page__results {
		scroll-margin-top: calc(var(--nav-height) + var(--space-md));
	}
</style>
