<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import ListingResults from '$lib/components/listing/ListingResults.svelte';
	import { locationFeatureByPath, locationHeadline } from '$lib/home/curated';
	import { buildListingSearchHref } from '$lib/listing/searchParams';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const placeholderBody = $derived(
		`Property listings and editorial content for ${data.location.name} coming soon.`
	);

	// Curated hero photograph + positioning line for this location, when one exists.
	const locationFeature = $derived(locationFeatureByPath(data.canonicalPath));

	// The hero stays location-level; an active community filter refines the results
	// below, so it surfaces in the hero title/lead to keep the page in context.
	const heroTitle = $derived(
		data.activeCommunity?.name
			? `${data.activeCommunity.name} — ${data.location.name}`
			: locationHeadline(data.location.name)
	);

	const heroLead = $derived(
		data.activeCommunity?.publicDescription ??
			data.location.publicDescription ??
			locationFeature?.tagline
	);

	// Only direct communities (sub-areas whose listings live under this location) can
	// filter this location's results; associated communities resolve elsewhere.
	const communityOptions = $derived(
		data.directCommunities
			.filter((community): community is typeof community & { slug: string; name: string } =>
				Boolean(community.slug && community.name)
			)
			.map((community) => ({ label: community.name, value: community.slug }))
	);

	const introText = $derived(
		data.activeCommunity?.publicDescription ??
			data.location.publicDescription ??
			placeholderBody
	);

	function communityFilterHref(communitySlug: string) {
		return buildListingSearchHref(data.canonicalPath, data.searchParams, {
			community: communitySlug,
			page: 1
		});
	}

	function relatedAreaHref(slug: string) {
		return `/${data.country.slug}/${slug}`;
	}
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

{#if locationFeature}
	<PageHero
		image={locationFeature.image}
		alt={locationFeature.alt}
		breadcrumbs={data.breadcrumbs}
		lead={heroLead}
		ctaHref="#properties"
		ctaLabel="Browse properties"
		compact
		fetchpriority="high"
	>
		{#snippet title()}
			{heroTitle}
		{/snippet}
	</PageHero>
{/if}

<article class="location-page" class:location-page--has-hero={locationFeature}>
	{#if !locationFeature}
		<Breadcrumbs items={data.breadcrumbs} />
	{/if}

	<div class="location-page__top content-wrap">
		{#if !locationFeature}
			<h1>{heroTitle}</h1>
			<p class="location-page__intro">{introText}</p>
		{/if}

		{#if data.relatedAreaLinks.length > 0}
			<section class="location-page__list" aria-labelledby="related-areas-heading">
				<h2 id="related-areas-heading">Related areas</h2>
				<ul>
					{#each data.relatedAreaLinks as entry (entry.location?._id)}
						{@const slug = entry.location?.slug}
						{@const name = entry.location?.breadcrumbLabel ?? entry.location?.name}
						{#if slug && name}
							<li>
								<a href={relatedAreaHref(slug)}>{name}</a>
							</li>
						{/if}
					{/each}
				</ul>
			</section>
		{/if}

		<FrontlineListings
			cards={data.frontlineCards}
			heading={`Frontline golf in ${data.location.name}`}
			viewAllHref={data.frontlineViewAllHref}
		/>
	</div>

	<div id="properties" class="location-page__results">
		<ListingResults
			basePath={data.canonicalPath}
			searchParams={data.searchParams}
			cards={data.listingResults.cards}
			total={data.listingResults.total}
			pagination={data.listingResults.pagination}
			heading={`All properties in ${data.location.name}`}
			{communityOptions}
		/>
	</div>

	{#if data.directCommunities.length > 0 || data.associatedCommunities.length > 0}
		<div class="location-page__after content-wrap">
			{#if data.directCommunities.length > 0}
				<section class="location-page__list" aria-labelledby="communities-heading">
					<h2 id="communities-heading">Communities</h2>
					<ul>
						{#each data.directCommunities as community (community._id)}
							{#if community.slug && community.name}
								<li>
									<a href={communityFilterHref(community.slug)}>{community.name}</a>
								</li>
							{/if}
						{/each}
					</ul>
				</section>
			{/if}

			{#if data.associatedCommunities.length > 0}
				<section class="location-page__list" aria-labelledby="associated-communities-heading">
					<h2 id="associated-communities-heading">Also in this area</h2>
					<ul>
						{#each data.associatedCommunities as community (community._id)}
							{#if community.slug && community.name}
								<li>
									<a href={communityFilterHref(community.slug)}>{community.name}</a>
								</li>
							{/if}
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	{/if}
</article>

<style>
	.location-page {
		padding-bottom: var(--space-2xl);
	}

	.location-page__top {
		padding-top: var(--space-xl);
	}

	/* The hero already carries generous breathing room above the rail/links;
	   don't stack another --space-xl on top of it. */
	.location-page--has-hero .location-page__top:empty {
		display: none;
	}

	/* Offset the smooth-scroll target so the listings heading clears the sticky nav. */
	.location-page__results {
		scroll-margin-top: calc(var(--nav-height) + var(--space-md));
	}

	.location-page__intro {
		margin-top: var(--space-md);
		max-width: 42rem;
	}

	.location-page__after {
		margin-top: var(--section-gap);
	}

	.location-page__list + .location-page__list {
		margin-top: var(--space-xl);
	}

	.location-page__list h2 {
		margin-bottom: var(--space-sm);
	}

	.location-page__list ul {
		list-style: none;
		display: grid;
		gap: var(--space-xs);
	}

	.location-page__list a {
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
</style>
