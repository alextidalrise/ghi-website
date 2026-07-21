<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import ListingResults from '$lib/components/listing/ListingResults.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	// Wrap a phrase in *asterisks* to render it italic — same convention the
	// homepage and location heroes use, rendered without dangerouslySetHTML.
	const headlineParts = $derived(
		data.hero.headline.split('*').map((text, index) => ({ text, italic: index % 2 === 1 }))
	);
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={data.seo.canonicalUrl} />
	{#if data.seo.noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.seo.canonicalUrl} />
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />

	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<article class="frontline-page">
	<PageHero
		image={data.hero.image?.url ?? ''}
		srcset={data.hero.image?.srcset || undefined}
		lqip={data.hero.image?.lqip}
		alt={data.hero.image?.alt ?? ''}
		lead={data.hero.lead}
		breadcrumbs={data.breadcrumbs}
		ctaHref="#properties"
		ctaLabel={data.content.ctaLabel}
		compact
		fetchpriority="high"
	>
		{#snippet title()}
			{#each headlineParts as part, i (i)}{#if part.italic}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
		{/snippet}
	</PageHero>

	<div id="properties" class="frontline-page__results">
		<ListingResults
			basePath={data.basePath}
			searchParams={data.searchParams}
			cards={data.listingResults.cards}
			total={data.listingResults.total}
			pagination={data.listingResults.pagination}
			heading={data.content.resultsHeading}
			courseOptions={data.courseOptions}
			showGolfRelevance={false}
		/>
	</div>
</article>

<style>
	.frontline-page {
		padding-bottom: var(--space-2xl);
	}

	/* Offset the smooth-scroll target so the heading clears the sticky nav. */
	.frontline-page__results {
		scroll-margin-top: calc(var(--nav-height) + var(--space-md));
	}
</style>
