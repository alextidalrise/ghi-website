<script lang="ts">
	import CountryHero from '$lib/components/CountryHero.svelte';
	import AreaOverview from '$lib/components/AreaOverview.svelte';
	import DiscoveryBar from '$lib/components/listing/DiscoveryBar.svelte';
	import FeaturedLocations from '$lib/components/home/FeaturedLocations.svelte';
	import FeaturedListings from '$lib/components/listing/FeaturedListings.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import GoogleReviewsCompact from '$lib/components/reviews/GoogleReviewsCompact.svelte';
	import { countryHeadline, countryOverviewHeading } from '$lib/home/headlines';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const countryLocations = $derived(data.featuredLocations);

	/* The scoped search bar keeps the country selector's shape but with a single, fixed
	   country — this page's subject. Passed as a one-item list so the bar can still resolve
	   the country's name (lead) and flag (mobile trigger). */
	const searchCountries = $derived([
		{
			_id: data.location._id,
			name: data.location.name,
			slug: data.location.slug,
			flagUrl: data.location.flagUrl
		}
	]);

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
	bridgeBelow
>
	{#snippet title()}
		{countryHeadline(data.location.name)}
	{/snippet}
</CountryHero>

<!-- Search bar bridges the green hero and the white page, mirroring the homepage: its
     upper half (the lead) sits over the band's foot, its tray straddles the seam onto white.
     A sibling of the hero (not a child) so the band never clips it, and scoped to this
     country — the visitor refines Location and below, never re-picks the country. -->
<div class="country-search content-wrap">
	<DiscoveryBar
		scopedCountrySlug={data.location.slug}
		countries={searchCountries}
		locations={data.searchLocations}
		communities={data.searchCommunities}
		facetRows={data.searchFacetRows}
		featureFilter={data.featureFilter}
	/>
</div>

<article class="country-page">
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
	/* Bridge: pull the search panel up so it straddles the seam between the green hero band
	   and the white page — the same move the homepage hero → search makes. The hero reserves
	   the footing (bridgeBelow); this negative margin sets how much of the bar rides on green.
	   A stacking context above the band keeps the panel and its dropdowns clear of it. */
	.country-search {
		position: relative;
		z-index: 3;
		margin-top: clamp(-7rem, -8vw, -5rem);
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
