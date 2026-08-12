<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightDisclaimerBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightDisclaimerBlock> } =
		$props();

	const value = $derived(portableText.value);
	const heading = $derived(value.heading?.trim() || 'Important information');
	const paragraphs = $derived(
		(value.body ?? '')
			.split(/\n\s*\n/)
			.map((para) => para.trim())
			.filter(Boolean)
	);
</script>

{#if paragraphs.length > 0}
	<aside class="disclaimer" aria-label={heading}>
		<p class="disclaimer__heading">{heading}</p>
		{#each paragraphs as para (para)}
			<p class="disclaimer__body">{para}</p>
		{/each}
	</aside>
{/if}

<style>
	.disclaimer {
		margin-block: clamp(2rem, 5vw, 3rem);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.disclaimer__heading {
		margin: 0 0 var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.disclaimer__body {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.65;
		color: var(--muted);
		max-width: 72ch;
		text-wrap: pretty;
	}

	.disclaimer__body + .disclaimer__body {
		margin-top: var(--space-sm);
	}
</style>
