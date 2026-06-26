<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import GuideTextHero from '$lib/components/guides/GuideTextHero.svelte';
	import GuideContents from '$lib/components/guides/GuideContents.svelte';
	import GuideBody from '$lib/components/guides/GuideBody.svelte';
	import GuideCardLink from '$lib/components/guides/GuideCardLink.svelte';
	import { GUIDE_CATEGORY_META, isGuideCategory } from '$lib/guides';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const guide = $derived(data.guide);
	const hero = $derived(data.guideHero);
	const toc = $derived(data.toc);
	const hasToc = $derived(toc.length >= 2);

	const sections = $derived(guide.sections ?? []);
	const related = $derived(guide.relatedGuides ?? []);

	const categoryLabel = $derived(
		isGuideCategory(guide.guideCategory) ? GUIDE_CATEGORY_META[guide.guideCategory].label : 'Guides'
	);
	const relatedHeading = $derived(`More ${categoryLabel.toLowerCase()}`);

	const introParagraphs = $derived(
		(guide.intro ?? '')
			.split(/\n\s*\n/)
			.map((para) => para.trim())
			.filter(Boolean)
	);

	const advisorHeading = $derived(guide.advisorHeading?.trim() || 'Speak to an advisor');
	const advisorBody = $derived(
		guide.advisorBody?.trim() ||
			'We guide buyers through every step of a purchase in Spain and Portugal, from the first viewing to the keys. Tell us what you have in mind and we will be in touch.'
	);

	const MONTHS = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	// Deterministic month-year formatting (no Date timezone drift between SSR and hydration).
	const reviewedLabel = $derived.by(() => {
		const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(guide.lastReviewed ?? '');
		if (!match) return undefined;
		const monthIndex = Number.parseInt(match[2], 10) - 1;
		if (monthIndex < 0 || monthIndex > 11) return undefined;
		return `Reviewed ${MONTHS[monthIndex]} ${match[1]}`;
	});

	const hasMeta = $derived(Boolean(guide.audienceLabel || reviewedLabel));
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	{#if data.seo.description}
		<meta name="description" content={data.seo.description} />
	{/if}
	<link rel="canonical" href={data.seo.canonicalUrl} />
	{#if data.seo.noindex}
		<meta name="robots" content="noindex" />
	{/if}

	<meta property="og:type" content="article" />
	<meta property="og:url" content={data.seo.canonicalUrl} />
	<meta property="og:title" content={data.seo.openGraphTitle} />
	{#if data.seo.openGraphDescription}
		<meta property="og:description" content={data.seo.openGraphDescription} />
	{/if}
	{#if data.seo.openGraphImageUrl}
		<meta property="og:image" content={data.seo.openGraphImageUrl} />
	{/if}

	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
	{@html jsonLdScriptHtml(data.articleJsonLd)}
</svelte:head>

{#if hero}
	<PageHero
		image={hero.url}
		srcset={hero.srcset}
		lqip={hero.lqip}
		alt={hero.alt}
		lead={guide.tagline ?? undefined}
		breadcrumbs={data.breadcrumbs.slice(0, -1)}
		compact
		fetchpriority="high"
	>
		{#snippet title()}
			{guide.title}
		{/snippet}
	</PageHero>
{:else}
	<GuideTextHero
		title={guide.title ?? 'Guide'}
		lead={guide.tagline ?? undefined}
		breadcrumbs={data.breadcrumbs}
		hideCurrentCrumb
	/>
{/if}

<article class="guide">
	{#if hasMeta || introParagraphs.length > 0}
		<header class="guide__intro content-wrap">
			{#if hasMeta}
				<div class="guide__meta">
					{#if guide.audienceLabel}
						<span class="guide__chip">{guide.audienceLabel}</span>
					{/if}
					{#if reviewedLabel}
						<span class="guide__reviewed">{reviewedLabel}</span>
					{/if}
				</div>
			{/if}
			{#each introParagraphs as para (para)}
				<p class="guide__lead">{para}</p>
			{/each}
		</header>
	{/if}

	<div class="guide__body content-wrap" class:guide__body--with-toc={hasToc}>
		{#if hasToc}
			<aside class="guide__rail">
				<GuideContents items={toc} />
			</aside>
		{/if}

		<div class="guide__sections">
			{#each sections as section, index (section.anchor ?? index)}
				<section
					class="guide-section"
					id={section.anchor ?? undefined}
					aria-labelledby={section.anchor ? `${section.anchor}-heading` : undefined}
				>
					{#if section.heading}
						<h2 class="guide-section__heading" id={section.anchor ? `${section.anchor}-heading` : undefined}>
							{section.heading}
						</h2>
					{/if}
					<GuideBody value={section.body} />
				</section>
			{/each}
		</div>
	</div>

	<aside class="guide__advisor" aria-label="Contact an advisor">
		<div class="guide__advisor-inner">
			<h2 class="guide__advisor-heading">{advisorHeading}</h2>
			<p class="guide__advisor-body">{advisorBody}</p>
			<a class="guide__advisor-cta" href="/contact">Speak to an advisor</a>
		</div>
	</aside>

	{#if related.length > 0}
		<section class="guide__related content-wrap" aria-labelledby="guide-related-heading">
			<h2 class="guide__related-heading" id="guide-related-heading">{relatedHeading}</h2>
			<ul class="guide__related-list">
				{#each related as card (card._id)}
					<li class="guide__related-item">
						<GuideCardLink {card} />
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</article>

<style>
	.guide__intro {
		padding-block: var(--space-2xl) 0;
		max-width: 44rem;
		margin-inline: auto;
	}

	.guide__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.guide__chip {
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
	}

	.guide__reviewed {
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	.guide__lead {
		font-family: var(--sans);
		font-size: clamp(1.125rem, 0.9rem + 0.7vw, 1.3rem);
		font-weight: 300;
		line-height: 1.55;
		color: var(--green);
		text-wrap: pretty;
	}

	.guide__lead + .guide__lead {
		margin-top: var(--space-md);
	}

	.guide__body {
		padding-block: var(--space-2xl);
	}

	/* Single-column default (also the fallback for guides with too few chapters
	   to warrant a contents rail). */
	.guide__sections {
		max-width: 44rem;
		margin-inline: auto;
	}

	.guide-section {
		scroll-margin-top: calc(var(--nav-height) + var(--space-lg));
	}

	.guide-section + .guide-section {
		margin-top: clamp(2.5rem, 5vw, 4rem);
		padding-top: clamp(2.5rem, 5vw, 4rem);
		border-top: 1px solid var(--border);
	}

	.guide-section__heading {
		margin-bottom: var(--space-md);
	}

	@media (min-width: 56rem) {
		.guide__body--with-toc {
			display: grid;
			grid-template-columns: 13rem minmax(0, 1fr);
			gap: clamp(2rem, 5vw, 4rem);
			align-items: start;
		}

		.guide__body--with-toc .guide__rail {
			position: sticky;
			top: calc(var(--nav-height) + var(--space-lg));
			align-self: start;
		}

		/* In the two-column layout the column itself is the measure. */
		.guide__body--with-toc .guide__sections {
			max-width: none;
			margin-inline: 0;
		}
	}

	/* Mobile: the contents rail stacks above the chapters as a collapsible jump list. */
	@media (max-width: 56rem) {
		.guide__rail {
			margin-bottom: var(--space-xl);
		}
	}

	/* Advisor band: a calm framed invitation on white, not a second green band.
	   The green lives in the button. */
	.guide__advisor {
		padding-block: var(--space-xl);
		padding-inline: var(--content-padding);
	}

	.guide__advisor-inner {
		max-width: 44rem;
		margin-inline: auto;
		padding: clamp(2rem, 5vw, 3rem);
		border: 1px solid var(--border);
		border-top: 2px solid var(--gold);
		text-align: center;
	}

	.guide__advisor-heading {
		font-size: var(--text-h3);
	}

	.guide__advisor-body {
		margin-top: var(--space-md);
		margin-inline: auto;
		max-width: 52ch;
		font-family: var(--sans);
		font-size: var(--text-body);
		color: var(--charcoal);
		line-height: 1.7;
	}

	.guide__advisor-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: var(--space-lg);
		padding: 0.9rem 2rem;
		background: var(--green);
		color: var(--white);
		border: 1px solid var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.guide__advisor-cta:hover,
	.guide__advisor-cta:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	.guide__related {
		padding-block: var(--space-xl) var(--space-2xl);
	}

	.guide__related-heading {
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border);
	}

	.guide__related-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.guide__related-item + .guide__related-item {
		border-top: 1px solid var(--border);
	}

	@media (prefers-reduced-motion: reduce) {
		.guide__advisor-cta {
			transition: none;
		}
	}
</style>
