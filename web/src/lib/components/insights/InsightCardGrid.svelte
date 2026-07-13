<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightCardGridBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightCardGridBlock> } = $props();

	const value = $derived(portableText.value);
	const items = $derived(
		(value.items ?? [])
			.map((item, i) => ({
				key: item?._key ?? String(i),
				heading: item?.heading?.trim() ?? '',
				body: item?.body?.trim() ?? ''
			}))
			.filter((item) => item.heading.length > 0 && item.body.length > 0)
	);
</script>

<!-- The Sanity type stays `insightCardGrid` because existing documents reference it, but these
     are term-and-definition pairs rather than cards. A `dl` says so to a screen reader, and it
     gives each column a wrapper to hang the gutter rule on. -->
{#if items.length > 0}
	<dl class="deck">
		{#each items as item (item.key)}
			<div class="deck__item">
				<dt class="deck__term">{item.heading}</dt>
				<dd class="deck__def">{item.body}</dd>
			</div>
		{/each}
	</dl>
{/if}

<style>
	/* Parallel considerations the reader weighs against each other, so the columns are equal by
	   definition and the side-by-side is the argument. The schema caps items at three, so a single
	   row always fits: no auto-fit, which would let a 3-up reflow to 2+1 and quietly rank one point
	   above the others.

	   Ruled, not boxed. Cells fenced on all four sides over a filled bed read as a spreadsheet,
	   which is the one thing this page should never look like. A hairline over the set and a rule
	   down each gutter carry exactly the same structure with none of the cage, and the whitespace
	   underneath closes the block without needing a bottom border to do it. */
	.deck {
		position: relative;
		display: grid;
		gap: var(--space-lg);
		margin-block: var(--space-xl);
		padding-block-start: var(--space-lg);
		border-block-start: 1px solid var(--border);
	}

	/* A gold segment sitting on the leading edge of the top rule: the same 1.75rem mark the pull
	   quote sets before its attribution, so the article's set-pieces share one signature. */
	.deck::before {
		content: '';
		position: absolute;
		inset-block-start: -1px;
		inset-inline-start: 0;
		width: 1.75rem;
		height: 1px;
		background: var(--gold);
	}

	.deck__item {
		position: relative;
		min-width: 0;
	}

	/* The rule lives in the gutter rather than on the item, so every column keeps an identical
	   measure and the first column's text still aligns flush with the prose above it. Half the gap
	   in negative offset puts it dead centre. It rotates with the layout: a horizontal hairline
	   between stacked items, a vertical one between columns. */
	.deck__item + .deck__item::before {
		content: '';
		position: absolute;
		inset-inline: 0;
		inset-block-start: calc(var(--space-lg) * -0.5);
		height: 1px;
		background: var(--border);
	}

	.deck__term {
		margin: 0 0 var(--space-xs);
		font-family: var(--serif);
		font-size: var(--text-h4);
		line-height: 1.25;
		color: var(--green);
		text-wrap: balance;
	}

	/* `dd` carries a 40px inline-start margin by default; without the reset every definition hangs
	   off its own term. */
	.deck__def {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	/* Three columns inside a 44rem prose measure leaves about 28ch each, which a short definition
	   reads fine at. The old 34rem breakpoint went 3-up while the measure was still half that, and
	   crushed the copy to three words a line. */
	@media (min-width: 48rem) {
		.deck {
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
		}

		.deck__item + .deck__item::before {
			inset-inline-start: calc(var(--space-lg) * -0.5);
			inset-inline-end: auto;
			inset-block: 0;
			width: 1px;
			height: auto;
		}
	}
</style>
