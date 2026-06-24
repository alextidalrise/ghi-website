<script lang="ts">
	import type { FeaturedLocationCard } from '$lib/sanity/transforms/taxonomyHero';

	type Props = {
		locations: FeaturedLocationCard[];
		heading?: string;
		summary?: string;
		/** Columns in the desktop grid. Cards shrink to fit; the rail is used below. */
		columns?: number;
	};

	let {
		locations,
		heading = 'Featured locations',
		summary = 'Ten destinations across Spain and Portugal.',
		columns = 3
	}: Props = $props();
</script>

{#if locations.length > 0}
	<section class="featured-locations" aria-labelledby="locations-heading">
		<div class="featured-locations__head">
			<h2 id="locations-heading">{heading}</h2>
			{#if summary}
				<p class="featured-locations__summary">{summary}</p>
			{/if}
		</div>

		<!-- Grid of `columns` per row on desktop; a single swipeable rail on phones. -->
		<ul class="featured-locations__grid" style="--columns: {columns}">
			{#each locations as location, index (location.href)}
				<li class="location-tile" style="--reveal-delay: {index * 70}ms">
					<a class="location-tile__link" href={location.href}>
						<span class="location-tile__media">
							<img
								src={location.image}
								alt={location.alt}
								width="600"
								height="800"
								loading="lazy"
							/>
							<span class="location-tile__scrim" aria-hidden="true"></span>
						</span>
						<span class="location-tile__body">
							<span class="location-tile__country">{location.countryLabel}</span>
							<span class="location-tile__name">{location.name}</span>
							<span class="location-tile__cue">
								{#if location.tagline}
									<span class="location-tile__tagline">{location.tagline}</span>
								{/if}
								<svg
									class="location-tile__arrow"
									width="18"
									height="9"
									viewBox="0 0 18 9"
									fill="none"
									aria-hidden="true"
								>
									<path d="M0 4.5h15.5M12 1l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.25" />
								</svg>
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.featured-locations {
		min-width: 0;
	}

	.featured-locations__head {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
	}

	.featured-locations__summary {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	/* Desktop: a fixed number of columns; cards shrink to fit. */
	.featured-locations__grid {
		display: grid;
		grid-template-columns: repeat(var(--columns, 3), minmax(0, 1fr));
		gap: var(--space-md);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.location-tile {
		min-width: 0;
	}

	.location-tile__link {
		position: relative;
		display: block;
		height: 100%;
		border: 1px solid var(--border);
		color: var(--on-green);
		text-decoration: none;
		isolation: isolate;
		overflow: hidden;
	}

	.location-tile__media {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.location-tile__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.location-tile__scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to top,
			oklch(0.18 0.03 165 / 0.85) 0%,
			oklch(0.18 0.03 165 / 0.5) 34%,
			oklch(0.18 0.03 165 / 0.08) 68%
		);
	}

	.location-tile__body {
		position: relative;
		z-index: 1;
		/* The body's aspect ratio sets the tile height; the media fills behind it. */
		aspect-ratio: 4 / 5;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: var(--space-xs);
		padding: var(--space-md);
	}

	.location-tile__country {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	.location-tile__name {
		font-family: var(--serif);
		font-size: var(--text-h3);
		font-weight: 400;
		line-height: 1.1;
	}

	.location-tile__cue {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: 0.125rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 350;
		color: oklch(0.92 0.02 85 / 0.92);
	}

	.location-tile__tagline {
		min-width: 0;
	}

	.location-tile__arrow {
		flex-shrink: 0;
		color: var(--gold);
		transition: transform var(--duration-hover) var(--ease);
	}

	.location-tile__link:hover .location-tile__media img,
	.location-tile__link:focus-visible .location-tile__media img {
		transform: scale(1.05);
	}

	.location-tile__link:hover .location-tile__arrow,
	.location-tile__link:focus-visible .location-tile__arrow {
		transform: translateX(4px);
	}

	.location-tile__link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* Phones & tablets: collapse the grid into one swipeable rail so ten tiles cost one
	   row of vertical space instead of ten — and avoid cramming five tiles into a narrow
	   width. Full-bleed to the viewport edge so the next tile peeks in, signalling that
	   the row scrolls. No JS — native scroll-snap only. */
	@media (max-width: 1023px) {
		.featured-locations__grid {
			grid-auto-flow: column;
			grid-template-columns: none;
			grid-auto-columns: clamp(14rem, 72vw, 18.5rem);
			gap: var(--space-md);
			margin-inline: calc(-1 * var(--content-padding));
			padding-inline: var(--content-padding);
			min-width: 0;
			max-width: 100%;
			overflow-x: auto;
			overflow-y: hidden;
			scroll-snap-type: x mandatory;
			scroll-padding-inline-start: var(--content-padding);
			-webkit-overflow-scrolling: touch;
			overscroll-behavior-x: contain;
			touch-action: pan-x pan-y pinch-zoom;
			scrollbar-width: none;
			/* Breathing room so the focus ring isn't clipped by overflow. */
			padding-block: 0.375rem;
		}

		.featured-locations__grid::-webkit-scrollbar {
			display: none;
		}

		.location-tile {
			scroll-snap-align: start;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.location-tile {
			opacity: 0;
			transform: translateY(16px);
			animation: location-reveal 0.6s var(--ease) forwards;
			animation-delay: var(--reveal-delay, 0ms);
		}

		@keyframes location-reveal {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
