<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightPartnerLogoGridBlock } from '$lib/insights/types';
	import { toInsightPartnerLogoCards } from '$lib/sanity/transforms/insightPartnerLogoCard';

	let {
		portableText
	}: { portableText: CustomBlockComponentProps<InsightPartnerLogoGridBlock> } = $props();

	const heading = $derived(portableText.value.heading?.trim() || null);
	const cards = $derived(toInsightPartnerLogoCards(portableText.value.items));
</script>

{#if cards.length > 0}
	<div class="partners">
		{#if heading}
			<h3 class="partners__heading">{heading}</h3>
		{/if}

		<!-- A ruled matrix: four across on desktop, two on a phone. Every cell is one focusable link
		     to the vetted-partner index — the introduction always runs through GHI. -->
		<ul class="partners__grid">
			{#each cards as card (card._id)}
				<li class="partner-cell">
					<a class="partner-cell__link" href={card.href}>
						<span class="partner-cell__logo">
							<img
								src={card.logo}
								srcset={card.srcset || undefined}
								sizes="150px"
								alt={card.alt}
								loading="lazy"
								decoding="async"
							/>
						</span>
						{#if card.serviceLabel}
							<span class="partner-cell__label">{card.serviceLabel}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.partners {
		margin-block: var(--space-lg);
	}

	.partners__heading {
		font-size: var(--text-h3);
		margin-bottom: var(--space-lg);
	}

	/* The rule is drawn by the container's top+left hairlines and each cell's right+bottom, so a
	   partial final row still reads as part of the same matrix (no floating right/bottom edges). */
	.partners__grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		border-top: 1px solid var(--border);
		border-left: 1px solid var(--border);
	}

	.partner-cell {
		border-right: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		min-width: 0;
	}

	.partner-cell__link {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.7rem;
		min-height: 8.5rem;
		height: 100%;
		padding: var(--space-md);
		text-decoration: none;
		color: inherit;
		transition: background-color var(--duration-hover, 0.3s) var(--ease);
	}

	.partner-cell__link:hover,
	.partner-cell__link:focus-visible {
		background-color: var(--surface-muted, rgba(0, 0, 0, 0.03));
	}

	.partner-cell__link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: -2px;
	}

	.partner-cell__logo {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 2.75rem;
	}

	.partner-cell__logo img {
		max-width: 150px;
		max-height: 2.75rem;
		width: auto;
		height: auto;
		object-fit: contain;
		filter: grayscale(1);
		opacity: 0.78;
		transition:
			filter var(--duration-hover, 0.3s) var(--ease),
			opacity var(--duration-hover, 0.3s) var(--ease);
	}

	.partner-cell__link:hover .partner-cell__logo img,
	.partner-cell__link:focus-visible .partner-cell__logo img {
		filter: grayscale(0);
		opacity: 1;
	}

	.partner-cell__label {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
		text-align: center;
	}

	@media (min-width: 44rem) {
		.partners__grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.partner-cell__link,
		.partner-cell__logo img {
			transition: none;
		}
	}
</style>
