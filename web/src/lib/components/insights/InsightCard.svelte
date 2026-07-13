<script lang="ts">
	import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '$lib/sanity/image';
	import { insightPath } from '$lib/insights/routes';
	import { insightKickerLabel } from '$lib/insights/categories';
	import { formatInsightDate, insightDateISO, readingLabel } from '$lib/insights/format';
	import type { InsightCard } from '$lib/insights/types';
	import InsightKicker from './InsightKicker.svelte';
	import InsightMeta from './InsightMeta.svelte';

	let { card }: { card: InsightCard } = $props();

	const href = $derived(card.slug ? insightPath(card.slug) : '#');
	const image = $derived(
		buildPublicImageUrl(card.heroImage, { width: 720, height: 480, fit: 'crop', quality: 82 })
	);
	const srcset = $derived(
		buildImageSrcset(card.heroImage, [400, 600, 800], { height: 533, fit: 'crop', quality: 82 })
	);
	const lqip = $derived(getImagePlaceholder(card.heroImage));
	const alt = $derived(card.heroImage?.altText?.trim() || card.title || 'Insight');
	const kicker = $derived(insightKickerLabel(card.insightCategory));
	const dateLabel = $derived(formatInsightDate(card.publishedAt, 'short'));
	const dateISO = $derived(insightDateISO(card.publishedAt));
	const reading = $derived(readingLabel(card));
</script>

<article class="insight-card">
	<a class="insight-card__link" {href}>
		<div class="insight-card__media" style:background-image={lqip ? `url(${lqip})` : undefined}>
			{#if image}
				<img
					src={image}
					srcset={srcset || undefined}
					sizes="(max-width: 34rem) 100vw, (max-width: 64rem) 45vw, 22rem"
					{alt}
					width="720"
					height="480"
					loading="lazy"
					decoding="async"
				/>
			{/if}
		</div>

		<div class="insight-card__body">
			<InsightKicker label={kicker} />
			<h3 class="insight-card__title">{card.title}</h3>
			{#if card.subhead}
				<p class="insight-card__subhead">{card.subhead}</p>
			{/if}

			<div class="insight-card__foot">
				<InsightMeta author={card.author} {dateISO} {dateLabel} {reading} />
				<span class="insight-card__cta" aria-hidden="true">
					Read<span class="insight-card__arrow">→</span>
				</span>
			</div>
		</div>
	</a>
</article>

<style>
	.insight-card {
		height: 100%;
	}

	.insight-card__link {
		display: flex;
		flex-direction: column;
		height: 100%;
		text-decoration: none;
		color: inherit;
		background: var(--white);
		border: 1px solid var(--border);
		transition:
			transform var(--duration-lift) var(--ease),
			border-color var(--duration-hover) var(--ease),
			box-shadow var(--duration-lift) var(--ease);
	}

	.insight-card__media {
		aspect-ratio: 3 / 2;
		overflow: hidden;
		background: var(--green);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.insight-card__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.insight-card__body {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		flex: 1;
		padding: var(--space-md);
	}

	.insight-card__title {
		font-size: var(--text-h3);
		transition: color var(--duration-hover) var(--ease);
	}

	.insight-card__subhead {
		font-family: var(--sans);
		font-size: var(--text-body);
		font-weight: 300;
		line-height: 1.6;
		color: var(--muted);
		text-wrap: pretty;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.insight-card__foot {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-top: auto;
		padding-top: var(--space-sm);
		border-top: 1px solid var(--border);
	}

	.insight-card__cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		white-space: nowrap;
	}

	.insight-card__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	/* Hover / focus lift — the whole card is the target. */
	.insight-card__link:hover,
	.insight-card__link:focus-visible {
		transform: translateY(-6px);
		border-color: var(--green);
		box-shadow: 0 18px 40px -28px rgba(31, 61, 52, 0.5);
	}

	.insight-card__link:hover .insight-card__media img,
	.insight-card__link:focus-visible .insight-card__media img {
		transform: scale(1.04);
	}

	.insight-card__link:hover .insight-card__title,
	.insight-card__link:focus-visible .insight-card__title {
		color: var(--gold);
	}

	.insight-card__link:hover .insight-card__arrow,
	.insight-card__link:focus-visible .insight-card__arrow {
		transform: translateX(3px);
	}

	@media (prefers-reduced-motion: reduce) {
		.insight-card__link,
		.insight-card__media img,
		.insight-card__title,
		.insight-card__arrow {
			transition: none;
		}

		.insight-card__link:hover,
		.insight-card__link:focus-visible {
			transform: none;
		}

		.insight-card__link:hover .insight-card__media img,
		.insight-card__link:focus-visible .insight-card__media img {
			transform: none;
		}
	}
</style>
