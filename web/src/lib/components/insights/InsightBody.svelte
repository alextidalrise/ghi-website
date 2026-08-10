<script lang="ts">
	import { PortableText, type PortableTextComponents } from '@portabletext/svelte';
	import type { InsightBodyBlock } from '$lib/insights/types';
	// Shared editorial renderers, reused from the guides body vocabulary.
	import GuideBlock from '$lib/components/guides/GuideBlock.svelte';
	import GuideLink from '$lib/components/guides/GuideLink.svelte';
	import GuideCallout from '$lib/components/guides/GuideCallout.svelte';
	import GuideKeyFigures from '$lib/components/guides/GuideKeyFigures.svelte';
	import GuideImage from '$lib/components/guides/GuideImage.svelte';
	// Journal-specific renderers.
	import InsightFigure from './InsightFigure.svelte';
	import InsightFigurePair from './InsightFigurePair.svelte';
	import InsightPortrait from './InsightPortrait.svelte';
	import InsightCardGrid from './InsightCardGrid.svelte';
	import InsightRoutes from './InsightRoutes.svelte';
	import InsightPullQuote from './InsightPullQuote.svelte';
	import InsightTakeaways from './InsightTakeaways.svelte';
	import InsightFaq from './InsightFaq.svelte';
	import InsightCtaCallout from './InsightCtaCallout.svelte';
	import InsightFrontlineRail from './InsightFrontlineRail.svelte';
	import InsightDestinationGrid from './InsightDestinationGrid.svelte';
	import InsightDevelopmentGrid from './InsightDevelopmentGrid.svelte';
	import InsightCourseGrid from './InsightCourseGrid.svelte';
	import InsightPartnerLogoGrid from './InsightPartnerLogoGrid.svelte';
	import InsightGuideCards from './InsightGuideCards.svelte';

	let { value }: { value: InsightBodyBlock[] | null | undefined } = $props();

	// A compact portrait floats on desktop; make its section body a flow-root so the float is
	// contained here and never overhangs the next heading. Scoped to bodies that actually carry
	// a portrait, so no portrait-free article changes its block spacing.
	const hasPortrait = $derived(
		Array.isArray(value) && value.some((block) => block?._type === 'insightPortrait')
	);

	const components: PortableTextComponents = {
		block: GuideBlock,
		marks: { link: GuideLink },
		types: {
			guideCallout: GuideCallout,
			guideKeyFigures: GuideKeyFigures,
			// Articles author images as `insightFigure` (framed + captioned). `mediaAssetMetadata`
			// stays mapped for older documents that still carry the bare block.
			mediaAssetMetadata: GuideImage,
			insightFigure: InsightFigure,
			insightFigurePair: InsightFigurePair,
			insightPortrait: InsightPortrait,
			insightCardGrid: InsightCardGrid,
			insightRoutes: InsightRoutes,
			insightPullQuote: InsightPullQuote,
			insightTakeaways: InsightTakeaways,
			insightFaq: InsightFaq,
			insightCtaCallout: InsightCtaCallout,
			insightFrontlineRail: InsightFrontlineRail,
			insightDestinationGrid: InsightDestinationGrid,
			insightDevelopmentGrid: InsightDevelopmentGrid,
			insightCourseGrid: InsightCourseGrid,
			insightPartnerLogoGrid: InsightPartnerLogoGrid,
			insightGuideCards: InsightGuideCards
		}
	};
</script>

{#if value && value.length > 0}
	<div class="insight-body" class:insight-body--has-portrait={hasPortrait}>
		<PortableText value={value as never} {components} onMissingComponent={false} />
	</div>
{/if}

<style>
	.insight-body {
		color: var(--charcoal);
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.75;
		text-wrap: pretty;
	}

	/* Contain the compact portrait's desktop float within its own section (see InsightPortrait).
	   Only applied when a portrait is present, so block spacing elsewhere is untouched. */
	.insight-body--has-portrait {
		display: flow-root;
	}

	/* Prose paragraphs only — direct children. Custom blocks own their internal paragraphs. */
	.insight-body > :global(p) {
		margin-block: 0;
	}

	.insight-body > :global(p + p) {
		margin-top: var(--space-md);
	}

	/* In-section headings sit a clear step below the section h2. */
	.insight-body :global(.guide-body__h3) {
		font-size: var(--text-h4);
		margin-block: var(--space-lg) var(--space-sm);
	}

	.insight-body :global(.guide-body__h4) {
		font-family: var(--sans);
		font-weight: 500;
		font-size: 1.0625rem;
		color: var(--green);
		letter-spacing: 0;
		margin-block: var(--space-md) var(--space-xs);
	}

	/* Prose lists only. The guard is `:not([class])`, not the child combinator: Portable Text
	   renders the article's own lists as bare `ul`/`ol`, while a custom block that happens to
	   root in a list always carries a class. `>` alone does not scope this — a list-rooted block
	   sits at the top level of the body and IS a direct child, so it used to inherit this padding
	   and these item margins. That is how the card grid, which drew its rules by showing a
	   border-coloured background through a 1px gap, ended up wearing a 21px slab of that colour
	   down its left edge and another along its bottom. */
	.insight-body > :global(ul:not([class])),
	.insight-body > :global(ol:not([class])),
	.insight-body > :global(ul:not([class]) ul),
	.insight-body > :global(ul:not([class]) ol),
	.insight-body > :global(ol:not([class]) ul),
	.insight-body > :global(ol:not([class]) ol) {
		margin-block: var(--space-sm);
		padding-left: 1.35rem;
	}

	.insight-body > :global(ul:not([class]) li),
	.insight-body > :global(ol:not([class]) li) {
		margin-bottom: 0.4rem;
		padding-left: 0.25rem;
	}

	.insight-body > :global(ul:not([class]) li::marker),
	.insight-body > :global(ol:not([class]) li::marker) {
		color: var(--gold);
	}

	/* Prose links only. The guard is `:not([class])`, the same reasoning as the list rule above:
	   Portable Text renders the article's own links (the `link` mark → GuideLink) as bare `<a>`,
	   while every custom block's link carries a class (`.destination__cta`, `.guide-card`,
	   `.dev-card`, the course/partner cells). Without the guard this green colour + hairline
	   underline bled onto those block links — turning the green-on-green destination CTA and the
	   whole green guide card invisible, and drawing a stray border-coloured underline across each
	   development card. Bare-anchor scoping keeps prose links styled and leaves blocks to own theirs. */
	.insight-body :global(a:not([class])) {
		color: var(--green);
		text-decoration: underline;
		text-decoration-color: var(--border);
		text-underline-offset: 0.18em;
		transition: text-decoration-color var(--duration-hover) var(--ease);
	}

	.insight-body :global(a:not([class]):hover),
	.insight-body :global(a:not([class]):focus-visible) {
		text-decoration-color: var(--gold);
	}

	.insight-body :global(strong) {
		font-weight: 500;
		color: var(--green);
	}

	.insight-body :global(.guide-body__quote) {
		margin-block: var(--space-lg);
		padding: var(--space-md) var(--space-lg);
		border-block: 1px solid var(--border);
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-style: italic;
		line-height: 1.4;
		color: var(--green);
	}

	/* The editorial lead — a serif green thesis line set a step up from the prose, the same
	   register as the hero deck. Used for a section's opening statement (e.g. the portfolio
	   standfirst above the development grid). */
	.insight-body :global(.guide-body__lead) {
		font-family: var(--serif);
		font-size: clamp(1.2rem, 1rem + 0.9vw, 1.42rem);
		line-height: 1.45;
		color: var(--green);
		max-width: 36ch;
		text-wrap: pretty;
	}

	/* Fine print — a muted checked-on/reconfirm note, a clear step below the prose. */
	.insight-body :global(.guide-body__note) {
		font-size: var(--text-small);
		line-height: 1.6;
		color: var(--muted);
		max-width: 66ch;
	}

	@media (prefers-reduced-motion: reduce) {
		.insight-body :global(a:not([class])) {
			transition: none;
		}
	}
</style>
