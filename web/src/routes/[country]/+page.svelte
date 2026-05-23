<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const placeholderBody = $derived(
		`Property listings and editorial content for ${data.location.name} coming soon.`
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

<article class="location-stub">
	<Breadcrumbs items={data.breadcrumbs} />

	<div class="location-stub__body content-wrap">
		<h1>{data.location.name}</h1>
		<p class="location-stub__intro">
			{data.location.publicDescription ?? placeholderBody}
		</p>
	</div>
</article>

<style>
	.location-stub__body {
		padding-block: var(--space-xl) var(--space-2xl);
	}

	.location-stub__intro {
		margin-top: var(--space-md);
		max-width: 42rem;
	}
</style>
