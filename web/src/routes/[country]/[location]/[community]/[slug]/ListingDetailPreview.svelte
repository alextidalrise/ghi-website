<script lang="ts">
	import ListingDetailPage from '$lib/components/listing/ListingDetailPage.svelte';
	import { withPreviewLocationSeo, type DevelopmentDetailPageData, type PropertyDetailPageData } from '$lib/listing/detailPage';
	import { buildDevelopmentSeo, buildPropertySeo } from '$lib/listing/seo';
	import {
		toPublicDevelopment,
		toPublicPropertyListing,
		type RawDevelopment,
		type RawPropertyListing
	} from '$lib/sanity/transforms';
	import type { QueryResponseInitial } from '@sanity/svelte-loader';
	import { useQuery } from '@sanity/svelte-loader';

	type PreviewPageData = {
		preview: true;
		previewQuery: string;
		queryParams: Record<string, unknown>;
		listingInitial: QueryResponseInitial<RawPropertyListing | RawDevelopment | null>;
	} & (PropertyDetailPageData | DevelopmentDetailPageData);

	let {
		data
	}: {
		data: PreviewPageData;
	} = $props();

	const listingQuery = useQuery<RawPropertyListing | RawDevelopment | null>(
		data.previewQuery,
		data.queryParams,
		{ initial: data.listingInitial as QueryResponseInitial<RawPropertyListing | RawDevelopment | null> }
	);

	const property = $derived.by(() => {
		if (data.pageType !== 'property') {
			return null;
		}

		const raw = $listingQuery.data as RawPropertyListing | null | undefined;
		return toPublicPropertyListing(raw ?? null) ?? data.property;
	});

	const development = $derived.by(() => {
		if (data.pageType !== 'development') {
			return null;
		}

		const raw = $listingQuery.data as RawDevelopment | null | undefined;
		return toPublicDevelopment(raw ?? null) ?? data.development;
	});

	const seo = $derived.by(() => {
		if (property) {
			return withPreviewLocationSeo(buildPropertySeo(property, data.canonicalUrl));
		}

		if (development) {
			return withPreviewLocationSeo(buildDevelopmentSeo(development, data.canonicalUrl));
		}

		return data.seo;
	});
</script>

<svelte:head>
	<title>{seo.title}</title>
	{#if seo.description}
		<meta name="description" content={seo.description} />
	{/if}
	<link rel="canonical" href={seo.canonicalUrl} />
	<meta name="robots" content="noindex, nofollow" />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={seo.canonicalUrl} />
	{#if seo.openGraphTitle}
		<meta property="og:title" content={seo.openGraphTitle} />
	{/if}
	{#if seo.openGraphDescription}
		<meta property="og:description" content={seo.openGraphDescription} />
	{/if}
	{#if seo.openGraphImageUrl}
		<meta property="og:image" content={seo.openGraphImageUrl} />
	{/if}
</svelte:head>

<!-- Preview renders through the same component tree as the live page, so what an
     editor sees in Presentation is exactly what ships. Units are synthesized from
     three documents, so the development inventory does not carry field-level overlay. -->
{#if property}
	<ListingDetailPage pageType="property" {property} breadcrumbs={data.breadcrumbs} similarCards={data.similarCards ?? []} />
{:else if development}
	<ListingDetailPage pageType="development" {development} breadcrumbs={data.breadcrumbs} similarCards={data.similarCards ?? []} />
{/if}
