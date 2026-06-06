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
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import {
		shouldShowDevelopmentPricing,
		showsUnitTypes,
		showsUnits
	} from '$lib/listing/developmentDisplay';
	import type { PublicDevelopment, PublicPropertyListing } from '$lib/sanity/transforms';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		pageType: 'property' | 'development';
		property?: PublicPropertyListing | null;
		development?: PublicDevelopment | null;
		breadcrumbs: BreadcrumbItem[];
		similarCards?: SimilarListingCard[];
	};

	let {
		pageType,
		property = null,
		development = null,
		breadcrumbs,
		similarCards = []
	}: Props = $props();

	const displayMode = $derived(development?.developmentDisplayMode ?? 'flat_listing');
	const showInventoryPricing = $derived(shouldShowDevelopmentPricing(displayMode));
</script>

{#if pageType === 'property' && property}
	<PropertyDetail {property} {breadcrumbs} {similarCards} />
{:else if pageType === 'development' && development}
	<article class="listing-page">
		<Breadcrumbs items={breadcrumbs} />
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
	.listing-page {
		padding-bottom: 0;
	}
</style>
