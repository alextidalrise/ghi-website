<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';

	type Props = {
		image: string;
		alt: string;
		srcset?: string;
		sizes?: string;
		lead?: string;
		/** Breadcrumbs laid over the top of the hero photograph. */
		breadcrumbs?: BreadcrumbItem[];
		/** In-page CTA. Both must be set for the button to render. */
		ctaHref?: string;
		ctaLabel?: string;
		/** Less bottom padding when nothing bridges below the hero (e.g. no discovery bar). */
		compact?: boolean;
		fetchpriority?: 'high' | 'low' | 'auto';
		title: Snippet;
	};

	let {
		image,
		alt,
		srcset,
		sizes = '100vw',
		lead,
		breadcrumbs,
		ctaHref,
		ctaLabel,
		compact = false,
		fetchpriority = 'auto',
		title
	}: Props = $props();
</script>

<section class="page-hero on-dark" class:page-hero--compact={compact}>
	<div class="page-hero__bg" aria-hidden="true">
		<img
			src={image}
			srcset={srcset || undefined}
			sizes={srcset ? sizes : undefined}
			{alt}
			width="1920"
			height="1080"
			{fetchpriority}
		/>
	</div>
	<div class="page-hero__overlay" aria-hidden="true"></div>

	{#if breadcrumbs && breadcrumbs.length > 0}
		<div class="page-hero__top">
			<Breadcrumbs items={breadcrumbs} onDark />
		</div>
	{/if}

	<div class="page-hero__content content-wrap">
		<h1 class="page-hero__title">
			{@render title()}
		</h1>
		{#if lead}
			<p class="page-hero__lead">{lead}</p>
		{/if}
		{#if ctaHref && ctaLabel}
			<a class="page-hero__cta" href={ctaHref}>{ctaLabel}</a>
		{/if}
	</div>
</section>

<style>
	.page-hero {
		position: relative;
		min-height: min(calc(100dvh - var(--nav-height)), 44rem);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.page-hero__bg {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.page-hero__bg img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 40%;
	}

	.page-hero__overlay {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				to right,
				oklch(0.22 0.03 165 / 0.62) 0%,
				oklch(0.22 0.03 165 / 0.38) 45%,
				oklch(0.22 0.03 165 / 0.15) 100%
			),
			linear-gradient(to top, oklch(0.22 0.03 165 / 0.4) 0%, transparent 42%);
		z-index: 1;
	}

	.page-hero__top {
		position: relative;
		z-index: 2;
		width: 100%;
	}

	.page-hero__content {
		position: relative;
		z-index: 2;
		width: 100%;
		/* Push the headline block to the foot of the hero; breadcrumbs hold the top. */
		margin-top: auto;
		padding-top: var(--hero-padding-y);
		padding-bottom: clamp(8rem, 15vh, 12rem);
	}

	.page-hero--compact .page-hero__content {
		padding-bottom: clamp(3rem, 8vh, 5rem);
	}

	.page-hero__title {
		color: var(--on-green);
		margin-bottom: var(--space-md);
	}

	.page-hero__title :global(em) {
		font-style: italic;
		font-weight: 600;
	}

	.page-hero__lead {
		font-family: var(--sans);
		font-size: 1.125rem;
		font-weight: 350;
		color: var(--on-green);
		max-width: 34rem;
		line-height: 1.7;
		letter-spacing: 0.01em;
	}

	.page-hero__cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
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

	.page-hero__cta:hover,
	.page-hero__cta:focus-visible {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.65);
	}

	@media (max-width: 600px) {
		.page-hero {
			min-height: min(calc(100dvh - var(--nav-height)), 38rem);
		}

		.page-hero__content {
			padding-bottom: 7.5rem;
		}

		.page-hero--compact .page-hero__content {
			padding-bottom: 3rem;
		}
	}
</style>
