<script lang="ts">
	import type {
		CountryFeatureCard,
		FeaturedLocationCard
	} from '$lib/sanity/transforms/taxonomyHero';
	import CountryFlagArt from '$lib/components/CountryFlagArt.svelte';

	type Props = {
		countries: CountryFeatureCard[];
		locations: FeaturedLocationCard[];
		heading?: string;
		/** Hard cap on tiles per row in each country's desktop grid; the grid auto-fills up
		    to this many, then drops to fewer as the container narrows. Collapses to a rail on
		    phones/tablets. */
		maxColumns?: number;
	};

	let {
		countries,
		locations,
		heading = 'Explore by country',
		maxColumns = 4
	}: Props = $props();

	/** Country slug from the card href (`/spain` → `spain`). */
	function slugOf(href: string): string {
		return href.replace(/^\//, '').split('/')[0];
	}

	type CountryGroup = {
		country: CountryFeatureCard;
		slug: string;
		locations: FeaturedLocationCard[];
	};

	// Columns per row on desktop for a country's grid. We fill up to `maxColumns` (4) per
	// row and let the remainder wrap — so six locations read as 4 + 2. The exception is an
	// exact count of four: a single flat row of four reads as a thin strip, so we pull it
	// down to two columns to form a balanced 2×2 block instead.
	function columnsFor(count: number): number {
		return count === 4 ? 2 : maxColumns;
	}

	// The country is the spine: every country renders, with its featured locations slotted
	// beneath. A country with no featured locations yet (e.g. Portugal before its set is
	// attached) degrades to a header-only row — preserving the old "Explore by country"
	// entry — and gains its grid the moment editors populate it. Most-populated countries
	// lead, so the homepage opens on the content it actually has.
	let groups = $derived.by<CountryGroup[]>(() =>
		countries
			.map((country) => {
				const slug = slugOf(country.href);
				return {
					country,
					slug,
					locations: locations.filter((loc) => loc.countrySlug === slug)
				};
			})
			.sort(
				(a, b) =>
					b.locations.length - a.locations.length ||
					a.country.name.localeCompare(b.country.name)
			)
	);
</script>

<!-- Flag stamp resolution (crisp SVG + Spain/Portugal fallbacks + neutral field) is
     shared with the country hero via CountryFlagArt so the two surfaces never drift. -->
{#snippet flag(country: CountryFeatureCard)}
	<CountryFlagArt slug={slugOf(country.href)} flagUrl={country.flagUrl} />
{/snippet}

{#if groups.length > 0}
	<section class="destinations" aria-labelledby="destinations-heading">
		<h2 id="destinations-heading" class="destinations__heading">{heading}</h2>

		<div class="destinations__groups">
			{#each groups as group (group.slug)}
				<section class="country" aria-labelledby="country-{group.slug}">
					<!-- Country header — absorbs the old "Explore by country" row: a 1px-framed
					     flag stamp + name + tagline on the left (Emphasis Ladder tier 2), and the
					     "View all" link to the country page on the right. -->
					<div class="country__head">
						<div class="country__id">
							<span class="country__flag">{@render flag(group.country)}</span>
							<span class="country__text">
								<h3 class="country__name" id="country-{group.slug}">{group.country.name}</h3>
								{#if group.country.tagline}
									<span class="country__tagline">{group.country.tagline}</span>
								{/if}
							</span>
						</div>
						<a class="country__viewall" href={group.country.href}>
							<span>View all {group.country.name}</span>
							<svg viewBox="0 0 20 10" width="20" height="10" fill="none" aria-hidden="true">
								<path d="M0 5h18M14 1l4 4-4 4" stroke="currentColor" stroke-width="1.25" />
							</svg>
						</a>
					</div>

					{#if group.locations.length > 0}
						<!-- Auto-filling grid, capped at `maxColumns` per row on desktop; a single
						     swipeable rail on phones. Column count adapts to the location count so
						     an exact four wraps into a 2×2 (see columnsFor). -->
						<ul class="tiles" style="--max-cols: {columnsFor(group.locations.length)}">
							{#each group.locations as location, index (location.href)}
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
													<path
														d="M0 4.5h15.5M12 1l4 3.5-4 3.5"
														stroke="currentColor"
														stroke-width="1.25"
													/>
												</svg>
											</span>
										</span>
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			{/each}
		</div>
	</section>
{/if}

<style>
	.destinations__heading {
		margin-bottom: var(--space-lg);
	}

	.destinations__groups {
		display: grid;
		/* Generous separation between country groups; the leading hairline on each does
		   the dividing, so the gap is breathing room, not another rule. */
		gap: clamp(2.5rem, 1.5rem + 3vw, 4rem);
	}

	/* Each country group brackets itself with a top hairline (Emphasis Ladder tier 2). */
	.country {
		border-top: 1px solid var(--border);
		padding-top: var(--space-lg);
		min-width: 0;
	}

	.country__head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm) var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.country__id {
		display: flex;
		align-items: center;
		gap: clamp(0.85rem, 0.5rem + 1.4vw, 1.25rem);
		min-width: 0;
	}

	/* The flag is a 1px-framed emblem — a passport/luggage-tag stamp, never a backdrop.
	   Square corners hold the zero-radius brand signal. */
	.country__flag {
		flex: 0 0 auto;
		display: inline-flex;
		width: 3rem;
		height: 2rem;
		overflow: hidden;
		border: 1px solid var(--border);
	}

	/* The flag artwork now renders inside CountryFlagArt, so both svg and img need
	   :global to reach across the component boundary. */
	.country__flag :global(svg),
	.country__flag :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.country__text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.country__name {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h3);
		line-height: 1.1;
		color: var(--green);
		margin: 0;
	}

	.country__tagline {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 300;
		line-height: 1.4;
		color: var(--muted);
		text-wrap: pretty;
	}

	/* "View all {Country} →" — the built text-link treatment: green at rest, gold on
	   hover, arrow slides 3px. It is the country group's single CTA (the header text is
	   not a competing link), and the only affordance when a country has no tiles yet. */
	.country__viewall {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		color: var(--green);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.country__viewall span {
		border-bottom: 1px solid transparent;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.country__viewall svg {
		color: var(--gold);
		transition: transform var(--duration-hover) var(--ease);
	}

	.country__viewall:hover,
	.country__viewall:focus-visible {
		color: var(--gold);
		outline: none;
	}

	.country__viewall:hover span,
	.country__viewall:focus-visible span {
		border-color: var(--gold);
	}

	.country__viewall:hover svg,
	.country__viewall:focus-visible svg {
		transform: translateX(3px);
	}

	.country__viewall:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* Desktop: a flex row that wraps at --max-cols per row. Each tile's flex-basis is an
	   exact 1/max-cols share, so a full row holds exactly --max-cols and a sixth wraps;
	   flex-grow then redistributes the leftover space on any incomplete row equally, so a
	   trailing 2-of-4 row becomes two double-width tiles (and a lone trailing tile fills
	   the row). Height is fixed per tile (--tile-h), decoupled from width, so the wider
	   trailing tiles stay the same height as the rest — the image just reveals more of
	   itself. A single swipeable rail takes over on phones/tablets. */
	.tiles {
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

	/* Phones & tablets: collapse each country's grid into one swipeable rail so a country's
	   destinations cost one row of vertical space instead of many — and avoid cramming five
	   tiles into a narrow width. Full-bleed to the viewport edge so the next tile peeks in,
	   signalling that the row scrolls. No JS — native scroll-snap only. */
	@media (max-width: 1023px) {
		.tiles {
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

		.tiles::-webkit-scrollbar {
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
