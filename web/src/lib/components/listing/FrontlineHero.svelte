<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import type { FrontlineHeroImage } from '$lib/sanity/transforms/frontlineHero';

	type Props = {
		eyebrow: string;
		/** Wrap a phrase in *asterisks* to render it italic. */
		headline: string;
		lead: string;
		image: FrontlineHeroImage | null;
		breadcrumbs?: BreadcrumbItem[];
		ctaHref?: string;
		ctaLabel?: string;
	};

	let { eyebrow, headline, lead, image, breadcrumbs, ctaHref, ctaLabel }: Props = $props();

	// Split on `*` so emphasised phrases render as <em> without dangerouslySetHTML.
	const headlineParts = $derived(
		headline.split('*').map((text, index) => ({ text, italic: index % 2 === 1 }))
	);
</script>

<section class="fh on-dark" class:fh--has-media={image} aria-labelledby="frontline-hero-heading">
	<div class="fh__content">
		{#if breadcrumbs && breadcrumbs.length > 0}
			<div class="fh__crumbs">
				<Breadcrumbs items={breadcrumbs} onDark />
			</div>
		{/if}

		<p class="fh__marker">
			<span class="fh__diamond" aria-hidden="true"></span>
			{eyebrow}
		</p>

		<h1 id="frontline-hero-heading" class="fh__title">
			{#each headlineParts as part, i (i)}{#if part.italic}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
		</h1>

		<p class="fh__lead">{lead}</p>

		{#if ctaHref && ctaLabel}
			<a class="fh__cta" href={ctaHref}>
				{ctaLabel}
				<span aria-hidden="true">↓</span>
			</a>
		{/if}
	</div>

	{#if image}
		<div
			class="fh__media"
			style:background-image={image.lqip ? `url(${image.lqip})` : undefined}
		>
			<img
				src={image.url}
				srcset={image.srcset || undefined}
				sizes="(max-width: 54rem) 100vw, 50vw"
				alt={image.alt}
				width="1600"
				height="1400"
				fetchpriority="high"
				decoding="async"
			/>
		</div>
	{/if}
</section>

<style>
	.fh {
		/* Full-bleed green band: the page's single tier-4 emphasis surface. */
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		color: var(--on-green);
		/* Depth, not a flat slab — soft light from top-left, deepening to the base.
		   Shared recipe with the frontline rail so the brand's green reads as one colour. */
		background:
			radial-gradient(120% 90% at 12% -10%, oklch(0.37 0.05 165) 0%, transparent 55%),
			linear-gradient(180deg, oklch(0.31 0.035 165) 0%, oklch(0.24 0.03 165) 100%);
		border-bottom: 1px solid oklch(0.82 0.05 85 / 0.28);
	}

	/* Two-up only when there's a photograph to balance the text. */
	.fh--has-media {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: stretch;
	}

	.fh__content {
		align-self: center;
		padding-block: clamp(3rem, 7vw, 6rem);
		/* Align the text's leading edge to the results grid below (1280px, centred),
		   never tighter than the page gutter. The 50/50 split bounds the text width, so
		   no max-width is needed here — and a max-width would fight this start padding on
		   ultra-wide screens, collapsing the text column. */
		padding-inline-start: max(var(--content-padding), calc((100vw - 1280px) / 2));
		padding-inline-end: var(--content-padding);
	}

	/* Single-column hero (no image): centre the content in the page column. */
	.fh:not(.fh--has-media) .fh__content {
		margin-inline: auto;
		padding-inline: var(--content-padding);
		max-width: calc(40rem + 2 * var(--content-padding));
	}

	.fh__crumbs {
		margin-bottom: var(--space-lg);
	}

	.fh__marker {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: var(--space-md);
		padding: 0.4rem 0.8rem;
		background: var(--gold);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 600;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
	}

	.fh__diamond {
		width: 6px;
		height: 6px;
		background: currentColor;
		transform: rotate(45deg);
	}

	.fh__title {
		color: var(--on-green);
		margin-bottom: var(--space-md);
		text-wrap: balance;
	}

	.fh__title :global(em) {
		font-style: italic;
		font-weight: 600;
	}

	.fh__lead {
		font-family: var(--sans);
		font-size: 1.125rem;
		font-weight: 350;
		line-height: 1.7;
		letter-spacing: 0.01em;
		color: oklch(0.9 0.018 90 / 0.92);
		max-width: 34rem;
		text-wrap: pretty;
	}

	.fh__cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-lg);
		padding: 0.9rem 1.85rem;
		background: var(--gold);
		color: var(--green);
		border: 1px solid var(--gold);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.fh__cta span {
		transition: transform var(--duration-hover) var(--ease);
	}

	.fh__cta:hover,
	.fh__cta:focus-visible {
		background: transparent;
		color: var(--on-green);
		border-color: oklch(0.82 0.05 85 / 0.6);
	}

	.fh__cta:hover span,
	.fh__cta:focus-visible span {
		transform: translateY(3px);
	}

	.fh__cta:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.fh__media {
		position: relative;
		min-height: 100%;
		/* Hold a generous frame on very tall content so the image never collapses. */
		min-block-size: clamp(20rem, 38vw, 32rem);
		/* Blurred LQIP shows through until the hero photo paints over it. */
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.fh__media img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	/* Stack below the two-up breakpoint: content first, photograph as a full-width strip. */
	@media (max-width: 54rem) {
		.fh--has-media {
			grid-template-columns: minmax(0, 1fr);
		}

		.fh__content {
			padding-inline: var(--content-padding);
			max-width: none;
		}

		.fh__media {
			min-block-size: 0;
			aspect-ratio: 16 / 10;
		}

		.fh__media img {
			position: static;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fh__cta,
		.fh__cta span {
			transition: none;
		}
		.fh__cta:hover span,
		.fh__cta:focus-visible span {
			transform: none;
		}
	}
</style>
