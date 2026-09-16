<script lang="ts">
	import GuideTextHero from '$lib/components/guides/GuideTextHero.svelte';
	import GuideFinder from '$lib/components/guides/GuideFinder.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const c = $derived(data.content);
	const hasGuides = $derived(data.index.length > 0);

	const pageTitle = $derived(c.seo?.seoTitle?.trim() || 'Guides | Golf Homes International');
	const metaDescription = $derived(
		c.seo?.metaDescription?.trim() ||
			'Detailed, current guidance on buying property near the finest golf, market by market: the legal process, the costs, and the decisions that matter.'
	);
	const ogTitle = $derived(c.seo?.openGraphTitle?.trim() || 'Guides');
	const ogDescription = $derived(c.seo?.openGraphDescription?.trim() || metaDescription);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={data.canonicalUrl} />
	{#if c.seo?.noindex || data.noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.canonicalUrl} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<GuideTextHero
	title={c.heroTitle}
	lead={c.heroLead}
	breadcrumbs={data.breadcrumbs}
	compact
/>

{#if hasGuides}
	<GuideFinder finder={data.finder} />

	<!-- Every guide, as a plain index. The consultation above is the way in; this is for the
	     reader who would rather scan, and it keeps every guide one link from the hub. -->
	<nav class="guides-index content-wrap" aria-labelledby="guides-index-heading">
		<h2 class="guides-index__heading" id="guides-index-heading">All guides</h2>
		<ul class="guides-index__list">
			{#each data.index as item (item.href)}
				<li><a class="guides-index__link" href={item.href}>{item.title}</a></li>
			{/each}
		</ul>
	</nav>
{:else}
	<section class="guides-empty content-wrap">
		<p>{c.emptyStateMessage}</p>
	</section>
{/if}

<style>
	.guides-index {
		padding-bottom: var(--space-2xl);
	}

	/* The rule sits on the heading, inside the content column: on the padded wrapper it
	   would run past the column's edges. */
	.guides-index__heading {
		margin: 0 0 var(--space-sm);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border);
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h4);
		color: var(--green);
	}

	.guides-index__list {
		display: grid;
		column-gap: var(--space-xl);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 40rem) {
		.guides-index__list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* Underlined at rest, by owner decision: in a plain list of titles an underline is the
	   only thing that says "link". (The site's default text link underlines on hover only.)
	   A quiet stone underline at rest, gold and green ink on hover/focus. */
	.guides-index__link {
		display: inline-block;
		padding-block: 0.6rem;
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-ui);
		color: var(--green);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-decoration-color: color-mix(in oklch, var(--green) 35%, transparent);
		text-underline-offset: 0.3em;
		transition:
			color var(--duration-hover) var(--ease),
			text-decoration-color var(--duration-hover) var(--ease);
	}

	.guides-index__link:hover,
	.guides-index__link:focus-visible {
		text-decoration-color: var(--gold);
	}

	.guides-index__link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.guides-empty {
		padding-block: var(--space-2xl);
		font-family: var(--sans);
		color: var(--muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.guides-index__link {
			transition: none;
		}
	}
</style>
