<script lang="ts">
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';
	import { insightsIndexHref } from '$lib/insights';
	import { insightCategoryLabel } from '$lib/insights/categories';
	import InsightsHero from '$lib/components/insights/InsightsHero.svelte';
	import InsightFilters from '$lib/components/insights/InsightFilters.svelte';
	import InsightFeatured from '$lib/components/insights/InsightFeatured.svelte';
	import InsightCard from '$lib/components/insights/InsightCard.svelte';

	let { data } = $props();

	const hasInsights = $derived(data.totalAll > 0);
	const isFilteredEmpty = $derived(data.activeCategory !== null && data.filteredTotal === 0);
	// A short feed can be entirely consumed by the featured lead, leaving no grid to head.
	const hasGrid = $derived(data.cards.length > 0);
	const gridLabel = $derived(
		data.activeCategory ? insightCategoryLabel(data.activeCategory) : 'More insights'
	);

	const pageTitle = 'Insights | Golf Homes International';
	const metaDescription =
		'Perspective on golf-property markets, lifestyle and relocation across Spain and Portugal — the thinking behind a considered purchase, from Golf Homes International.';
	const ogTitle = 'Insights | Golf Homes International';
	const ogDescription = metaDescription;
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={data.canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.canonicalUrl} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<InsightsHero
	title="Insights"
	lead="Perspective on the markets, the lifestyle and the practicalities of owning a home by the finest golf in Spain and Portugal."
	breadcrumbs={data.breadcrumbs}
/>

{#if hasInsights}
	<div class="insights">
		<div class="content-wrap">
			<InsightFilters filters={data.filters} active={data.activeCategory} />
		</div>

		<div class="insights__body content-wrap">
			{#if data.featured}
				<InsightFeatured card={data.featured} />
			{/if}

			{#if isFilteredEmpty}
				<section class="insights__empty" aria-live="polite">
					<p class="insights__empty-text">
						No {insightCategoryLabel(data.activeCategory)} insights just yet.
					</p>
					<a class="insights__empty-link" href={insightsIndexHref()}>
						Browse all insights<span aria-hidden="true">→</span>
					</a>
				</section>
			{:else if hasGrid}
				<section aria-label={gridLabel}>
					<h2 class="insights__grid-heading">{gridLabel}</h2>
					<ul class="insights__grid">
						{#each data.cards as card (card._id)}
							<li class="insights__grid-item">
								<InsightCard {card} />
							</li>
						{/each}
					</ul>

					{#if data.hasMore}
						<div class="insights__more">
							<a
								class="insights__more-link"
								href={insightsIndexHref({ category: data.activeCategory, limit: data.nextLimit })}
								data-sveltekit-noscroll
							>
								Load more
							</a>
						</div>
					{/if}
				</section>
			{/if}
		</div>
	</div>
{:else}
	<div class="insights">
		<section class="insights__empty insights__empty--page content-wrap">
			<p class="insights__empty-text">The first insights are being written. Check back shortly.</p>
		</section>
	</div>
{/if}

<style>
	.insights {
		padding-bottom: var(--space-2xl);
	}

	.insights__body {
		padding-top: var(--space-2xl);
	}

	.insights__grid-heading {
		font-size: var(--text-h3);
		margin-bottom: var(--space-lg);
	}

	.insights__grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
		gap: clamp(1.5rem, 1rem + 2vw, 2.5rem);
	}

	.insights__grid-item {
		min-width: 0;
	}

	.insights__more {
		display: flex;
		justify-content: center;
		margin-top: var(--space-2xl);
	}

	/* Outline button — transparent, hairline, fills green on hover (DESIGN button spec). */
	.insights__more-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.875rem 2.25rem;
		border: 1px solid var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		text-decoration: none;
		transition:
			background-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.insights__more-link:hover,
	.insights__more-link:focus-visible {
		background: var(--green);
		color: var(--on-green);
	}

	.insights__empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-md);
		padding-block: var(--space-xl);
	}

	.insights__empty--page {
		padding-block: var(--space-2xl);
	}

	.insights__empty-text {
		font-family: var(--sans);
		font-size: 1.125rem;
		font-weight: 300;
		color: var(--muted);
	}

	.insights__empty-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.insights__empty-link:hover,
	.insights__empty-link:focus-visible {
		color: var(--gold);
	}

	@media (prefers-reduced-motion: reduce) {
		.insights__more-link,
		.insights__empty-link {
			transition: none;
		}
	}
</style>
