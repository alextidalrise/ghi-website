<script lang="ts">
	import { buildImageSrcset, buildPublicImageUrl } from '$lib/sanity/image';
	import { guidePath } from '$lib/guides/routes';
	import type { GuideCard } from '$lib/guides/types';

	let { card }: { card: GuideCard } = $props();

	const href = $derived(card.slug ? guidePath(card.slug) : '#');
	const image = $derived(
		buildPublicImageUrl(card.heroImage, { width: 600, height: 450, fit: 'crop', quality: 82 })
	);
	const srcset = $derived(
		buildImageSrcset(card.heroImage, [320, 480, 640], { height: 360, fit: 'crop', quality: 82 })
	);
	const alt = $derived(card.heroImage?.altText?.trim() || card.title || 'Guide');
</script>

<a class="guide-card" {href}>
	{#if image}
		<div class="guide-card__media">
			<img
				src={image}
				srcset={srcset || undefined}
				sizes="(max-width: 40rem) 40vw, 12rem"
				{alt}
				width="600"
				height="450"
				loading="lazy"
				decoding="async"
			/>
		</div>
	{/if}

	<div class="guide-card__body">
		{#if card.audienceLabel}
			<span class="guide-card__chip">{card.audienceLabel}</span>
		{/if}
		<h3 class="guide-card__title">{card.title}</h3>
		{#if card.tagline}
			<p class="guide-card__tagline">{card.tagline}</p>
		{/if}
		<span class="guide-card__cta">
			Read guide
			<span class="guide-card__arrow" aria-hidden="true">→</span>
		</span>
	</div>
</a>

<style>
	.guide-card {
		display: flex;
		gap: clamp(1rem, 3vw, 2rem);
		align-items: center;
		text-decoration: none;
		color: inherit;
		padding-block: var(--space-lg);
	}

	.guide-card__media {
		flex-shrink: 0;
		width: clamp(7rem, 22vw, 12rem);
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: var(--green);
	}

	.guide-card__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.guide-card:hover .guide-card__media img,
	.guide-card:focus-visible .guide-card__media img {
		transform: scale(1.04);
	}

	.guide-card__body {
		min-width: 0;
	}

	.guide-card__chip {
		display: inline-block;
		margin-bottom: var(--space-sm);
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.guide-card__title {
		font-size: var(--text-h3);
		transition: color var(--duration-hover) var(--ease);
	}

	.guide-card:hover .guide-card__title,
	.guide-card:focus-visible .guide-card__title {
		color: var(--gold);
	}

	.guide-card__tagline {
		margin-top: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-body);
		color: var(--muted);
		max-width: 48ch;
	}

	.guide-card__cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
	}

	.guide-card__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.guide-card:hover .guide-card__arrow,
	.guide-card:focus-visible .guide-card__arrow {
		transform: translateX(3px);
	}

	@media (max-width: 34rem) {
		.guide-card {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-md);
		}

		.guide-card__media {
			width: 100%;
			aspect-ratio: 16 / 9;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.guide-card__media img,
		.guide-card__title,
		.guide-card__arrow {
			transition: none;
		}
	}
</style>
