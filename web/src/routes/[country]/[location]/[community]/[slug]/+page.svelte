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
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';
	import {
		shouldShowDevelopmentPricing,
		showsUnitTypes,
		showsUnits
	} from '$lib/listing/developmentDisplay';

	let { data } = $props();

	const isProperty = $derived(data.pageType === 'property');
	const property = $derived(isProperty ? data.property : null);
	const development = $derived(!isProperty ? data.development : null);
	const displayMode = $derived(development?.developmentDisplayMode ?? 'flat_listing');
	const showInventoryPricing = $derived(shouldShowDevelopmentPricing(displayMode));
</script>

<svelte:head>
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
		background: var(--linen);
		color: var(--green);
	}
</style>
