<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import ListingResults from '$lib/components/listing/ListingResults.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const courseHero = $derived(data.courseHero);
	const heroLead = $derived(data.course.tagline ?? data.course.shortDescription ?? undefined);
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

{#if courseHero}
	<PageHero
		image={courseHero.url}
		srcset={courseHero.srcset}
		lqip={courseHero.lqip}
		alt={courseHero.alt}
		breadcrumbs={data.breadcrumbs}
		lead={heroLead}
		ctaHref="#properties"
		ctaLabel="Browse properties"
		compact
		fetchpriority="high"
	>
		{#snippet title()}
			{data.course.name}
		{/snippet}
	</PageHero>
{/if}

<article class="golf-course-page" class:golf-course-page--has-hero={courseHero}>
	{#if data.course.shortDescription || data.course.holes != null || data.course.par != null || data.course.designStyle || data.course.websiteUrl}
		<section class="golf-course-page__about content-wrap" aria-labelledby="about-heading">
			<h2 id="about-heading">About the course</h2>

			{#if data.course.shortDescription}
				<p class="golf-course-page__intro">{data.course.shortDescription}</p>
			{/if}

			{#if data.course.holes != null || data.course.par != null || data.course.designStyle || data.course.websiteUrl}
				<ul class="golf-course-page__facts">
					{#if data.course.holes != null}
						<li>{data.course.holes} holes</li>
					{/if}
					{#if data.course.par != null}
						<li>Par {data.course.par}</li>
					{/if}
					{#if data.course.designStyle}
						<li>{data.course.designStyle}</li>
					{/if}
					{#if data.course.websiteUrl}
						<li>
							<a href={data.course.websiteUrl} rel="noopener noreferrer" target="_blank">
								Official website
							</a>
						</li>
					{/if}
				</ul>
			{/if}
		</section>
	{/if}

	<div id="properties" class="golf-course-page__results">
		<ListingResults
			basePath={data.canonicalPath}
			searchParams={data.searchParams}
			cards={data.listingResults.cards}
			total={data.listingResults.total}
			pagination={data.listingResults.pagination}
			heading={`Properties at ${data.course.name}`}
		/>
	</div>
</article>

<style>
	.golf-course-page {
		padding-bottom: var(--space-2xl);
	}

	.golf-course-page__about {
		padding-top: var(--space-xl);
	}

	.golf-course-page--has-hero .golf-course-page__about {
		padding-top: var(--space-lg);
	}

	.golf-course-page__intro {
		margin-top: var(--space-md);
		max-width: 42rem;
	}

	.golf-course-page__facts {
		list-style: none;
		margin-top: var(--space-md);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.golf-course-page__facts li {
		font-size: var(--text-small);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--border);
		background: var(--white);
		color: var(--green);
	}

	.golf-course-page__facts a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.golf-course-page__results {
		scroll-margin-top: calc(var(--nav-height) + var(--space-md));
	}
</style>
