<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '$lib/sanity/image';
	import type { InsightFigurePairBlock, InsightFigurePairItem } from '$lib/insights/types';

	let {
		portableText
	}: { portableText: CustomBlockComponentProps<InsightFigurePairBlock> } = $props();

	// Exactly two by schema, but guard anyway: an under-filled draft renders whatever it has
	// rather than throwing, and a lone survivor still shows as a single plate.
	const items = $derived((portableText.value.items ?? []).filter((item): item is InsightFigurePairItem => Boolean(item?.image)));

	// Each column is ~half the 44rem measure on desktop; request candidates for that, not the
	// full-width figure's. The CSS frame does the 3:2 crop (object-fit: cover), so the URL stays
	// uncropped (fit: max) and no image is ever distorted — only centred and trimmed to the shared
	// ratio, which is what keeps the pair equal-height.
	const view = $derived(
		items.map((item) => ({
			key: item._key,
			src: buildPublicImageUrl(item.image, { width: 1200, fit: 'max', quality: 82 }),
			srcset: buildImageSrcset(item.image, [480, 640, 900, 1200], { fit: 'max', quality: 82 }),
			lqip: getImagePlaceholder(item.image),
			alt: item.image?.altText?.trim() ?? '',
			caption: item.caption?.trim() || null,
			linkLabel: item.linkLabel?.trim() || null,
			linkHref: item.linkHref?.trim() || null
		}))
	);
</script>

{#if view.length > 0}
	<!-- A dedicated two-up module, not two adjacent figures: the layout itself says "read these
	     against each other". Source order is the DOM order, so keyboard and reading order match the
	     visual left-to-right / top-to-bottom on every width. -->
	<div class="figure-pair" class:figure-pair--single={view.length === 1}>
		{#each view as col (col.key)}
			<figure class="figure-pair__item">
				<div
					class="figure-pair__frame"
					style:background-image={col.lqip ? `url(${col.lqip})` : undefined}
				>
					{#if col.src}
						<img
							src={col.src}
							srcset={col.srcset || undefined}
							sizes="(max-width: 55.99rem) 100vw, 21rem"
							alt={col.alt}
							loading="lazy"
							decoding="async"
						/>
					{/if}
				</div>
				{#if col.caption || col.linkLabel}
					<figcaption class="figure-pair__label">
						{#if col.caption}
							<span class="figure-pair__caption">{col.caption}</span>
						{/if}
						{#if col.linkLabel && col.linkHref}
							<a class="figure-pair__link" href={col.linkHref}
								>{col.linkLabel}<span class="figure-pair__arrow" aria-hidden="true">&nbsp;→</span></a
							>
						{/if}
					</figcaption>
				{/if}
			</figure>
		{/each}
	</div>
{/if}

<style>
	/* The same matted-plate idiom as the single figure and the article hero, set two-up. The
	   asymmetric outer margin matches InsightFigure so a pair sits in the prose rhythm identically
	   to a lone figure. */
	.figure-pair {
		display: grid;
		gap: clamp(1rem, 0.4rem + 2.4vw, 2rem);
		margin: var(--space-xl) 0 var(--space-lg);
	}

	/* Two equal columns from the point the prose column is wide enough to halve without the
	   captions crowding; below that they stack in source order. A lone survivor never stretches
	   to full width awkwardly — it keeps a figure's proportions. */
	@media (min-width: 56rem) {
		.figure-pair {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}

		.figure-pair--single {
			grid-template-columns: minmax(0, 32rem);
		}
	}

	.figure-pair__item {
		margin: 0;
		min-width: 0;
		border: 1px solid var(--border);
		background: var(--white);
		display: flex;
		flex-direction: column;
	}

	/* A shared 3:2 crop for both columns — the site's property-card ratio — so the two images read
	   as an equal pair whatever their source ratios (one is square, one 16:9). object-fit: cover
	   centres and trims; it never distorts. */
	.figure-pair__frame {
		aspect-ratio: 3 / 2;
		overflow: hidden;
		background-color: var(--green);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.figure-pair__frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Caption and property link share one label block under a single hairline — no second rule
	   between them (that would read as a divider inside one plate). The link is bound to its own
	   image because it lives inside that image's figure. */
	.figure-pair__label {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.8rem 0.9rem 0.85rem;
		border-block-start: 1px solid var(--border);
	}

	.figure-pair__caption {
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.55;
		color: var(--muted);
	}

	/* The property link: the site's text-link idiom — green at rest, gold on hover, the arrow
	   sliding right. Set a step down in size from the caption so the plate closes on the action
	   without shouting. */
	/* Inline (not flex) so the trailing arrow flows after the last word even when the label wraps
	   to two lines — a flex arrow would detach and float beside the wrapped text. The nbsp before
	   the arrow keeps "…International →" from breaking across a line. */
	.figure-pair__link {
		align-self: flex-start;
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.4;
		font-weight: 500;
		color: var(--green);
		text-decoration: none;
	}

	.figure-pair__arrow {
		display: inline-block;
		white-space: nowrap;
		transition: transform var(--duration-hover) var(--ease);
	}

	.figure-pair__link:hover,
	.figure-pair__link:focus-visible {
		color: var(--gold);
	}

	.figure-pair__link:hover .figure-pair__arrow,
	.figure-pair__link:focus-visible .figure-pair__arrow {
		transform: translateX(3px);
	}

	.figure-pair__link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.figure-pair__arrow {
			transition: none;
		}
	}
</style>
