<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import ContentSection from '$lib/components/property/ContentSection.svelte';
	import GolfInfo from '$lib/components/property/GolfInfo.svelte';
	import LocationSection from '$lib/components/property/LocationSection.svelte';
	import PropertyDetail from '$lib/components/property/PropertyDetail.svelte';
	import DevelopmentEnquiryCta from '$lib/components/development/EnquiryCta.svelte';
	import DevelopmentGallery from '$lib/components/development/Gallery.svelte';
	import DevelopmentHero from '$lib/components/development/Hero.svelte';
	import DevelopmentKeyFacts from '$lib/components/development/KeyFacts.svelte';
	import SharedAmenities from '$lib/components/development/SharedAmenities.svelte';
	import UnitTypesList from '$lib/components/development/UnitTypesList.svelte';
	import UnitsList from '$lib/components/development/UnitsList.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';
	import {
		shouldShowDevelopmentPricing,
		showsUnitTypes,
		showsUnits
	} from '$lib/listing/developmentDisplay';
	import ListingDetailPreview from './ListingDetailPreview.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const property = $derived(data.preview ? null : data.pageType === 'property' ? data.property : null);
	const development = $derived(
		data.preview ? null : data.pageType === 'development' ? data.development : null
	);
	const displayMode = $derived(development?.developmentDisplayMode ?? 'flat_listing');
	const showInventoryPricing = $derived(shouldShowDevelopmentPricing(displayMode));
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
	<ListingDetailPreview {data} />
{:else if property}
	<PropertyDetail {property} breadcrumbs={data.breadcrumbs} similarCards={data.similarCards} />
{:else if development}
	<article class="listing-page">
		<Breadcrumbs items={data.breadcrumbs} />
		<DevelopmentHero {development} />
		<DevelopmentGallery {development} />
		<DevelopmentKeyFacts {development} />

		<ContentSection title="About" body={development.content?.aboutDescription} />

		{#if showsUnitTypes(displayMode)}
			<UnitTypesList unitTypes={development.unitTypes} showPricing={showInventoryPricing} />
		{/if}

		{#if showsUnits(displayMode)}
			<UnitsList units={development.units} showPricing={showInventoryPricing} />
		{/if}

		<SharedAmenities {development} />

		<LocationSection
			description={development.content?.locationDescription}
			address={development.location?.addressDisplay}
			map={development.location?.map}
		/>

		<GolfInfo golf={development.golf} description={development.content?.golfDescription} />

		<DevelopmentEnquiryCta {development} />
	</article>
{/if}

<style>
	/* Development article only; the property page is wholly owned by PropertyDetail. */
	.listing-page {
		padding-bottom: 0;
	}
</style>
