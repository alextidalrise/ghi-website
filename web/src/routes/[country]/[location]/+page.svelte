<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import ListingResults from '$lib/components/listing/ListingResults.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const placeholderBody = $derived(
		`Property listings and editorial content for ${data.location.name} coming soon.`
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

	function communityHref(community: {
		slug?: string | null;
		canonicalLocationSlug?: string | null;
	}) {
		if (!community.slug || !community.canonicalLocationSlug || !data.country.slug) {
			return null;
		}
		return `/${data.country.slug}/${community.canonicalLocationSlug}/${community.slug}`;
	}
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

<article class="location-page">
	<Breadcrumbs items={data.breadcrumbs} />

	<div class="location-page__top content-wrap">
		<h1>{data.location.name}</h1>
		<p class="location-page__intro">
			{data.location.publicDescription ?? placeholderBody}
		</p>

		<FrontlineListings
			cards={data.frontlineCards}
			heading={`Frontline golf in ${data.location.name}`}
			viewAllHref={data.frontlineViewAllHref}
		/>
	</div>

	<ListingResults
		basePath={data.canonicalPath}
		searchParams={data.searchParams}
		cards={data.listingResults.cards}
		total={data.listingResults.total}
		pagination={data.listingResults.pagination}
		heading={`All properties in ${data.location.name}`}
		{communityOptions}
	/>

	{#if data.directCommunities.length > 0 || data.associatedCommunities.length > 0}
		<div class="location-page__after content-wrap">
			{#if data.directCommunities.length > 0}
				<section class="location-page__list" aria-labelledby="communities-heading">
					<h2 id="communities-heading">Communities</h2>
					<ul>
						{#each data.directCommunities as community (community._id)}
							{@const href = communityHref(community)}
							<li>
								{#if href}
									<a {href}>{community.name}</a>
								{:else}
									{community.name}
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if data.associatedCommunities.length > 0}
				<section class="location-page__list" aria-labelledby="associated-communities-heading">
					<h2 id="associated-communities-heading">Also in this area</h2>
					<ul>
						{#each data.associatedCommunities as community (community._id)}
							{@const href = communityHref(community)}
							<li>
								{#if href}
									<a {href}>{community.name}</a>
								{:else}
									{community.name}
								{/if}
							</li>
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
