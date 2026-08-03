<script lang="ts">
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';
	import GuideContents from '$lib/components/guides/GuideContents.svelte';
	import InsightArticleHero from '$lib/components/insights/InsightArticleHero.svelte';
	import InsightBody from '$lib/components/insights/InsightBody.svelte';
	import InsightAuthorBio from '$lib/components/insights/InsightAuthorBio.svelte';
	import TalkToUsBand from '$lib/components/TalkToUsBand.svelte';
	import InsightCard from '$lib/components/insights/InsightCard.svelte';
	import { withoutCampaignParams } from '$lib/sanity/href';
	import type { InsightCtaAction } from '$lib/insights';

	let { data } = $props();

	// An authored CTA override renders only when it carries BOTH a label and a link — the
	// schema enforces all-or-nothing, this is the render-time guard. Campaign params are
	// stripped for the same reason InsightRoutes strips them: an authored href can arrive
	// utm-tagged, and that must not reach a visitor (it corrupts our own analytics). When the
	// override is absent, `undefined` lets TalkToUsBand fall back to its house defaults.
	const toBandAction = (action?: InsightCtaAction | null) => {
		const label = action?.label?.trim();
		const href = action?.href?.trim();
		if (!label || !href) return undefined;
		return { label, href: withoutCampaignParams(href) };
	};

	const insight = $derived(data.insight);
	const toc = $derived(data.toc);
	const hasToc = $derived(toc.length >= 2);
	const sections = $derived(insight.sections ?? []);
	const related = $derived(insight.related ?? []);

	const ctaHeading = $derived(insight.ctaHeading?.trim() || 'Considering a golf home in Spain or Portugal?');
	const ctaBody = $derived(
		insight.ctaBody?.trim() ||
			"Tell us what you have in mind and we'll help you compare the right villas, apartments and resort homes — no pressure, just guidance from people who know the market."
	);
	const ctaPrimary = $derived(toBandAction(insight.ctaPrimary));
	const ctaSecondary = $derived(toBandAction(insight.ctaSecondary));
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
	{#if data.faqJsonLd}
		{@html jsonLdScriptHtml(data.faqJsonLd)}
	{/if}
</svelte:head>

<InsightArticleHero {insight} breadcrumbs={data.breadcrumbs} />

<article class="article">
	<div class="article__body content-wrap" class:article__body--with-toc={hasToc}>
		{#if hasToc}
			<aside class="article__rail">
				<GuideContents items={toc} title="In this article" />
			</aside>
		{/if}

		<div class="article__sections">
			{#each sections as section, index (section.anchor ?? index)}
				<section
					class="article-section"
					id={section.anchor ?? undefined}
					aria-labelledby={section.anchor ? `${section.anchor}-heading` : undefined}
				>
					{#if section.heading}
						<h2 class="article-section__heading" id={section.anchor ? `${section.anchor}-heading` : undefined}>
							{section.heading}
						</h2>
					{/if}
					<InsightBody value={section.body} />
				</section>
			{/each}
		</div>
	</div>

	{#if insight.author}
		<InsightAuthorBio author={insight.author} />
	{/if}
</article>

<!--
  The page's single green band (Emphasis Ladder tier 4), placed directly after the article
  body/FAQ so the primary enquiry action is the first thing the reader meets at the foot of the
  piece — lead generation before the "keep reading" rail, not after it. Related reading follows,
  then the global footer.

  It still carries its own gold hairline top and bottom, so it reads as a distinct object even
  though white (the related rail) now follows rather than the footer's green. One green band per
  page, unchanged.

  The heading, body and both actions are the article's own (Sanity `ctaHeading` / `ctaBody` /
  `ctaPrimary` / `ctaSecondary`), so an editor can pitch the close to the piece rather than
  repeating the About page verbatim. When an action override is absent it is `undefined`, and
  TalkToUsBand falls back to its house defaults (Get in touch / Browse properties) — so a piece
  that argues its own route (e.g. "Register for Nobu updates") can close on that route instead
  of defaulting every reader into a property search.
-->
<TalkToUsBand heading={ctaHeading} body={ctaBody} primary={ctaPrimary} secondary={ctaSecondary} />

{#if related.length > 0}
	<section class="article__related content-wrap" aria-labelledby="insight-related-heading">
		<h2 class="article__related-heading" id="insight-related-heading">Related reading</h2>
		<ul class="article__related-list">
			{#each related as card (card._id)}
				<li class="article__related-item">
					<InsightCard {card} />
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.article__body {
		padding-block: var(--space-2xl) var(--space-xl);
	}

	/* Single-column default (also the fallback when a piece has too few sections
	   to warrant a contents rail). */
	.article__sections {
		max-width: 44rem;
		margin-inline: auto;
	}

	.article-section {
		scroll-margin-top: calc(var(--nav-height) + var(--space-lg));
	}

	/*
	 * No rule between sections. An identical hairline at an identical interval, nine times
	 * over, is a metronome: it makes the repetition audible and turns an article into a list
	 * of items. The Playfair h2 already announces a section — pairing it with a rule is
	 * saying the same thing twice, and the rule was landing directly under framed blocks
	 * (figures, takeaways, callouts) as a second, doubled line.
	 *
	 * Separation is whitespace and type instead, and the punctuation is the content itself:
	 * the figures, the card grid, the pull quote. Deliberately more space than the old rule
	 * carried — without a line to lean on, the gap has to do the work on its own.
	 */
	.article-section + .article-section {
		margin-top: clamp(3.5rem, 7vw, 5.5rem);
	}

	/* Tighter to the prose it heads than to the section it follows: the heading should bind
	   downward, so the eye groups it with its own text rather than floating between two. */
	.article-section__heading {
		margin-bottom: var(--space-md);
	}

	@media (min-width: 56rem) {
		.article__body--with-toc {
			display: grid;
			grid-template-columns: 13rem minmax(0, 1fr);
			gap: clamp(2rem, 5vw, 4rem);
			align-items: start;
		}

		.article__body--with-toc .article__rail {
			position: sticky;
			top: calc(var(--nav-height) + var(--space-lg));
			align-self: start;
		}

		/* In the two-column layout the column itself is the measure. */
		.article__body--with-toc .article__sections {
			max-width: none;
			margin-inline: 0;
		}
	}

	@media (max-width: 56rem) {
		/* The rail sticks under the nav and collapses to a one-row bar (see GuideContents), so
		   the reader keeps a live "you are here" and a jump control the whole way down — the
		   orientation the desktop sticky rail gives, which a scrolled-past mobile block loses. */
		.article__rail {
			position: sticky;
			top: var(--nav-height);
			z-index: 5;
			margin-bottom: var(--space-xl);
		}

		/* A tapped jump must clear the sticky bar (~3rem tall, pinned at the nav), or the target
		   heading lands hidden behind it. */
		.article-section {
			scroll-margin-top: calc(var(--nav-height) + 3rem + var(--space-sm));
		}
	}

	/* Now the last white section before the green footer (the enquiry band moved above it). The
	   green footer is a coloured surface, so the rail needs real bottom clearance of its own or the
	   cards butt against the footer's top edge; a generous close also lets the enquiry band above
	   breathe. The band brings its own `--section-gap` top margin, so the top stays at `--space-2xl`. */
	.article__related {
		padding-block: var(--space-2xl) var(--section-gap);
	}

	.article__related-heading {
		font-size: var(--text-h3);
		padding-bottom: var(--space-sm);
		margin-bottom: var(--space-lg);
		border-bottom: 1px solid var(--border);
	}

	.article__related-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
		gap: clamp(1.5rem, 1rem + 2vw, 2.5rem);
	}

	.article__related-item {
		min-width: 0;
	}
</style>
