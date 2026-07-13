<script lang="ts">
	import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '$lib/sanity/image';
	import { insightPath } from '$lib/insights/routes';
	import { insightKickerLabel } from '$lib/insights/categories';
	import { formatInsightDate, insightDateISO, readingLabel } from '$lib/insights/format';
	import type { InsightCard } from '$lib/insights/types';
	import InsightKicker from './InsightKicker.svelte';
	import InsightMeta from './InsightMeta.svelte';

	/** The lead article at the top of the index — a larger, asymmetric editorial block. */
	let { card }: { card: InsightCard } = $props();

	const href = $derived(card.slug ? insightPath(card.slug) : '#');
	const image = $derived(
		buildPublicImageUrl(card.heroImage, { width: 1120, height: 840, fit: 'crop', quality: 82 })
	);
	const srcset = $derived(
		buildImageSrcset(card.heroImage, [640, 900, 1120, 1440], { height: 840, fit: 'crop', quality: 82 })
	);
	const lqip = $derived(getImagePlaceholder(card.heroImage));
	const alt = $derived(card.heroImage?.altText?.trim() || card.title || 'Featured insight');
	const kicker = $derived(insightKickerLabel(card.insightCategory));
	const dateLabel = $derived(formatInsightDate(card.publishedAt, 'long'));
	const dateISO = $derived(insightDateISO(card.publishedAt));
	const reading = $derived(readingLabel(card));
</script>

<article class="insight-featured">
	<a class="insight-featured__link" {href}>
		<div class="insight-featured__text">
			<InsightKicker label={kicker} />
			<h2 class="insight-featured__title">{card.title}</h2>
			{#if card.subhead}
				<p class="insight-featured__subhead">{card.subhead}</p>
			{/if}
			<InsightMeta author={card.author} {dateISO} {dateLabel} {reading} withAvatar />
			<span class="insight-featured__cta" aria-hidden="true">
				Read the article<span class="insight-featured__arrow">→</span>
			</span>
		</div>

		<div class="insight-featured__media" style:background-image={lqip ? `url(${lqip})` : undefined}>
			{#if image}
				<img
					src={image}
					srcset={srcset || undefined}
					sizes="(max-width: 52rem) 100vw, 52vw"
					{alt}
					width="1120"
					height="840"
					loading="eager"
					fetchpriority="high"
					decoding="async"
				/>
			{/if}
		</div>
	</a>
</article>

<style>
	.insight-featured {
		padding-bottom: var(--space-2xl);
		margin-bottom: var(--space-2xl);
		border-bottom: 1px solid var(--border);
	}

	.insight-featured__link {
		display: grid;
		gap: clamp(1.5rem, 4vw, 3.5rem);
		align-items: center;
		text-decoration: none;
		color: inherit;
	}

	.insight-featured__text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-md);
		min-width: 0;
	}

	.insight-featured__title {
		font-size: clamp(1.9rem, 1.1rem + 2.6vw, 3rem);
		line-height: 1.06;
		letter-spacing: var(--tracking-tight);
		text-wrap: balance;
		transition: color var(--duration-hover) var(--ease);
	}

	.insight-featured__subhead {
		font-family: var(--sans);
		font-size: clamp(1.0625rem, 0.95rem + 0.4vw, 1.2rem);
		font-weight: 300;
		line-height: 1.65;
		color: var(--charcoal);
		max-width: 46ch;
		text-wrap: pretty;
	}

	.insight-featured__cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
	}

	.insight-featured__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.insight-featured__media {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border: 1px solid var(--border);
		background: var(--green);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.insight-featured__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.insight-featured__link:hover .insight-featured__title,
	.insight-featured__link:focus-visible .insight-featured__title {
		color: var(--gold);
	}

	.insight-featured__link:hover .insight-featured__arrow,
	.insight-featured__link:focus-visible .insight-featured__arrow {
		transform: translateX(4px);
	}

	.insight-featured__link:hover .insight-featured__media img,
	.insight-featured__link:focus-visible .insight-featured__media img {
		transform: scale(1.03);
	}

	/* Text left, image right from tablet up; stacked (image first) on phones. */
	@media (min-width: 52rem) {
		.insight-featured__link {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
		}
	}

	@media (max-width: 51.999rem) {
		.insight-featured__link {
			display: flex;
			flex-direction: column-reverse;
		}

		.insight-featured__media {
			width: 100%;
			aspect-ratio: 16 / 10;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.insight-featured__title,
		.insight-featured__arrow,
		.insight-featured__media img {
			transition: none;
		}

		.insight-featured__link:hover .insight-featured__media img,
		.insight-featured__link:focus-visible .insight-featured__media img {
			transform: none;
		}
	}
</style>
