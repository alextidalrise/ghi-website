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
	import InsightCardGrid from './InsightCardGrid.svelte';
	import InsightPullQuote from './InsightPullQuote.svelte';
	import InsightTakeaways from './InsightTakeaways.svelte';
	import InsightFaq from './InsightFaq.svelte';
	import InsightCtaCallout from './InsightCtaCallout.svelte';

	let { value }: { value: InsightBodyBlock[] | null | undefined } = $props();

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
			insightCardGrid: InsightCardGrid,
			insightPullQuote: InsightPullQuote,
			insightTakeaways: InsightTakeaways,
			insightFaq: InsightFaq,
			insightCtaCallout: InsightCtaCallout
		}
	};
</script>

{#if value && value.length > 0}
	<div class="insight-body">
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

	.insight-body :global(a) {
		color: var(--green);
		text-decoration: underline;
		text-decoration-color: var(--border);
		text-underline-offset: 0.18em;
		transition: text-decoration-color var(--duration-hover) var(--ease);
	}

	.insight-body :global(a:hover),
	.insight-body :global(a:focus-visible) {
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

	@media (prefers-reduced-motion: reduce) {
		.insight-body :global(a) {
			transition: none;
		}
	}
</style>
