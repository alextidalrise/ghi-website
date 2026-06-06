<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import AreaOverview from '$lib/components/AreaOverview.svelte';
	import FeaturedLocations from '$lib/components/home/FeaturedLocations.svelte';
	import FeaturedListings from '$lib/components/listing/FeaturedListings.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import { countryHeadline, countryOverviewHeading } from '$lib/home/headlines';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const countryHero = $derived(data.countryHero);
	const countryLocations = $derived(data.featuredLocations);

	const overviewBody = $derived(data.location.publicDescription?.trim() || undefined);
	const overviewHeading = $derived(
		data.location.overviewHeading?.trim() || countryOverviewHeading(data.location.name)
	);

	const placeholderBody = $derived(
		`Property listings and editorial content for ${data.location.name} coming soon.`
	);

	const locationsSummary = $derived.by(() => {
		if (countryLocations.length === 0) return undefined;
		const names = countryLocations.map((location) => location.name);
		if (names.length === 1) return names[0];
		if (names.length === 2) return `${names[0]} and ${names[1]}.`;
		return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}.`;
	});
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

{#if countryHero}
	<PageHero
		image={countryHero.url}
		srcset={countryHero.srcset}
		alt={countryHero.alt}
		lead={countryHero.tagline ?? undefined}
		compact
		fetchpriority="high"
	>
		{#snippet title()}
			{countryHeadline(data.location.name)}
		{/snippet}
	</PageHero>
{/if}

<article class="country-page">
	<div class="country-page__intro content-wrap">
		<Breadcrumbs items={data.breadcrumbs} />

		{#if !countryHero}
			<h1 class="country-page__title">{countryHeadline(data.location.name)}</h1>
		{/if}

		{#if overviewBody}
			<AreaOverview heading={overviewHeading} body={overviewBody} />
		{:else}
			<p class="country-page__lead">{placeholderBody}</p>
		{/if}
	</div>

	<section class="country-page__content content-wrap">
		{#if countryLocations.length > 0}
			<FeaturedLocations
				locations={countryLocations}
				heading="Locations"
				summary={locationsSummary}
			/>
		{/if}

		<FeaturedListings
			cards={data.featuredCards}
			heading={`Featured properties in ${data.location.name}`}
			summary={`Hand-picked listings across ${data.location.name}.`}
		/>

		<FrontlineListings
			cards={data.frontlineCards}
			heading={`Frontline golf in ${data.location.name}`}
			summary={`Homes directly on the fairway in ${data.location.name}.`}
			viewAllHref={data.frontlineViewAllHref}
		/>
	</section>
</article>

<style>
	.country-page__intro {
		padding-block: var(--space-xl) 0;
	}

	.country-page__title {
		margin-top: var(--space-md);
	}

	.country-page__lead {
		margin-top: var(--space-md);
		max-width: 42rem;
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.7;
	}

	.country-page__content {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		padding-block: var(--section-gap) var(--space-2xl);
		row-gap: var(--section-gap);
	}

	.country-page__content > :global(*) {
		margin-block: 0;
	}
</style>
