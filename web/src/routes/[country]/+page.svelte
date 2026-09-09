<script lang="ts">
	import CountryHero from '$lib/components/CountryHero.svelte';
	import AreaOverview from '$lib/components/AreaOverview.svelte';
	import ListingResults from '$lib/components/listing/ListingResults.svelte';
	import FeaturedListings from '$lib/components/listing/FeaturedListings.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import GoogleReviewsCompact from '$lib/components/reviews/GoogleReviewsCompact.svelte';
	import { countryHeadline, countryOverviewHeading } from '$lib/home/headlines';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const overviewBody = $derived(data.location.publicDescription?.trim() || undefined);
	const overviewHeading = $derived(
		data.location.overviewHeading?.trim() || countryOverviewHeading(data.location.name)
	);

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
	{#if data.seo.noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.seo.canonicalUrl} />
	<meta property="og:title" content={data.seo.openGraphTitle ?? data.seo.title} />
	{#if data.seo.openGraphDescription}
		<meta property="og:description" content={data.seo.openGraphDescription} />
	{/if}

	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<CountryHero
	countrySlug={data.location.slug}
	flagUrl={data.location.flagUrl}
	breadcrumbs={data.breadcrumbs}
	tagline={data.location.tagline ?? undefined}
>
	{#snippet title()}
		{countryHeadline(data.location.name)}
	{/snippet}
</CountryHero>

<!-- Properties lead the page: someone who clicked this country wants to see its listings.
     The filter bar's Location facet narrows within the country; wayfinding into individual
     location pages lives in the homepage grid and the nav menu. -->
<div id="properties" class="country-page__results">
	<ListingResults
		basePath={`/${data.location.slug}`}
		searchParams={data.searchParams}
		cards={data.listingResults.cards}
		total={data.listingResults.total}
		pagination={data.listingResults.pagination}
		heading={`Properties in ${data.location.name}`}
		locationOptions={data.locationOptions}
		featureOptions={data.featureOptions}
		priorityCount={3}
	/>
</div>

<article class="country-page">
	<section class="country-page__content content-wrap">
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

		<!-- Long-form country overview closes the page: the grids lead with the property
		     inventory buyers came for, and the editorial context sits beneath them. -->
		<div class="country-page__overview">
			{#if overviewBody}
				<AreaOverview heading={overviewHeading} body={overviewBody} />
			{:else}
				<p class="country-page__lead">{placeholderBody}</p>
			{/if}
		</div>

		<!-- Trust closes the page. The reader has seen the inventory and read the country
		     context; the last word before the footer is other buyers'. Compact by design —
		     a country page's job is to send people into listings, not to hold them here. -->
		<GoogleReviewsCompact data={data.reviews} />
	</section>
</article>

<style>
	/* Pagination and the mobile "Filter & sort" both link back to #properties, so offset the
	   smooth-scroll target below the sticky nav (mirrors the location page's results anchor). */
	.country-page__results {
		scroll-margin-top: calc(var(--nav-height) + var(--space-md));
	}

	.country-page__lead {
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
