<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
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

<article class="location-stub">
	<Breadcrumbs items={data.breadcrumbs} />

	<div class="location-stub__body content-wrap">
		<h1>{data.community.name}</h1>
		<p class="location-stub__intro">
			{data.community.publicDescription ?? placeholderBody}
		</p>

		{#if data.listings.length > 0}
			<p class="location-stub__count">
				{data.listings.length} listing{data.listings.length === 1 ? '' : 's'} in this community.
			</p>
		{/if}
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

	.location-stub__count {
		margin-top: var(--space-lg);
		color: var(--green);
	}
</style>
