<script lang="ts">
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';
	import GuideContents from '$lib/components/guides/GuideContents.svelte';
	import InsightArticleHero from '$lib/components/insights/InsightArticleHero.svelte';
	import InsightBody from '$lib/components/insights/InsightBody.svelte';
	import InsightKicker from '$lib/components/insights/InsightKicker.svelte';
	import InsightAuthorBio from '$lib/components/insights/InsightAuthorBio.svelte';
	import TalkToUsBand from '$lib/components/TalkToUsBand.svelte';
	import InsightCard from '$lib/components/insights/InsightCard.svelte';
	import { withoutCampaignParams } from '$lib/sanity/href';
	import { sectionHasBackToContents, type InsightCtaAction } from '$lib/insights';

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
	// `ctaShowSecondary === false` suppresses the alternative button entirely (null), which is
	// distinct from an absent override (undefined) — the latter still shows TalkToUsBand's default.
	const ctaSecondary = $derived(
		insight.ctaShowSecondary === false ? null : toBandAction(insight.ctaSecondary)
	);
	const ctaWhatsAppLabel = $derived(insight.ctaWhatsAppLabel?.trim() || undefined);
	const ctaWhatsAppMessage = $derived(insight.ctaWhatsAppMessage?.trim() || undefined);
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
	<!-- The back-to-contents links target the article body top, NOT the rail: the rail is sticky and
	     stays pinned in the viewport, so an anchor jump to it resolves to its already-visible pinned
	     position and the page does not move. The body's own (non-sticky) top is a stable destination
	     at the article's opening, where the contents rail begins. -->
	<div
		class="article__body content-wrap"
		class:article__body--with-toc={hasToc}
		id={hasToc ? 'insight-contents' : undefined}
	>
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
						{#if section.headingStyle === 'eyebrow'}
							<!-- Eyebrow style: the section title is demoted to a small ◆ label (the sub-heads in
							     the body carry the visible structure). Still an <h2> with the anchor id, so the
							     document outline and the contents rail are unchanged. -->
							<h2
								class="article-section__heading article-section__heading--eyebrow"
								id={section.anchor ? `${section.anchor}-heading` : undefined}
							>
								<InsightKicker label={section.heading} />
							</h2>
						{:else}
							<h2 class="article-section__heading" id={section.anchor ? `${section.anchor}-heading` : undefined}>
								{section.heading}
							</h2>
						{/if}
					{/if}
					<InsightBody value={section.body} />

					{#if hasToc && sectionHasBackToContents(section)}
						<!-- After a dense block (a property/content grid or the FAQ) the reader is a long way
						     from the contents. A quiet route back — not competing with the section headings or
						     the enquiry CTA. Keyed off the section's block types, never a hard-coded heading, so
						     it is reusable across every Insight. -->
						<a class="article-section__back" href="#insight-contents">
							<svg
								class="article-section__back-icon"
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M6 10V2M2.5 5.5 6 2l3.5 3.5"
									stroke="currentColor"
									stroke-width="1.4"
									stroke-linecap="square"
								/>
							</svg>
							Back to contents
						</a>
					{/if}
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
<TalkToUsBand
	heading={ctaHeading}
	body={ctaBody}
	primary={ctaPrimary}
	secondary={ctaSecondary}
	whatsAppLabel={ctaWhatsAppLabel}
	whatsAppMessage={ctaWhatsAppMessage}
	actionsLayout="stack"
/>

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

	/* Jump target for the back-to-contents links: the article body's own (non-sticky) top, so the
	   jump lands at the article opening where the contents rail begins. Clear the fixed nav — and,
	   on mobile, the sticky contents bar that pins directly beneath it — so the opening is not hidden
	   under them. */
	#insight-contents {
		scroll-margin-top: calc(var(--nav-height) + var(--space-md));
	}

	/* Quiet return route at the foot of a dense (grid/FAQ) section. Sans, small and --muted so it
	   sits well below the serif section headings and the enquiry CTA in the emphasis ladder; the
	   only colour it earns is the gold-on-hover shared with every other quiet link on the page. */
	.article-section__back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-lg);
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.article-section__back-icon {
		color: var(--gold);
		transition: transform var(--duration-hover) var(--ease);
	}

	.article-section__back:hover,
	.article-section__back:focus-visible {
		color: var(--green);
	}

	.article-section__back:hover .article-section__back-icon,
	.article-section__back:focus-visible .article-section__back-icon {
		transform: translateY(-2px);
	}

	@media (prefers-reduced-motion: reduce) {
		.article-section__back,
		.article-section__back-icon {
			transition: none;
		}

		.article-section__back:hover .article-section__back-icon,
		.article-section__back:focus-visible .article-section__back-icon {
			transform: none;
		}
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

	/* Eyebrow variant: the <h2> keeps the outline, but the InsightKicker span inside supplies the
	   type (sans overline + ◆ mark), so strip the serif h2's own size/line-height and let the label
	   sit close to the sub-heads it introduces. */
	.article-section__heading--eyebrow {
		font-size: var(--text-overline);
		line-height: 1;
		margin-bottom: var(--space-lg);
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
