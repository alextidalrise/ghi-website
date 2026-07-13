<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightPullQuoteBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightPullQuoteBlock> } = $props();

	const value = $derived(portableText.value);
	const quote = $derived(value.quote?.trim() ?? '');
	const attribution = $derived(value.attribution?.trim() || null);
</script>

{#if quote}
	<figure class="pull-quote">
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
</style>
