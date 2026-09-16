<script lang="ts">
	import GuideTextHero from '$lib/components/guides/GuideTextHero.svelte';
	import GuideCardLink from '$lib/components/guides/GuideCardLink.svelte';
	import GuideMarketGroup from '$lib/components/guides/GuideMarketGroup.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const general = $derived(data.groups.general);
	const markets = $derived(data.groups.markets);
	// The hub has content whenever a guide exists anywhere. A market with none of its own
	// still renders its row, saying so — that is the point, not an empty state.
	const hasGuides = $derived(general.length > 0 || markets.some((group) => !group.isEmpty));

	const c = $derived(data.content);

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
	{#if c.seo?.noindex}
		<meta name="robots" content="noindex" />
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
/>

<div class="guides-hub">
	{#if hasGuides}
		{#if general.length > 0}
			<!-- Guides that belong to no single market lead the page: they are what to read
			     before choosing a country, so they sit above the market index. -->
			<section class="guides-hub__group content-wrap" aria-labelledby="guides-general">
				<div class="guides-hub__group-head">
					<h2 class="guides-hub__group-heading" id="guides-general">{c.sectionHeading}</h2>
				</div>
				<ul class="guides-hub__list">
					{#each general as card (card._id)}
						<li class="guides-hub__item">
							<GuideCardLink {card} />
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<div class="guides-hub__markets content-wrap">
			{#each markets as group (group.market.slug)}
				<GuideMarketGroup {group} />
			{/each}
		</div>
	{:else}
		<section class="guides-hub__empty content-wrap">
			<p>{c.emptyStateMessage}</p>
		</section>
	{/if}
</div>

<style>
	.guides-hub {
		padding-block: var(--space-2xl);
	}

	/* The market index. Generous separation between countries, because each block is a
	   destination in its own right rather than a row in a list. */
	.guides-hub__markets {
		display: grid;
		gap: var(--section-gap);
	}

	.guides-hub__group + .guides-hub__markets {
		margin-top: var(--section-gap);
	}

	.guides-hub__group-head {
		max-width: 44rem;
		margin-bottom: var(--space-md);
	}

	.guides-hub__list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--border);
	}

	.guides-hub__item {
		border-bottom: 1px solid var(--border);
	}

	.guides-hub__empty {
		padding-block: var(--space-xl);
		font-family: var(--sans);
		color: var(--muted);
	}
</style>
