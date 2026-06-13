<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { GuideCalloutBlock } from '$lib/guides/types';

	let { portableText }: { portableText: CustomBlockComponentProps<GuideCalloutBlock> } = $props();

	const value = $derived(portableText.value);
	const tone = $derived(value.tone === 'important' ? 'important' : 'note');
	const label = $derived(value.title?.trim() || (tone === 'important' ? 'Important' : 'Good to know'));
	const paragraphs = $derived(
		(value.body ?? '')
			.split(/\n\s*\n/)
			.map((para) => para.trim())
			.filter(Boolean)
	);
</script>

<aside class="guide-callout" class:guide-callout--important={tone === 'important'}>
	<p class="guide-callout__label">{label}</p>
	{#each paragraphs as para (para)}
		<p class="guide-callout__body">{para}</p>
	{/each}
</aside>

<style>
	.guide-callout {
		margin-block: var(--space-lg);
		padding: var(--space-md) var(--space-lg);
		border: 1px solid var(--border);
		background: var(--white);
	}

	/* Full-width top rule in gold for the heavier tone. A top accent, never a side stripe. */
	.guide-callout--important {
		border-block-start: 2px solid var(--gold);
	}

	.guide-callout__label {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: var(--space-xs);
	}

	.guide-callout--important .guide-callout__label {
		color: var(--green);
	}

	.guide-callout__body {
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--charcoal);
	}

	.guide-callout__body + .guide-callout__body {
		margin-top: var(--space-sm);
	}
</style>
