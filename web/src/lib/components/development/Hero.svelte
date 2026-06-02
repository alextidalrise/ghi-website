<script lang="ts">
	import { buildPublicImageUrl } from '$lib/sanity/image';
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import { formatListingPrice } from '$lib/listing/formatPrice';
	import { formatEnumLabel, shouldShowDevelopmentPricing } from '$lib/listing/developmentDisplay';

	type Props = {
		development: PublicDevelopment;
	};

	let { development }: Props = $props();

	const heroImage = $derived(development.media?.heroImage ?? development.media?.thumbnailOverride);
	const heroUrl = $derived(
		buildPublicImageUrl(heroImage, { width: 1920, height: 900, fit: 'crop', quality: 85 })
	);
	const headline = $derived(development.content?.heroHeadline ?? development.title);
	const overline = $derived(
		[development.location?.community?.name, development.location?.country?.name]
			.filter(Boolean)
			.join(', ')
	);
	const showPricing = $derived(shouldShowDevelopmentPricing(development.developmentDisplayMode));
	const priceLabel = $derived(showPricing ? formatListingPrice(development.pricing) : null);
	const statusLabel = $derived(formatEnumLabel(development.developmentStatus));
</script>

<header class="hero" class:hero--no-image={!heroUrl}>
	{#if heroUrl}
		<div class="hero__media">
			<img
				src={heroUrl}
				alt={heroImage?.altText ?? development.title ?? 'Development hero'}
				width="1920"
				height="900"
				fetchpriority="high"
				decoding="async"
			/>
			<div class="hero__scrim" aria-hidden="true"></div>
		</div>
	{/if}

	<div class="hero__content content-wrap">
		{#if overline}
			<p class="hero__overline text-overline">{overline}</p>
		{/if}
		<h1 class="hero__title">{headline}</h1>
		{#if development.content?.shortDescription}
			<p class="hero__summary">{development.content.shortDescription}</p>
		{/if}
		<div class="hero__meta">
			<span>New development</span>
			{#if statusLabel}
				<span>{statusLabel}</span>
			{/if}
			{#if priceLabel}
				<span class="hero__price tabular-nums">{priceLabel}</span>
			{/if}
		</div>
	</div>
</header>

<style>
	.hero {
		position: relative;
		min-height: clamp(22rem, 55vh, 36rem);
		display: flex;
		align-items: flex-end;
		background: var(--hero-dark);
		color: var(--white);
	}

	.hero--no-image {
		background: linear-gradient(145deg, var(--green-deep) 0%, var(--hero-dark) 100%);
		min-height: clamp(18rem, 40vh, 28rem);
	}

	.hero__media {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.hero__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero__scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to top,
			rgba(14, 20, 16, 0.92) 0%,
			rgba(14, 20, 16, 0.45) 45%,
			rgba(14, 20, 16, 0.15) 100%
		);
	}

	.hero__content {
		position: relative;
		width: 100%;
		padding-block: var(--space-xl) var(--space-lg);
	}

	.hero__overline {
		margin-bottom: var(--space-sm);
		color: var(--gold);
	}

	.hero__title {
		font-family: var(--serif);
		font-size: clamp(2rem, 4vw + 0.5rem, 3.25rem);
		font-weight: 600;
		line-height: 1.08;
		letter-spacing: var(--tracking-tight);
		color: var(--white);
		max-width: 18ch;
		margin-bottom: var(--space-sm);
	}

	.hero__summary {
		font-size: var(--text-ui);
		line-height: 1.65;
		color: rgba(255, 255, 255, 0.82);
		max-width: 42rem;
		margin-bottom: var(--space-md);
	}

	.hero__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.25rem;
		font-size: var(--text-small);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: rgba(255, 255, 255, 0.72);
	}

	.hero__meta span:not(:last-child)::after {
		content: '';
		display: inline-block;
		width: 3px;
		height: 3px;
		background: var(--gold);
		border-radius: 50%;
		margin-left: 1.25rem;
		vertical-align: middle;
	}

	.hero__price {
		color: var(--gold);
		font-weight: 500;
	}

	.hero__price::after {
		display: none !important;
	}
</style>
