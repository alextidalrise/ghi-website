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
	import { withPreviewLocationSeo, type DevelopmentDetailPageData, type PropertyDetailPageData } from '$lib/listing/detailPage';
	import {
		shouldShowDevelopmentPricing,
		showsUnitTypes,
		showsUnits
	} from '$lib/listing/developmentDisplay';
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

	const displayMode = $derived(development?.developmentDisplayMode ?? 'flat_listing');
	const showInventoryPricing = $derived(shouldShowDevelopmentPricing(displayMode));
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

{#if property}
	<PropertyDetail {property} breadcrumbs={data.breadcrumbs} />
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
