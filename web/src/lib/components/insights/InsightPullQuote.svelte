<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightPullQuoteBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightPullQuoteBlock> } = $props();

	const value = $derived(portableText.value);
	const quote = $derived(value.quote?.trim() ?? '');
	const attribution = $derived(value.attribution?.trim() || null);
	const filled = $derived(value.variant === 'filled');
</script>

{#if quote}
	<figure class="pull-quote" class:pull-quote--filled={filled}>
		<blockquote class="pull-quote__text">{quote}</blockquote>
		{#if attribution}
			<figcaption class="pull-quote__attr">{attribution}</figcaption>
		{/if}
	</figure>
{/if}

<style>
	.pull-quote {
		margin-block: clamp(2rem, 5vw, 3rem);
		padding-block: var(--space-lg);
		border-block: 1px solid var(--border);
		text-align: left;
	}

	.pull-quote__text {
		margin: 0;
		font-family: var(--serif);
		font-style: italic;
		font-size: clamp(1.4rem, 1rem + 1.6vw, 2rem);
		line-height: 1.3;
		color: var(--green);
		text-wrap: balance;
	}

	.pull-quote__attr {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted);
	}

	.pull-quote__attr::before {
		content: '';
		display: inline-block;
		width: 1.75rem;
		height: 1px;
		margin-right: 0.75rem;
		vertical-align: middle;
		background: var(--gold);
	}

	/*
	 * Filled variant — the partner-led treatment. The quote reads as a placed card on the brand
	 * tint rather than a break in the prose: no top/bottom rules, a single green accent edge, and
	 * an upright cut (the italic is the house default's display moment; upright suits a plain-spoken
	 * named source). The accent edge above 1px is deliberate here and only here — earned by the
	 * approved partner-article design, not a default for callouts elsewhere.
	 */
	.pull-quote--filled {
		padding: clamp(1.5rem, 4vw, 2.25rem) clamp(1.5rem, 4vw, 2.25rem) clamp(1.5rem, 4vw, 2.25rem)
			clamp(1.5rem, 4vw, 2.25rem);
		border-block: 0;
		border-inline-start: 3px solid var(--green);
		background: var(--surface-tint);
	}

	.pull-quote--filled .pull-quote__text {
		font-style: normal;
	}

	.pull-quote--filled .pull-quote__attr {
		margin-top: var(--space-sm);
	}
</style>
