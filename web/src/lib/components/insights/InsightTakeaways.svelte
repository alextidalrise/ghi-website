<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightTakeawaysBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightTakeawaysBlock> } = $props();

	const value = $derived(portableText.value);
	const heading = $derived(value.heading?.trim() || 'What this article covers');
	const items = $derived(
		(value.items ?? [])
			.map((item) => ({ label: item?.label?.trim() ?? '', text: item?.text?.trim() ?? '' }))
			.filter((item) => item.text.length > 0)
	);
</script>

{#if items.length > 0}
	<aside class="takeaways" aria-label={heading}>
		<p class="takeaways__heading">{heading}</p>
		<ul class="takeaways__list">
			{#each items as item (item.text)}
				<!-- prettier-ignore -->
				<li class="takeaways__item"><span class="takeaways__text">{#if item.label}<span class="takeaways__label">{item.label}</span><span class="takeaways__dash">{' — '}</span>{/if}{item.text}</span></li>
			{/each}
		</ul>
	</aside>
{/if}

<style>
	.takeaways {
		margin-block: var(--space-lg);
		padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1.5rem, 4vw, 2rem);
		border: 1px solid var(--border);
		border-block-start: 1px solid var(--gold);
		background: var(--white);
	}

	/* Own our paragraph margins rather than inheriting the body's prose reset. */
	.takeaways__heading {
		margin: 0 0 var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
	}

	.takeaways__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	/* The marker gets its own column rather than an absolute offset: wrapped lines hang
	   under the text automatically, and the item is immune to any ambient list padding. */
	.takeaways__item {
		display: grid;
		grid-template-columns: 0.75rem minmax(0, 1fr);
		column-gap: 0.625rem;
		align-items: start;
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	/* The label leads the point in green. The em dash is real text, not generated content, so
	   it survives copy-paste and is announced: the distinction never rests on colour alone. */
	.takeaways__label {
		font-weight: 500;
		color: var(--green);
	}

	.takeaways__dash {
		color: var(--muted);
	}

	/* Gold tick marker — leading glyph, not a side border. Nudged to the optical centre of
	   the first line: (line-height − marker) / 2. */
	.takeaways__item::before {
		content: '';
		width: 0.5rem;
		height: 0.5rem;
		justify-self: center;
		margin-top: 0.55em;
		background: var(--gold);
		transform: rotate(45deg);
	}
</style>
