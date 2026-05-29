<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import FeaturedListings from '$lib/components/listing/FeaturedListings.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

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

	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.seo.canonicalUrl} />
	<meta property="og:title" content={data.seo.openGraphTitle ?? data.seo.title} />
	{#if data.seo.openGraphDescription}
		<meta property="og:description" content={data.seo.openGraphDescription} />
	{/if}

	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<article class="location-stub">
	<Breadcrumbs items={data.breadcrumbs} />

	<div class="location-stub__body content-wrap">
		<h1>{data.location.name}</h1>
		<p class="location-stub__intro">
			{data.location.publicDescription ?? placeholderBody}
		</p>

		<FeaturedListings
			cards={data.featuredCards}
			heading={`Featured properties in ${data.location.name}`}
		/>

		<FrontlineListings
			cards={data.frontlineCards}
			heading={`Frontline golf in ${data.location.name}`}
			viewAllHref={data.frontlineViewAllHref}
		/>

		{#if data.locations.length > 0}
			<section class="location-stub__list" aria-labelledby="locations-heading">
				<h2 id="locations-heading">Locations</h2>
				<ul>
					{#each data.locations as location (location._id)}
						<li>
							{#if location.slug}
								<a href="/{data.location.slug}/{location.slug}">{location.name}</a>
							{:else}
								{location.name}
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</article>

<style>
	.location-stub__body {
		padding-block: var(--space-xl) var(--space-2xl);
	}

	.location-stub__intro {
		margin-top: var(--space-md);
		max-width: 42rem;
	}

	.location-stub__list {
		margin-top: var(--space-xl);
	}

	.location-stub__list h2 {
		margin-bottom: var(--space-sm);
	}

	.location-stub__list ul {
		list-style: none;
		display: grid;
		gap: var(--space-xs);
	}

	.location-stub__list a {
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
</style>
