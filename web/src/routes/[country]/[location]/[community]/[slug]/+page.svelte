<script lang="ts">
	import ListingDetailPage from '$lib/components/listing/ListingDetailPage.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';
	import ListingDetailPreview from './ListingDetailPreview.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const property = $derived(data.preview ? null : data.pageType === 'property' ? data.property : null);
	const development = $derived(
		data.preview ? null : data.pageType === 'development' ? data.development : null
	);
</script>

<svelte:head>
	{#if !data.preview}
		<title>{data.seo.title}</title>
		{#if data.seo.description}
			<meta name="description" content={data.seo.description} />
		{/if}
		<link rel="canonical" href={data.seo.canonicalUrl} />
		{#if data.seo.noindex}
			<meta name="robots" content="noindex, nofollow" />
		{/if}

		<meta property="og:type" content="website" />
		<meta property="og:url" content={data.seo.canonicalUrl} />
		{#if data.seo.openGraphTitle}
			<meta property="og:title" content={data.seo.openGraphTitle} />
		{/if}
		{#if data.seo.openGraphDescription}
			<meta property="og:description" content={data.seo.openGraphDescription} />
		{/if}
		{#if data.seo.openGraphImageUrl}
			<meta property="og:image" content={data.seo.openGraphImageUrl} />
		{/if}

		{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
		{#if data.listingJsonLd}
			{@html jsonLdScriptHtml(data.listingJsonLd)}
		{/if}
	{/if}
</svelte:head>

{#if data.preview}
	<!-- Remount the preview when the editor switches documents: ListingDetailPreview
	     wires its Sanity live query once on mount, so without this key a client-side
	     navigation to another listing would keep showing the first one's data. -->
	{#key data.canonicalUrl}
		<ListingDetailPreview {data} />
	{/key}
{:else}
	<ListingDetailPage
		pageType={data.pageType}
		{property}
		{development}
		breadcrumbs={data.breadcrumbs}
		similarCards={data.similarCards}
		reviews={data.reviews}
		shelf={data.shelf}
		{form}
	/>
{/if}
