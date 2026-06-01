<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import ContentSection from '$lib/components/property/ContentSection.svelte';
	import EnquiryCta from '$lib/components/property/EnquiryCta.svelte';
	import Gallery from '$lib/components/property/Gallery.svelte';
	import GolfInfo from '$lib/components/property/GolfInfo.svelte';
	import Hero from '$lib/components/property/Hero.svelte';
	import KeyFacts from '$lib/components/property/KeyFacts.svelte';
	import LocationSection from '$lib/components/property/LocationSection.svelte';
	import DevelopmentEnquiryCta from '$lib/components/development/EnquiryCta.svelte';
	import DevelopmentGallery from '$lib/components/development/Gallery.svelte';
	import DevelopmentHero from '$lib/components/development/Hero.svelte';
	import DevelopmentKeyFacts from '$lib/components/development/KeyFacts.svelte';
	import SharedAmenities from '$lib/components/development/SharedAmenities.svelte';
	import UnitTypesList from '$lib/components/development/UnitTypesList.svelte';
	import UnitsList from '$lib/components/development/UnitsList.svelte';
	import { withPreviewLocationSeo } from '$lib/listing/detailPage';
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
	import type { PageData } from './$types';

	type PreviewPageData = Extract<PageData, { preview: true }>;

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
	<article class="listing-page">
		<Breadcrumbs items={data.breadcrumbs} />
		<Hero listing={property} />
		<Gallery media={property.media} title={property.publicTitle ?? 'Property'} />
		<KeyFacts listing={property} />

		<ContentSection title="About" body={property.content?.aboutDescription} />
		<ContentSection title="Overview" body={property.content?.longDescription} />
		<ContentSection title="Lifestyle" body={property.content?.lifestyleDescription} />

		<LocationSection
			description={property.content?.locationDescription}
			address={property.location?.addressDisplay}
			map={property.location?.map}
		/>

		<GolfInfo golf={property.golf} description={property.content?.golfDescription} />

		{#if property.content?.amenities && property.content.amenities.length > 0}
			<section class="amenities content-wrap" aria-labelledby="amenities-heading">
				<h2 id="amenities-heading">Amenities</h2>
				<ul class="amenities__list">
					{#each property.content.amenities as amenity (amenity)}
						<li>{amenity}</li>
					{/each}
				</ul>
			</section>
		{/if}

		<EnquiryCta listing={property} />
	</article>
{:else if development}
	<article class="listing-page">
		<Breadcrumbs items={data.breadcrumbs} />
		<DevelopmentHero {development} />
		<DevelopmentGallery {development} />
		<DevelopmentKeyFacts {development} />

		<ContentSection title="About" body={development.content?.aboutDescription} />
		<ContentSection title="Overview" body={development.content?.longDescription} />
		<ContentSection title="Lifestyle" body={development.content?.lifestyleDescription} />

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
	.listing-page {
		padding-bottom: 0;
	}

	.amenities {
		padding-block: var(--space-xl);
	}

	.amenities h2 {
		margin-bottom: var(--space-md);
	}

	.amenities__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		list-style: none;
	}

	.amenities__list li {
		font-size: var(--text-ui);
		padding: 0.45rem 0.85rem;
		border: 1px solid var(--border);
		color: var(--green);
	}
</style>
