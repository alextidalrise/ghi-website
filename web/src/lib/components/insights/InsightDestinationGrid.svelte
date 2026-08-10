<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightDestinationGridBlock } from '$lib/insights/types';
	import { buildImageSrcset } from '$lib/sanity/image';
	import { toInsightDestinationCards } from '$lib/sanity/transforms/insightDestinationCard';

	let {
		portableText
	}: { portableText: CustomBlockComponentProps<InsightDestinationGridBlock> } = $props();

	const heading = $derived(portableText.value.heading?.trim() || null);
	const cards = $derived(toInsightDestinationCards(portableText.value.items));

	// The panel media candidate widths, matched to the ~44% desktop column and full-width mobile.
	const SIZES = '(max-width: 52rem) 100vw, 24rem';
	const srcsetFor = (image: string, srcset: string) => srcset || image;
</script>

{#if cards.length > 0}
	<div class="destinations">
		{#if heading}
			<h3 class="destinations__heading">{heading}</h3>
		{/if}

		{#each cards as card (card.href)}
			<article class="destination">
				<figure class="destination__media">
					<!-- The whole image links, but it is hidden from the keyboard and screen readers: the
					     heading and the CTA below are the real, visibly-focusable targets to the same place,
					     so a keyboard user gets one stop per panel, not three. -->
					<a class="destination__media-link" href={card.href} tabindex="-1" aria-hidden="true">
						<img
							src={card.image}
							srcset={srcsetFor(card.image, card.srcset)}
							sizes={SIZES}
							alt={card.alt}
							loading="lazy"
							decoding="async"
						/>
					</a>
					{#if card.caption}
						<figcaption class="destination__caption">{card.caption}</figcaption>
					{/if}
				</figure>

				<div class="destination__copy">
					<h3 class="destination__name">
						<a href={card.href}>{card.name}</a>
					</h3>
					<p class="destination__body">{card.body}</p>
					<a class="destination__cta" href={card.href}>{card.actionLabel}</a>
				</div>
			</article>
		{/each}
	</div>
{/if}

<style>
	.destinations {
		margin-block: var(--space-lg);
	}

	.destinations__heading {
		font-size: var(--text-h3);
		margin-bottom: var(--space-lg);
	}

	/* One complete unit per place: image and copy in a hairline-framed panel, square corners. The
	   44/56 split gives the photograph presence while the copy keeps a comfortable measure. */
	.destination {
		display: grid;
		grid-template-columns: 1fr;
		border: 1px solid var(--border);
		background: var(--white);
	}

	.destination + .destination {
		margin-top: var(--space-lg);
	}

	.destination__media {
		position: relative;
		margin: 0;
		min-width: 0;
		overflow: hidden;
		/* Landscape plate on mobile; a fixed height takes over in the two-column layout. */
		aspect-ratio: 4 / 3;
	}

	.destination__media-link {
		display: block;
		width: 100%;
		height: 100%;
	}

	.destination__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Caption overlaid bottom-left in a small green tab — a plate label sitting on the image, the
	   same green-on-light idiom as the split hero caption. */
	.destination__caption {
		position: absolute;
		left: 0;
		bottom: 0;
		margin: 0;
		padding: 0.5rem 0.7rem;
		background: var(--green);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.4;
	}

	.destination__copy {
		align-self: center;
		min-width: 0;
		padding: clamp(1.6rem, 1rem + 2.4vw, 2.6rem);
	}

	.destination__name {
		font-family: var(--serif);
		font-size: clamp(1.7rem, 1.2rem + 1.6vw, 2.4rem);
		line-height: 1.12;
		margin: 0 0 var(--space-sm);
		color: var(--green);
	}

	.destination__name a {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: var(--border);
		text-underline-offset: 0.16em;
		text-decoration-thickness: 1px;
		transition: text-decoration-color var(--duration-hover) var(--ease);
	}

	.destination__name a:hover,
	.destination__name a:focus-visible {
		text-decoration-color: var(--gold);
	}

	.destination__name a:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.destination__body {
		margin: 0;
		max-width: 64ch;
		font-family: var(--sans);
		color: var(--charcoal);
	}

	/* Filled-green uppercase action — the compact, high-commitment CTA idiom used across the site. */
	.destination__cta {
		display: inline-block;
		margin-top: var(--space-md);
		padding: 0.75rem 1rem;
		background: var(--green);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		transition: background var(--duration-hover) var(--ease);
	}

	.destination__cta:hover {
		background: var(--deep, var(--charcoal));
	}

	.destination__cta:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* Two-column from the point the article column can hold a 44/56 split without crowding the copy.
	   The media takes a fixed height and the copy centres against it, so unequal body lengths still
	   read as an even set. */
	@media (min-width: 52rem) {
		.destination {
			grid-template-columns: 44% 56%;
		}

		.destination__media {
			aspect-ratio: auto;
			height: 360px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.destination__name a,
		.destination__cta {
			transition: none;
		}
	}
</style>
