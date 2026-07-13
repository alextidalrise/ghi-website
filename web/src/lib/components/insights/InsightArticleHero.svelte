<script lang="ts">
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '$lib/sanity/image';
	import { insightKickerLabel } from '$lib/insights/categories';
	import {
		formatInsightDate,
		insightDateISO,
		readingLabel,
		splitTitleEmphasis
	} from '$lib/insights/format';
	import type { InsightDetail } from '$lib/insights/types';
	import InsightKicker from './InsightKicker.svelte';
	import InsightMeta from './InsightMeta.svelte';

	let {
		insight,
		breadcrumbs
	}: { insight: InsightDetail; breadcrumbs: BreadcrumbItem[] } = $props();

	const kicker = $derived(insightKickerLabel(insight.insightCategory));
	const titleParts = $derived(splitTitleEmphasis(insight.title, insight.titleEmphasis));
	const image = $derived(
		buildPublicImageUrl(insight.heroImage, { width: 1120, height: 840, fit: 'crop', quality: 82 })
	);
	const srcset = $derived(
		buildImageSrcset(insight.heroImage, [480, 720, 960, 1120], {
			height: 840,
			fit: 'crop',
			quality: 82
		})
	);
	const lqip = $derived(getImagePlaceholder(insight.heroImage));
	const alt = $derived(insight.heroImage?.altText?.trim() || insight.title || 'Insight');
	const caption = $derived(insight.heroCaption?.trim() || null);
	const note = $derived(
		insight.heroNote?.heading?.trim() && insight.heroNote?.body?.trim()
			? { heading: insight.heroNote.heading.trim(), body: insight.heroNote.body.trim() }
			: null
	);
	const hasRail = $derived(Boolean(image || note));
	const dateLabel = $derived(formatInsightDate(insight.publishedAt, 'long'));
	const dateISO = $derived(insightDateISO(insight.publishedAt));
	const reading = $derived(readingLabel(insight));
</script>

<div class="article-hero-band" class:article-hero-band--with-rail={hasRail}>
<header class="article-hero content-wrap" class:article-hero--with-rail={hasRail}>
	<div class="article-hero__text">
		{#if breadcrumbs.length > 0}
			<Breadcrumbs items={breadcrumbs} inline hideCurrent />
		{/if}

		<div class="article-hero__kicker"><InsightKicker label={kicker} /></div>

		<h1 class="article-hero__title">
			<!-- prettier-ignore -->
			{#each titleParts as part (part.text)}{#if part.emphasis}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
		</h1>

		{#if insight.subhead}
			<p class="article-hero__deck">{insight.subhead}</p>
		{/if}

		<div class="article-hero__byline">
			<InsightMeta author={insight.author} {dateISO} {dateLabel} {reading} withAvatar />
		</div>
	</div>

	{#if hasRail}
		<aside class="article-hero__rail">
			{#if image}
				<!-- Matted plate: the frame holds both the photograph and its caption, so the image
				     reads as something placed on the page rather than dropped into it. -->
				<figure class="article-hero__media">
					<div
						class="article-hero__frame"
						style:background-image={lqip ? `url(${lqip})` : undefined}
					>
						<img
							src={image}
							srcset={srcset || undefined}
							sizes="(max-width: 52rem) 100vw, 21rem"
							{alt}
							width="1120"
							height="840"
							loading="eager"
							fetchpriority="high"
							decoding="async"
						/>
					</div>
					{#if caption}
						<figcaption class="article-hero__caption">{caption}</figcaption>
					{/if}
				</figure>
			{/if}

			{#if note}
				<!-- The article's thesis, stated before the reader scrolls. Styled as a display
				     line, not a heading: the section h2s own the document outline. -->
				<div class="article-hero__note">
					<p class="article-hero__note-heading">{note.heading}</p>
					<p class="article-hero__note-body">{note.body}</p>
				</div>
			{/if}
		</aside>
	{/if}
</header>
</div>

<style>
	/*
	 * The band exists to carry the ground under the rail, full-bleed to the right edge.
	 * Without it the rail's white plates float on white and the composition has no
	 * architecture — the photograph reads as dropped in rather than placed.
	 *
	 * The wash is --surface-tint (the brand-green whisper), NOT the warm cream that was
	 * removed on 2026-06-01. Per the Emphasis Ladder this is the article page's one tint
	 * band (tier 2); the green CTA at the foot is still the page's one green (tier 4).
	 *
	 * The split is computed, not a magic percentage: it lands exactly halfway across the
	 * grid gap, on the rail's side. Everything is a % of the band, so there is no 100vw
	 * and no scrollbar-width overflow.
	 */
	.article-hero-band {
		--hero-rail: 21rem;
		--hero-gap: clamp(2rem, 5vw, 4.5rem);
		--hero-split: calc(
			50% + min(var(--content-max), 100%) / 2 - var(--content-padding) - var(--hero-rail) -
				var(--hero-gap) / 2
		);
		border-block-end: 1px solid var(--border);
	}

	.article-hero {
		padding-block: var(--space-xl) var(--space-2xl);
		display: grid;
		gap: var(--hero-gap);
		align-items: start;
	}

	.article-hero__text {
		min-width: 0;
	}

	/* Rhythm, not a uniform stack: the kicker sits close to the headline it labels, the deck
	   gets air, and the byline is ruled off so the column closes on a line instead of
	   trailing away. */
	.article-hero__kicker {
		margin-top: var(--space-lg);
	}

	.article-hero__title {
		margin: var(--space-sm) 0 0;
		line-height: 1.04;
		letter-spacing: var(--tracking-display);
	}

	/* The one italic moment on the page. A step back in weight and colour as well as a
	   change of cut — it should read as the sentence turning, not as a second headline. */
	.article-hero__title em {
		font-style: italic;
		font-weight: 400;
		color: var(--green-soft);
	}

	/* The deck is set in the serif, not the body sans: it belongs to the headline. */
	.article-hero__deck {
		margin: var(--space-md) 0 0;
		font-family: var(--serif);
		font-size: clamp(1.25rem, 0.95rem + 1vw, 1.6rem);
		font-weight: 400;
		line-height: 1.32;
		color: var(--green);
		max-width: 40ch;
		text-wrap: pretty;
	}

	.article-hero__byline {
		margin-top: var(--space-lg);
		padding-top: var(--space-md);
		border-block-start: 1px solid var(--border);
	}

	.article-hero__rail {
		min-width: 0;
	}

	.article-hero__media {
		margin: 0;
		border: 1px solid var(--border);
		background: var(--white);
	}

	.article-hero__frame {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: var(--green);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.article-hero__frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Inside the frame, under a hairline — a plate and its label. */
	.article-hero__caption {
		padding: 0.75rem 0.875rem;
		border-block-start: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.5;
		color: var(--muted);
	}

	.article-hero__note {
		margin-top: var(--space-md);
		padding: var(--space-lg);
		border: 1px solid var(--border);
		background: var(--white);
	}

	.article-hero__note-heading {
		margin: 0 0 var(--space-xs);
		font-family: var(--serif);
		font-size: var(--text-h3);
		font-weight: 400;
		line-height: 1.16;
		color: var(--green);
		text-wrap: balance;
	}

	.article-hero__note-body {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--muted);
	}

	/* Stacked: the photograph goes wide and shallow so the headline and deck still clear the
	   fold. A 4:3 plate at full width would push the byline off the first screen. */
	@media (max-width: 57.99rem) {
		.article-hero__frame {
			aspect-ratio: 16 / 10;
		}
	}

	/* The text column leads and the rail supports: the headline needs the room, and a rail
	   wider than its own content just floats. Hence a fixed rail, not a fraction — and a
	   two-column threshold high enough that a 21rem rail never squeezes the display type
	   (at 52rem the column fell to 373px and the headline started stacking word by word).
	   Stacked, there is no rail to ground, so the wash stays off and the hero is all white. */
	@media (min-width: 58rem) {
		.article-hero--with-rail {
			grid-template-columns: minmax(0, 1fr) var(--hero-rail);
		}

		.article-hero-band--with-rail {
			background: linear-gradient(
				90deg,
				var(--white) 0 var(--hero-split),
				var(--surface-tint) var(--hero-split) 100%
			);
		}
	}
</style>
