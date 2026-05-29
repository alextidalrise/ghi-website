<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import ListingResults from '$lib/components/listing/ListingResults.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const placeholderBody = $derived(
		`Property listings and editorial content for ${data.community.name} coming soon.`
	);
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	{#if data.seo.description}
		<meta name="description" content={data.seo.description} />
	{/if}
	<link rel="canonical" href={data.seo.canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.seo.canonicalUrl} />
	<meta property="og:title" content={data.seo.openGraphTitle ?? data.seo.title} />
	{#if data.seo.openGraphDescription}
		<meta property="og:description" content={data.seo.openGraphDescription} />
	{/if}

	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<article class="location-page">
	<Breadcrumbs items={data.breadcrumbs} />

	<div class="location-page__body content-wrap">
		<h1>{data.community.name}</h1>
		<p class="location-page__intro">
			{data.community.publicDescription ?? placeholderBody}
		</p>

		<FrontlineListings
			cards={data.frontlineCards}
			heading={`Frontline golf in ${data.community.name}`}
			viewAllHref={data.frontlineViewAllHref}
		/>

		<ListingResults
			basePath={data.canonicalPath}
			searchParams={data.searchParams}
			cards={data.listingResults.cards}
			total={data.listingResults.total}
			pagination={data.listingResults.pagination}
		/>
	</div>
</article>

<style>
	.location-page__body {
		padding-block: var(--space-xl) var(--space-2xl);
	}

	.location-page__intro {
		margin-top: var(--space-md);
		max-width: 42rem;
	}
</style>
