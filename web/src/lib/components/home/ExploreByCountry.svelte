<script lang="ts">
	import type { CountryFeatureCard } from '$lib/sanity/transforms/taxonomyHero';

	type Props = {
		countries: CountryFeatureCard[];
	};

	let { countries }: Props = $props();
</script>

{#if countries.length > 0}
	<section class="explore" aria-labelledby="explore-heading">
		<h2 id="explore-heading" class="explore__heading">Explore by country</h2>

		<div class="explore__grid">
			{#each countries as country, index (country.href)}
				<a class="country-card" href={country.href} style="--reveal-delay: {index * 90}ms">
					<span class="country-card__media">
						<img
							src={country.image}
							alt={country.alt}
							width="800"
							height="600"
							loading="lazy"
						/>
					</span>
					<span class="country-card__scrim" aria-hidden="true"></span>
					<span class="country-card__body">
						<span class="country-card__name">{country.name}</span>
						{#if country.tagline}
							<span class="country-card__tagline">{country.tagline}</span>
						{/if}
						<span class="country-card__cue">
							Explore {country.name}
							<svg
								class="country-card__arrow"
								width="20"
								height="10"
								viewBox="0 0 20 10"
								fill="none"
								aria-hidden="true"
							>
								<path d="M0 5h18M14 1l4 4-4 4" stroke="currentColor" stroke-width="1.25" />
							</svg>
						</span>
					</span>
				</a>
			{/each}
		</div>
	</section>
{/if}

<style>
	.explore__heading {
		margin-bottom: var(--space-lg);
	}

	.explore__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-lg);
	}

	.country-card {
		position: relative;
		display: block;
		min-height: clamp(20rem, 34vw, 28rem);
		overflow: hidden;
		border: 1px solid var(--border);
		color: var(--on-green);
		text-decoration: none;
		isolation: isolate;
	}

	.country-card__media {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.country-card__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.country-card__scrim {
		position: absolute;
		inset: 0;
		z-index: 1;
		background: linear-gradient(
			to top,
			oklch(0.18 0.03 165 / 0.82) 0%,
			oklch(0.18 0.03 165 / 0.45) 38%,
			oklch(0.18 0.03 165 / 0.05) 72%
		);
		transition: opacity var(--duration-hover) var(--ease);
	}

	.country-card__body {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		z-index: 2;
		display: grid;
		gap: var(--space-xs);
		padding: var(--space-xl);
	}

	.country-card__name {
		font-family: var(--serif);
		font-weight: 600;
		font-size: var(--text-h2);
		line-height: 1.05;
		letter-spacing: var(--tracking-tight);
	}

	.country-card__tagline {
		max-width: 24rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.5;
		color: oklch(0.92 0.02 85 / 0.92);
	}

	.country-card__cue {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: 0.85rem;
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--gold);
	}

	.country-card__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.country-card:hover .country-card__media img,
	.country-card:focus-visible .country-card__media img {
		transform: scale(1.04);
	}

	.country-card:hover .country-card__arrow,
	.country-card:focus-visible .country-card__arrow {
		transform: translateX(4px);
	}

	.country-card:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	@media (max-width: 720px) {
		.explore__grid {
			grid-template-columns: 1fr;
		}

		.country-card {
			min-height: 18rem;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.country-card {
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
