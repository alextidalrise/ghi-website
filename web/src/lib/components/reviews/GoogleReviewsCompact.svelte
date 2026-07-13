<script lang="ts">
	import { shouldShowAggregate } from '$lib/reviews/gates';
	import type { ReviewsData } from '$lib/reviews';
	import GoogleMark from './GoogleMark.svelte';
	import ReviewPanel from './ReviewPanel.svelte';
	import Stars from './Stars.svelte';

	type Props = {
		data: ReviewsData | null;
		heading?: string;
		/**
		 * The section opens with a hairline by default, because it usually follows plain
		 * content that provides no divider of its own. Set false where the content above
		 * already closes with a rule — the About page's team list ends on one deliberately,
		 * and two rules with a gap between them read as a mistake, not a bracket.
		 */
		divider?: boolean;
	};

	let { data, heading = 'What our buyers say', divider = true }: Props = $props();

	const showAggregate = $derived(data ? shouldShowAggregate(data) : false);

	/** Two is the whole point of the compact variant. This sits beneath an enquiry form on
	    a property page; a rail of nine would pull attention off the thing that earns. */
	const shown = $derived(data ? data.reviews.slice(0, 2) : []);
</script>

{#if data}
	<!-- Deliberately the quietest thing on the page: a single hairline above, no frame, no
	     fill, no rail. Emphasis Ladder tier 1–2. It reassures somebody who has already
	     decided to read the form; it must never compete with it. -->
	<section
		class="compact"
		class:compact--undivided={!divider}
		aria-labelledby="compact-reviews-heading"
	>
		<div class="compact__bar">
			<h2 id="compact-reviews-heading" class="compact__title">{heading}</h2>

			{#if showAggregate}
				<p class="compact__score">
					<Stars rating={data.averageRating} label="{data.averageRating} out of 5" />
					<span class="compact__figure">{data.averageRating.toFixed(1)}</span>
					<span class="compact__count">
						<GoogleMark size={13} />
						{data.totalCount} reviews on Google
					</span>
				</p>
			{/if}
		</div>

		<ul class="compact__quotes">
			{#each shown as review (review.id)}
				<li class="compact__quote">
					<ReviewPanel {review} bare lines={5} />
				</li>
			{/each}
		</ul>

		{#if data.reviewsUrl}
			<a class="compact__all" href={data.reviewsUrl} target="_blank" rel="noopener noreferrer">
				Read all reviews
				<svg width="18" height="9" viewBox="0 0 18 9" fill="none" aria-hidden="true">
					<path d="M0 4.5h15.5M12 1l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.25" />
				</svg>
			</a>
		{/if}
	</section>
{/if}

<style>
	.compact {
		margin-top: var(--space-2xl);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border);
	}

	/* No rule of our own: the section above already closed with one, and that rule is now
	   the divider. The padding goes too — it was only ever the rule's breathing room, and
	   the margin above is separation enough. */
	.compact--undivided {
		padding-top: 0;
		border-top: none;
	}

	.compact__bar {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.compact__title {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h3);
		color: var(--green);
	}

	.compact__score {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
		font-feature-settings: 'tnum';
	}

	.compact__figure {
		font-family: var(--serif);
		font-size: 1.125rem;
		color: var(--green);
	}

	.compact__count {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	/* Two quotes side by side, split by a hairline rather than boxed. Grid (not flex): the
	   columns are equal by definition and the divider lands on the gap. */
	.compact__quotes {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-lg);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 720px) {
		.compact__quotes {
			grid-template-columns: 1fr 1fr;
			gap: clamp(1.5rem, 1rem + 2vw, 2.5rem);
		}

		.compact__quote + .compact__quote {
			padding-left: clamp(1.5rem, 1rem + 2vw, 2.5rem);
			border-left: 1px solid var(--border);
		}
	}

	.compact__all {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.compact__all svg {
		transition: transform var(--duration-hover) var(--ease);
	}

	.compact__all:hover,
	.compact__all:focus-visible {
		color: var(--gold);
	}

	.compact__all:hover svg,
	.compact__all:focus-visible svg {
		transform: translateX(4px);
	}

	@media (prefers-reduced-motion: reduce) {
		.compact__all:hover svg,
		.compact__all:focus-visible svg {
			transform: none;
		}
	}
</style>
