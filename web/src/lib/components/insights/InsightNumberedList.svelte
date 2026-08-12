<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightNumberedListBlock, InsightNumberedItem } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightNumberedListBlock> } =
		$props();

	const value = $derived(portableText.value);
	const heading = $derived(value.heading?.trim() || null);
	const items = $derived(
		(value.items ?? []).filter(
			(item): item is InsightNumberedItem => Boolean(item?.heading?.trim())
		)
	);
</script>

{#if items.length > 0}
	<div class="numbered">
		{#if heading}
			<h3 class="numbered__heading">{heading}</h3>
		{/if}
		<ol class="numbered__list">
			{#each items as item, index (item._key ?? index)}
				<li class="numbered__item">
					<!-- The numeral is decorative punctuation, not content: the <ol> already numbers the
					     list for assistive tech, so this printed numeral is aria-hidden to avoid a doubled
					     "one, one". -->
					<span class="numbered__num" aria-hidden="true">{index + 1}</span>
					<div class="numbered__text">
						<p class="numbered__q">{item.heading}</p>
						{#if item.body?.trim()}
							<p class="numbered__a">{item.body}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	</div>
{/if}

<style>
	.numbered {
		margin-block: clamp(2rem, 5vw, 3rem);
	}

	.numbered__heading {
		font-family: var(--serif);
		font-size: var(--text-h3);
		font-weight: 400;
		color: var(--green);
		margin: 0 0 var(--space-md);
	}

	.numbered__list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--border);
	}

	.numbered__item {
		display: grid;
		grid-template-columns: 2.75rem minmax(0, 1fr);
		gap: clamp(0.75rem, 2vw, 1.25rem);
		align-items: baseline;
		padding-block: var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	/* Big Playfair numeral in gold — the display counter the prose <ol> can't give. Baseline-
	   aligned to the question so a single-line question sits level with its number. */
	.numbered__num {
		font-family: var(--serif);
		font-size: clamp(1.5rem, 1rem + 1.6vw, 2.1rem);
		line-height: 1;
		color: var(--gold);
		font-variant-numeric: lining-nums;
	}

	.numbered__text {
		min-width: 0;
	}

	.numbered__q {
		margin: 0;
		font-family: var(--sans);
		font-weight: 500;
		font-size: 1.0625rem;
		line-height: 1.4;
		color: var(--green);
	}

	.numbered__a {
		margin: 0.35rem 0 0;
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--charcoal);
		max-width: 62ch;
		text-wrap: pretty;
	}
</style>
