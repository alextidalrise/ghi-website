<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightGuideCardsBlock } from '$lib/insights/types';
	import { toInsightGuideCards } from '$lib/sanity/transforms/insightGuideCard';

	let {
		portableText
	}: { portableText: CustomBlockComponentProps<InsightGuideCardsBlock> } = $props();

	const heading = $derived(portableText.value.heading?.trim() || null);
	const cards = $derived(toInsightGuideCards(portableText.value.items));
</script>

{#if cards.length > 0}
	<div class="guide-cards">
		{#if heading}
			<h3 class="guide-cards__heading">{heading}</h3>
		{/if}

		<div class="guide-cards__grid">
			{#each cards as card (card._id)}
				<a class="guide-card" href={card.href}>
					{#if card.audienceLabel}
						<span class="guide-card__chip">{card.audienceLabel}</span>
					{/if}
					<h4 class="guide-card__title">{card.title}</h4>
					{#if card.summary}
						<p class="guide-card__summary">{card.summary}</p>
					{/if}
					<span class="guide-card__cta">
						Read guide
						<span class="guide-card__arrow" aria-hidden="true">→</span>
					</span>
				</a>
			{/each}
		</div>
	</div>
{/if}

<style>
	.guide-cards {
		margin-block: var(--space-lg);
	}

	.guide-cards__heading {
		font-size: var(--text-h3);
		margin-bottom: var(--space-lg);
	}

	.guide-cards__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
	}

	/* A whole-card link on the house green — live text, never an image with baked-in words. */
	.guide-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-height: 44px;
		padding: var(--space-lg);
		background: var(--green);
		color: var(--on-green);
		text-decoration: none;
		transition: background-color var(--duration-hover, 0.3s) var(--ease);
	}

	.guide-card:hover,
	.guide-card:focus-visible {
		background-color: var(--green-dark, #0d3b2e);
	}

	.guide-card:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.guide-card__chip {
		align-self: flex-start;
		padding: 0.3rem 0.7rem;
		border: 1px solid rgba(255, 255, 255, 0.35);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		opacity: 0.9;
	}

	.guide-card__title {
		font-family: var(--serif);
		font-size: var(--text-h4);
		line-height: 1.25;
		text-decoration: underline;
		text-decoration-color: rgba(255, 255, 255, 0.4);
		text-underline-offset: 0.16em;
		transition: text-decoration-color var(--duration-hover, 0.3s) var(--ease);
	}

	.guide-card:hover .guide-card__title,
	.guide-card:focus-visible .guide-card__title {
		text-decoration-color: var(--gold);
	}

	.guide-card__summary {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.6;
		opacity: 0.88;
		max-width: 48ch;
	}

	.guide-card__cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: auto;
		padding-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
	}

	.guide-card__arrow {
		color: var(--gold);
		transition: transform var(--duration-hover, 0.3s) var(--ease);
	}

	.guide-card:hover .guide-card__arrow,
	.guide-card:focus-visible .guide-card__arrow {
		transform: translateX(3px);
	}

	@media (min-width: 44rem) {
		.guide-cards__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-lg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.guide-card,
		.guide-card__title,
		.guide-card__arrow {
			transition: none;
		}
	}
</style>
