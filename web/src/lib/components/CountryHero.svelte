<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import CountryFlagArt from './CountryFlagArt.svelte';

	type Props = {
		/** Hero headline (rendered inside the h1). */
		title: Snippet;
		/** Country slug — selects the built-in flag fallback (spain/portugal/neutral). */
		countrySlug: string;
		/** Dereferenced flag SVG URL from Sanity; null falls back to a built-in stamp. */
		flagUrl?: string | null;
		/** Breadcrumb trail laid over the top of the band (matches the location hero). */
		breadcrumbs?: BreadcrumbItem[];
		/** Optional lead line beneath the headline. */
		tagline?: string;
		/**
		 * Reserve extra footing so the search bar can straddle the band's base (mirroring
		 * the homepage hero → search bridge). Also drops the band's bottom rule, which the
		 * overlapping bar would otherwise punch through mid-width.
		 */
		bridgeBelow?: boolean;
	};

	let { title, countrySlug, flagUrl, breadcrumbs, tagline, bridgeBelow = false }: Props = $props();
</script>

<!-- Compact deep-green punctuation band — the country page's single arrival moment.
     No photograph (which was rendering the flag scrimmed and pixelated); the flag now
     sits crisp as a framed passport stamp above the headline, the same stamp vocabulary
     used by the homepage country selector. -->
<section class="country-hero on-dark" class:country-hero--bridge={bridgeBelow}>
	{#if breadcrumbs && breadcrumbs.length > 0}
		<div class="country-hero__crumbs">
			<Breadcrumbs items={breadcrumbs} onDark />
		</div>
	{/if}

	<div class="country-hero__inner content-wrap">
		<span class="country-hero__flag">
			<CountryFlagArt slug={countrySlug} {flagUrl} />
		</span>

		<h1 class="country-hero__title">{@render title()}</h1>

		{#if tagline}
			<p class="country-hero__lead">{tagline}</p>
		{/if}
	</div>
</section>

<style>
	.country-hero {
		position: relative;
		/* Full-bleed band, edge to edge, breaking out of the page column. */
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		/* Compact: content-driven height, no photo, no forced viewport fill — roughly
		   half the old photo hero's min-height. The breadcrumbs hold the top edge (their
		   own padding gives the gap under the nav), so top padding is light; the base
		   keeps the generous band footing. */
		padding-block: var(--space-sm) clamp(2.75rem, 1.5rem + 4.5vw, 4.5rem);
		color: var(--on-green);
		/* Depth, not a flat slab: a soft light off the top-left settling deeper at the
		   base — the same material as the Frontline band so the page reads as one system. */
		background:
			radial-gradient(120% 90% at 12% -25%, oklch(0.37 0.05 165) 0%, transparent 55%),
			linear-gradient(180deg, oklch(0.3 0.035 165) 0%, oklch(0.23 0.03 165) 100%);
		/* Hairline gold rules frame the band crisply against the white page. */
		border-block: 1px solid oklch(0.82 0.05 85 / 0.28);
	}

	/* Bridge mode: deepen the base so the search bar overlaps the band's foot (the same
	   move the homepage hero makes for its search), and drop the bottom rule — the bar
	   crosses it mid-width, so keeping it would read as a broken line either side of the
	   bar. The green→white contrast still reads the band's lower edge cleanly. */
	.country-hero--bridge {
		padding-bottom: clamp(6.5rem, 4.5rem + 7vw, 9.5rem);
		border-bottom-color: transparent;
	}

	.country-hero__inner {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* The flag is a 1px-framed emblem — a passport / luggage-tag stamp, never a backdrop.
	   Square corners hold the zero-radius brand signal. */
	.country-hero__flag {
		flex: 0 0 auto;
		display: inline-flex;
		width: 4.5rem;
		height: 3rem;
		margin-bottom: var(--space-md);
		overflow: hidden;
		border: 1px solid oklch(0.82 0.05 85 / 0.4);
	}

	.country-hero__flag :global(svg),
	.country-hero__flag :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.country-hero__title {
		font-size: var(--text-display);
		color: var(--on-green);
		text-wrap: balance;
		max-width: 20ch;
		margin: 0;
	}

	.country-hero__lead {
		margin-top: var(--space-md);
		max-width: 46ch;
		font-family: var(--sans);
		font-size: 1.125rem;
		/* Light-on-dark compensation (DESIGN.md): heavier weight, more leading, a touch
		   of tracking so the ivory type doesn't read as too thin on green. */
		color: var(--on-green);
		font-weight: 350;
		line-height: 1.8;
		letter-spacing: 0.01em;
		text-wrap: pretty;
	}

	/* Subtle load reveal — a staggered fade-up on the flag, then the copy. Enhances an
	   already-visible default; suppressed under reduced-motion. */
	@media (prefers-reduced-motion: no-preference) {
		.country-hero__flag,
		.country-hero__title,
		.country-hero__lead {
			opacity: 0;
			transform: translateY(14px);
			animation: country-hero-reveal 0.7s var(--ease) forwards;
		}

		.country-hero__title {
			animation-delay: 0.08s;
		}

		.country-hero__lead {
			animation-delay: 0.16s;
		}

		@keyframes country-hero-reveal {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
