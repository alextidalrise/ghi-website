<script lang="ts">
	import { PortableText, type PortableTextComponents } from '@portabletext/svelte';
	import type { GuideBodyBlock } from '$lib/guides/types';
	import GuideBlock from './GuideBlock.svelte';
	import GuideLink from './GuideLink.svelte';
	import GuideCallout from './GuideCallout.svelte';
	import GuideKeyFigures from './GuideKeyFigures.svelte';
	import GuideImage from './GuideImage.svelte';

	let { value }: { value: GuideBodyBlock[] | null | undefined } = $props();

	const components: PortableTextComponents = {
		block: GuideBlock,
		marks: { link: GuideLink },
		types: {
			guideCallout: GuideCallout,
			guideKeyFigures: GuideKeyFigures,
			mediaAssetMetadata: GuideImage
		}
	};
</script>

{#if value && value.length > 0}
	<div class="guide-body">
		<PortableText value={value as never} {components} onMissingComponent={false} />
	</div>
{/if}

<style>
	.guide-body {
		color: var(--charcoal);
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.75;
		text-wrap: pretty;
	}

	/* Prose paragraphs only — direct children. Custom blocks own their internal paragraphs. */
	.guide-body > :global(p) {
		margin-block: 0;
	}

	.guide-body > :global(p + p) {
		margin-top: var(--space-md);
	}

	/* In-section headings sit a clear step below the section h2. */
	.guide-body :global(.guide-body__h3) {
		font-size: var(--text-h4);
		margin-block: var(--space-lg) var(--space-sm);
	}

	.guide-body :global(.guide-body__h4) {
		font-family: var(--sans);
		font-weight: 500;
		font-size: 1.0625rem;
		color: var(--green);
		letter-spacing: 0;
		margin-block: var(--space-md) var(--space-xs);
	}

	/* Prose lists only — see the matching note in InsightBody. Keep these scoped to the body's
	   own lists so they can't reach into custom blocks that render their own. */
	.guide-body > :global(ul),
	.guide-body > :global(ol),
	.guide-body > :global(ul ul),
	.guide-body > :global(ul ol),
	.guide-body > :global(ol ul),
	.guide-body > :global(ol ol) {
		margin-block: var(--space-sm);
		padding-left: 1.35rem;
	}

	.guide-body > :global(ul li),
	.guide-body > :global(ol li) {
		margin-bottom: 0.4rem;
		padding-left: 0.25rem;
	}

	.guide-body > :global(ul li::marker),
	.guide-body > :global(ol li::marker) {
		color: var(--gold);
	}

	.guide-body :global(a) {
		color: var(--green);
		text-decoration: underline;
		text-decoration-color: var(--border);
		text-underline-offset: 0.18em;
		transition: text-decoration-color var(--duration-hover) var(--ease);
	}

	.guide-body :global(a:hover),
	.guide-body :global(a:focus-visible) {
		text-decoration-color: var(--gold);
	}

	.guide-body :global(strong) {
		font-weight: 500;
		color: var(--green);
	}

	/* A pulled-out quote: hairline frame, no side stripe. */
	.guide-body :global(.guide-body__quote) {
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
		.guide-body :global(a) {
			transition: none;
		}
	}
</style>
