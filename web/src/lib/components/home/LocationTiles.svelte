<script lang="ts">
	import type { FeaturedLocationCard } from '$lib/sanity/transforms/taxonomyHero';

	type Props = {
		locations: FeaturedLocationCard[];
		/** Hard cap on tiles per row in the desktop grid; the grid fills up to this many,
		    then wraps the remainder. Collapses to a rail on phones/tablets. */
		maxColumns?: number;
		/** Show the country overline above each name. On the homepage tiles are grouped
		    under a country header so this is off; the country page shows a flat list of one
		    country's locations and turns it on. */
		showCountry?: boolean;
	};

	let { locations, maxColumns = 4, showCountry = false }: Props = $props();

	// Columns per row on desktop. We fill up to `maxColumns` (4) per row and let the
	// remainder wrap, so six locations read as 4 + 2. The exception is an exact count of
	// four: a single flat row of four reads as a thin strip, so we pull it down to two
	// columns to form a balanced 2×2 block instead.
	const maxCols = $derived(locations.length === 4 ? 2 : maxColumns);
</script>

{#if locations.length > 0}
	<!-- Auto-filling grid, capped at `maxCols` per row on desktop; a single swipeable rail
	     on phones/tablets. Column count adapts to the location count so an exact four wraps
	     into a 2×2 and six read as 4 + 2 (see maxCols). -->
	<ul class="location-tiles" style="--max-cols: {maxCols}">
		{#each locations as location, index (location.href)}
			<li class="location-tile" style="--reveal-delay: {index * 70}ms">
				<a class="location-tile__link" href={location.href}>
					<span class="location-tile__media">
						<img src={location.image} alt={location.alt} width="600" height="800" loading="lazy" />
						<span class="location-tile__scrim" aria-hidden="true"></span>
					</span>
					<span class="location-tile__body">
						{#if showCountry}
							<span class="location-tile__country">{location.countryLabel}</span>
						{/if}
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
{/if}

<style>
	/* Desktop: a flex row that wraps at --max-cols per row. Each tile's flex-basis is an
	   exact 1/max-cols share, so a full row holds exactly --max-cols and the remainder
	   wraps; flex-grow then redistributes the leftover space on any incomplete row equally,
	   so a trailing 2-of-4 row becomes two double-width tiles (and a lone trailing tile
	   fills the row). Height is fixed per tile (--tile-h), decoupled from width, so the
	   wider trailing tiles stay the same height — the image just reveals more of itself. A
	   single swipeable rail takes over on phones/tablets. */
	.location-tiles {
		--min-tile: 13rem;
		--tile-h: clamp(16rem, 23vw, 19.5rem);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.location-tile {
		flex: 1 1
			calc((100% - (var(--max-cols, 4) - 1) * var(--space-md)) / var(--max-cols, 4));
		min-width: var(--min-tile);
		height: var(--tile-h);
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
		/* Desktop: fill the tile's fixed height (set on .location-tile); the media fills
		   behind it. On the mobile rail the body's aspect ratio sets the height instead. */
		height: 100%;
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

	/* Phones & tablets: collapse the grid into one swipeable rail so a set of tiles costs
	   one row of vertical space instead of many — and avoid cramming several tiles into a
	   narrow width. Full-bleed to the viewport edge so the next tile peeks in, signalling
	   that the row scrolls. No JS — native scroll-snap only. */
	@media (max-width: 1023px) {
		.location-tiles {
			display: grid;
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

		.location-tiles::-webkit-scrollbar {
			display: none;
		}

		.location-tile {
			/* Reset the desktop fixed sizing: on the rail, width comes from grid-auto-columns
			   and height from the body's aspect ratio. */
			flex: initial;
			min-width: 0;
			height: auto;
			scroll-snap-align: start;
		}

		.location-tile__body {
			height: auto;
			aspect-ratio: 4 / 5;
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
