<script lang="ts">
	import type {
		CountryFeatureCard,
		FeaturedLocationCard
	} from '$lib/sanity/transforms/taxonomyHero';
	import CountryFlagArt from '$lib/components/CountryFlagArt.svelte';
	import LocationTiles from '$lib/components/home/LocationTiles.svelte';

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

					<!-- Shared tile grid. No country overline here: each group already sits under
					     its own country header, so the tiles carry only the location name. -->
					<LocationTiles locations={group.locations} {maxColumns} />
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
</style>
