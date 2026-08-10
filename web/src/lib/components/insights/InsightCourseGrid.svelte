<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightCourseGridBlock } from '$lib/insights/types';
	import { toInsightCourseCards } from '$lib/sanity/transforms/insightCourseCard';

	let {
		portableText
	}: { portableText: CustomBlockComponentProps<InsightCourseGridBlock> } = $props();

	const heading = $derived(portableText.value.heading?.trim() || null);
	const cards = $derived(toInsightCourseCards(portableText.value.items));

	// Two-column matrix on desktop, single column below; each cell is roughly half the measure.
	const SIZES = '(max-width: 44rem) 100vw, 22rem';
</script>

{#if cards.length > 0}
	<div class="courses">
		{#if heading}
			<h3 class="courses__heading">{heading}</h3>
		{/if}

		<div class="courses__grid">
			{#each cards as card (card._id)}
				<a class="course" href={card.href}>
					<div
						class="course__media"
						style:background-image={card.lqip ? `url(${card.lqip})` : undefined}
					>
						<img
							src={card.image}
							srcset={card.srcset || undefined}
							sizes={SIZES}
							alt={card.alt}
							loading="lazy"
							decoding="async"
						/>
						<div class="course__scrim"></div>
						<!-- The plate label sits over the image: name, destination, then a hairline and the
						     single next step. The whole card is the link, so the CTA is affordance, not a
						     second focus target. -->
						<div class="course__plate">
							<span class="course__name">{card.name}</span>
							{#if card.placeLabel}
								<span class="course__place">{card.placeLabel}</span>
							{/if}
							<span class="course__cta">
								{card.actionLabel}
								<span class="course__arrow" aria-hidden="true">→</span>
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
{/if}

<style>
	.courses {
		margin-block: var(--space-lg);
	}

	.courses__heading {
		font-size: var(--text-h3);
		margin-bottom: var(--space-lg);
	}

	.courses__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
	}

	/* Whole card is one link. The label plate is overlaid on the image, bottom-left. */
	.course {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.course__media {
		position: relative;
		aspect-ratio: 3 / 2;
		overflow: hidden;
		background-color: var(--green);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.course__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform var(--duration-image, 0.4s) var(--ease);
	}

	.course:hover .course__media img,
	.course:focus-visible .course__media img {
		transform: scale(1.03);
	}

	.course:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* A soft foot scrim so the green plate reads against any photograph. */
	.course__scrim {
		position: absolute;
		inset: 40% 0 0 0;
		background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.45));
		pointer-events: none;
	}

	.course__plate {
		position: absolute;
		left: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-width: min(88%, 22rem);
		padding: 0.85rem 1rem 0.95rem;
		background: var(--green);
		color: var(--on-green);
	}

	.course__name {
		font-family: var(--serif);
		font-size: 1.2rem;
		line-height: 1.2;
	}

	.course__place {
		font-family: var(--sans);
		font-size: var(--text-overline);
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		opacity: 0.85;
	}

	.course__cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.45rem;
		padding-top: 0.55rem;
		border-top: 1px solid rgba(255, 255, 255, 0.28);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
	}

	.course__arrow {
		color: var(--gold);
		transition: transform var(--duration-hover, 0.3s) var(--ease);
	}

	.course:hover .course__arrow,
	.course:focus-visible .course__arrow {
		transform: translateX(3px);
	}

	@media (min-width: 44rem) {
		.courses__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-lg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.course__media img,
		.course__arrow {
			transition: none;
		}
	}
</style>
