<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightExternalPropertyGridBlock } from '$lib/insights/types';
	import { toInsightExternalPropertyCards } from '$lib/sanity/transforms/insightExternalPropertyCard';

	let {
		portableText
	}: { portableText: CustomBlockComponentProps<InsightExternalPropertyGridBlock> } = $props();

	const block = $derived(portableText.value);
	const heading = $derived(block.heading?.trim() || null);
	// Resolve, validate and drop invalid cards in editor order. Every invalid card is warned about
	// inside the transform; the remaining grid stays coherent.
	const cards = $derived(toInsightExternalPropertyCards(block.items));
	// A grid-level volatility note is required whenever prices show — and every card carries a price.
	const priceNote = $derived(block.priceNote?.trim() || null);
</script>

{#if cards.length > 0}
	<div class="ext-shell">
		{#if heading}
			<h3 class="ext-shell__heading">{heading}</h3>
		{/if}

		<ul class="ext-grid" role="list">
			{#each cards as card (card._key)}
				<li class="ext-card">
					<div class="ext-card__media">
						<img
							src={card.image}
							srcset={card.srcset || undefined}
							sizes="(max-width: 40rem) 100vw, (max-width: 64rem) 40vw, 20rem"
							alt={card.alt}
							loading="lazy"
							decoding="async"
							style:background-image={card.lqip ? `url(${card.lqip})` : undefined}
						/>
					</div>
					<div class="ext-card__body">
						<h4 class="ext-card__name">{card.name}</h4>

						<dl class="ext-card__facts">
							<div class="ext-card__fact">
								<dt>Location</dt>
								<dd>{card.location}</dd>
							</div>
							<div class="ext-card__fact">
								<dt>Guests</dt>
								<dd>{card.guests}</dd>
							</div>
							<div class="ext-card__fact">
								<dt>Bedrooms</dt>
								<dd>{card.bedrooms}</dd>
							</div>
							<div class="ext-card__fact">
								<dt>From price</dt>
								<dd>{card.fromPrice}</dd>
							</div>
						</dl>

						<p class="ext-card__desc">{card.description}</p>

						{#if card.features.length > 0}
							<ul class="ext-card__features">
								{#each card.features as feature (feature)}
									<li>{feature}</li>
								{/each}
							</ul>
						{/if}

						<a
							class="ext-card__cta"
							href={card.linkHref}
							target="_blank"
							rel="noopener noreferrer"
						>
							<span>{card.linkLabel}</span>
							<svg
								class="ext-card__cta-icon"
								viewBox="0 0 24 24"
								width="16"
								height="16"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M7 17 17 7" />
								<path d="M8 7h9v9" />
							</svg>
							<span class="ext-card__cta-hint"> (opens in a new tab)</span>
						</a>
					</div>
				</li>
			{/each}
		</ul>

		{#if priceNote}
			<p class="ext-shell__note">{priceNote}</p>
		{/if}
	</div>
{/if}

<style>
	.ext-shell {
		margin-block: var(--space-lg);
	}

	.ext-shell__heading {
		font-size: var(--text-h3);
		margin-bottom: var(--space-lg);
	}

	/* Phone default: one column, stacked cards. Widens to two columns on desktop below. */
	.ext-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
	}

	/* The card is a plain container — NOT a link. Only the CTA is interactive, so no button-in-anchor
	   nesting. Stacked on phones (media on top, body below). */
	.ext-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
		border: 1px solid var(--border);
		background: var(--white);
	}

	.ext-card__media {
		aspect-ratio: 3 / 2;
		overflow: hidden;
		background-color: var(--green);
	}

	.ext-card__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.ext-card__body {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.85rem;
		padding: 1rem 1.1rem 1.15rem;
	}

	.ext-card__name {
		font-family: var(--serif);
		font-size: 1.2rem;
		line-height: 1.2;
		color: var(--green);
		margin: 0;
	}

	/* Facts as a fixed 2×2 group: Location, Guests, Bedrooms, From price — in that reading order. */
	.ext-card__facts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem 1rem;
		margin: 0;
		padding-top: 0.85rem;
		border-top: 1px solid var(--border);
	}

	.ext-card__fact {
		min-width: 0;
	}

	.ext-card__fact dt {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.ext-card__fact dd {
		margin: 0.15rem 0 0;
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--charcoal);
		overflow-wrap: anywhere;
	}

	/* From price reads in the same serif register as the site's own card prices. */
	.ext-card__fact:last-child dd {
		font-family: var(--serif);
		font-size: 1.05rem;
		color: var(--green);
	}

	.ext-card__desc {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	.ext-card__features {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.ext-card__features li {
		font-family: var(--sans);
		font-size: var(--text-overline);
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
		background: var(--surface-tint);
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
	}

	/* The single interactive element. Pinned to the card foot, ≥44px tall, with a visible focus ring
	   and an explicit "opens in a new tab" affordance (icon + screen-reader text). */
	.ext-card__cta {
		margin-top: auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 44px;
		padding: 0.6rem 1.1rem;
		border: 1px solid var(--green);
		background: transparent;
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 600;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		transition: background var(--duration-hover, 0.3s) var(--ease),
			color var(--duration-hover, 0.3s) var(--ease);
	}

	.ext-card__cta:hover {
		background: var(--green);
		color: var(--white);
	}

	.ext-card__cta:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.ext-card__cta-icon {
		flex: none;
	}

	.ext-card__cta-hint {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.ext-shell__note {
		margin: var(--space-md) 0 0;
		font-size: var(--text-small);
		line-height: 1.6;
		color: var(--muted);
		max-width: 66ch;
	}

	/* Tablet (viewport ~768px): one wide card per row, image and content split side by side where
	   there is room to read both. */
	@media (min-width: 40rem) and (max-width: 63.999rem) {
		.ext-card {
			flex-direction: row;
		}

		.ext-card__media {
			flex: 0 0 40%;
			aspect-ratio: auto;
			min-height: 100%;
		}

		.ext-card__body {
			flex: 1;
		}
	}

	/* Desktop (viewport ≥1024px): the balanced 2×2 grid — two equal-tier vertical cards per row. */
	@media (min-width: 64rem) {
		.ext-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-lg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ext-card__cta {
			transition: none;
		}
	}
</style>
