<script lang="ts">
	import type { CountryFeatureCard } from '$lib/sanity/transforms/taxonomyHero';

	type Props = {
		countries: CountryFeatureCard[];
	};

	let { countries }: Props = $props();

	/** Country slug from the card href (`/spain` → `spain`), used to key the fallback stamp. */
	function slugOf(href: string): string {
		return href.replace(/^\//, '').split('/')[0];
	}
</script>

<!-- Flag stamp: prefer the SVG linked in Sanity; fall back to a built-in stamp so a
     country still renders before an editor uploads its flag. Spain and Portugal ship
     hand-drawn fallbacks (matching the buyer-guide flags); any other country gets a
     neutral green field until its flag is added in the CMS. The country name carries the
     meaning, so the flag is decorative (empty alt / aria-hidden). -->
{#snippet flag(country: CountryFeatureCard)}
	{#if country.flagUrl}
		<img src={country.flagUrl} alt="" width="48" height="32" loading="lazy" decoding="async" />
	{:else if slugOf(country.href) === 'spain'}
		<svg viewBox="0 0 30 20" aria-hidden="true">
			<rect width="30" height="20" fill="#AA151B" />
			<rect y="5" width="30" height="10" fill="#F1BF00" />
		</svg>
	{:else if slugOf(country.href) === 'portugal'}
		<svg viewBox="0 0 30 20" aria-hidden="true">
			<rect width="30" height="20" fill="#DA291C" />
			<rect width="12" height="20" fill="#046A38" />
			<circle cx="12" cy="10" r="3.1" fill="#FFE12C" stroke="#046A38" stroke-width="0.7" />
		</svg>
	{:else}
		<svg viewBox="0 0 30 20" aria-hidden="true">
			<rect width="30" height="20" fill="#1F3D34" />
		</svg>
	{/if}
{/snippet}

{#if countries.length > 0}
	<section class="explore" aria-labelledby="explore-heading">
		<h2 id="explore-heading" class="explore__heading">Explore by country</h2>

		<ul class="rows">
			{#each countries as country, index (country.href)}
				<li>
					<a class="row" href={country.href} style="--reveal-delay: {index * 90}ms">
						<span class="row__flag">{@render flag(country)}</span>
						<span class="row__text">
							<span class="row__name">{country.name}</span>
							{#if country.tagline}
								<span class="row__tagline">{country.tagline}</span>
							{/if}
						</span>
						<span class="row__cue" aria-hidden="true">
							<svg viewBox="0 0 20 10" width="20" height="10" fill="none">
								<path d="M0 5h18M14 1l4 4-4 4" stroke="currentColor" stroke-width="1.25" />
							</svg>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.explore__heading {
		margin-bottom: var(--space-lg);
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		/* Top + bottom hairlines bracket the band (Emphasis Ladder, tier 2). */
		border-block: 1px solid var(--border);
	}

	.rows li + li {
		border-top: 1px solid var(--border);
	}

	.row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: clamp(1rem, 0.5rem + 2vw, 2rem);
		padding-block: clamp(1.1rem, 0.8rem + 1vw, 1.6rem);
		text-decoration: none;
		color: var(--green);
		transition: background var(--duration-hover) var(--ease);
	}

	/* The flag is a 1px-framed emblem — a passport/luggage-tag stamp, never a backdrop.
	   Square corners hold the zero-radius brand signal. */
	.row__flag {
		flex: 0 0 auto;
		display: inline-flex;
		width: 3rem;
		height: 2rem;
		overflow: hidden;
		border: 1px solid var(--border);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.row__flag :global(svg),
	.row__flag img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.row__text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.row__name {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h3);
		line-height: 1.1;
		color: var(--green);
	}

	.row__tagline {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 300;
		line-height: 1.4;
		color: var(--muted);
	}

	.row__cue {
		display: inline-flex;
		align-items: center;
		justify-self: end;
		padding-inline: 0.25rem;
		color: var(--gold);
	}

	.row__cue svg {
		transition: transform var(--duration-hover) var(--ease);
	}

	.row:hover,
	.row:focus-visible {
		/* Faint warm wash across the whole row — calm feedback, no side-stripe. */
		background: oklch(0.97 0.012 95);
		outline: none;
	}

	.row:hover .row__flag,
	.row:focus-visible .row__flag {
		border-color: var(--gold);
	}

	.row:hover .row__cue svg,
	.row:focus-visible .row__cue svg {
		transform: translateX(4px);
	}

	.row:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: -2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.row:hover .row__cue svg,
		.row:focus-visible .row__cue svg {
			transform: none;
		}
	}

	/* Staggered entrance — enhances an already-visible default; reduced-motion skips it. */
	@media (prefers-reduced-motion: no-preference) {
		.row {
			opacity: 0;
			transform: translateY(16px);
			animation: country-reveal 0.7s var(--ease) forwards;
			animation-delay: var(--reveal-delay, 0ms);
		}

		@keyframes country-reveal {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
