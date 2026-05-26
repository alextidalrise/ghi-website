<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const placeholderBody = $derived(
		`Property listings and editorial content for ${data.location.name} coming soon.`
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

<article class="location-stub">
	<Breadcrumbs items={data.breadcrumbs} />

	<div class="location-stub__body content-wrap">
		<h1>{data.location.name}</h1>
		<p class="location-stub__intro">
			{data.location.publicDescription ?? placeholderBody}
		</p>

		{#if data.directCommunities.length > 0}
			<section class="location-stub__list" aria-labelledby="communities-heading">
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
			<section class="location-stub__list" aria-labelledby="associated-communities-heading">
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
