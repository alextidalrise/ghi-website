<script lang="ts">
	import DiscoveryBar from '$lib/components/listing/DiscoveryBar.svelte';
	import ExploreByCountry from '$lib/components/home/ExploreByCountry.svelte';
	import FeaturedLocations from '$lib/components/home/FeaturedLocations.svelte';
	import FeaturedListings from '$lib/components/listing/FeaturedListings.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import TrustedPartners from '$lib/components/home/TrustedPartners.svelte';
	let { data } = $props();

	// No global "all frontline" results page exists (frontline search is location-scoped),
	// so the homepage CTA points at the primary country's landing page for now.
	// TODO: revisit destination — see if a dedicated frontline index is wanted.
	const frontlineViewAllHref = $derived(
		data.countries[0]?.slug ? `/${data.countries[0].slug}` : undefined
	);
</script>

<section class="home-hero on-dark">
	{#if data.homepageHero}
		<div class="home-hero__bg" aria-hidden="true">
			<img
				src={data.homepageHero.url}
				srcset={data.homepageHero.srcset}
				sizes="100vw"
				alt={data.homepageHero.alt}
				width="1920"
				height="1080"
				fetchpriority="high"
			/>
		</div>
		<div class="home-hero__overlay" aria-hidden="true"></div>
	{/if}

	<div class="home-hero__content content-wrap">
		<h1 class="home-hero__title">
			Homes beside<br />
			<em>the fairway</em>
		</h1>
		{#if data.homepageHeroTagline}
			<p class="home-hero__lead">{data.homepageHeroTagline}</p>
		{/if}
	</div>
</section>

<!-- The search panel bridges the hero and the content below: its upper half sits over
     the photograph, its lower half over the page. It is a sibling of the hero (not a
     child), so the hero's overflow:hidden never clips it. -->
<div class="home-search content-wrap">
	<DiscoveryBar
		countries={data.countries}
		locations={data.locations}
		communities={data.communities}
	/>
</div>

<section class="home-content content-wrap">
	<ExploreByCountry countries={data.featuredCountries} />

	<FeaturedLocations locations={data.featuredLocations} />

	<FeaturedListings
		cards={data.featuredCards}
		heading="Featured properties"
		summary="Hand-picked listings across Spain and Portugal."
	/>

	<FrontlineListings
		cards={data.frontlineCards}
		heading="Frontline Golf Properties"
		summary="Homes directly on the fairway, in Spain and Portugal."
		viewAllHref={frontlineViewAllHref}
	/>

	<TrustedPartners />

	{#if data.featuredCards.length === 0 && data.frontlineCards.length === 0}
		<div class="home-intro">
			<p class="text-overline">Coming soon</p>
			<h2 class="text-h2 home-intro__heading">Property listings are on their way</h2>
			<p class="text-body home-intro__body">
				Editors can publish properties in Sanity Studio; this site will render them at their canonical
				URLs as the foundation rolls out.
			</p>
		</div>
	{/if}
</section>

<style>
	.home-hero {
		position: relative;
		/* Fill the fold on shorter screens, but cap the height so the bottom-anchored
		   title doesn't float under an ever-growing band of empty sky on tall/large
		   displays. The cap keeps the headroom proportionate at every size. */
		min-height: min(calc(100dvh - var(--nav-height)), 44rem);
		display: flex;
		align-items: flex-end;
		overflow: hidden;
		/* Dark base so the light-on-dark title stays readable even if the hero image
		   is absent. The photo (z0) and overlay (z1) layer over this when present. */
		background-color: var(--hero-dark);
	}

	.home-hero__bg {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.home-hero__bg img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 40%;
	}

	.home-hero__overlay {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				to right,
				oklch(0.22 0.03 165 / 0.62) 0%,
				oklch(0.22 0.03 165 / 0.38) 45%,
				oklch(0.22 0.03 165 / 0.15) 100%
			),
			linear-gradient(to top, oklch(0.22 0.03 165 / 0.4) 0%, transparent 42%);
		z-index: 1;
	}

	.home-hero__content {
		position: relative;
		z-index: 2;
		width: 100%;
		padding-top: var(--hero-padding-y);
		/* Leave room at the base for the bridging search panel to overlap into. */
		padding-bottom: clamp(8rem, 15vh, 12rem);
	}

	.home-hero__title {
		color: var(--on-green);
		margin-bottom: var(--space-md);
	}

	.home-hero__title em {
		font-style: italic;
		font-weight: 600;
	}

	/* Supporting deck. Set in the body sans (not the display serif) so it reads as a
	   subhead under the title rather than competing with it, and follows the design
	   system's light-on-dark body treatment: weight nudged to 350, looser leading,
	   slight tracking. Bright on-green ink keeps it legible over the photograph. */
	.home-hero__lead {
		font-family: var(--sans);
		font-size: 1.125rem;
		font-weight: 350;
		color: var(--on-green);
		max-width: 34rem;
		line-height: 1.7;
		letter-spacing: 0.01em;
	}

	/* Bridge: pull the panel up so it straddles the seam between photo and page. */
	.home-search {
		position: relative;
		z-index: 3;
		margin-top: clamp(-8rem, -12vh, -6rem);
	}

	.home-content {
		display: grid;
		/* Pin the single column to the container width. Without this, an `auto` track
		   sizes to its widest child's max-content, and the horizontal scroll rail
		   (all cards laid out, ~2000px) would blow the column out and drag every
		   section + the Frontline full-bleed breakout off to the right. */
		grid-template-columns: minmax(0, 1fr);
		padding-block: var(--section-gap);
		row-gap: var(--section-gap);
	}

	/* The page owns the rhythm between bands; each band stays margin-agnostic so it
	   can be reused elsewhere. This outranks any band's own margin-top. */
	.home-content > :global(*) {
		margin-block: 0;
	}

	.home-intro {
		max-width: 40rem;
	}

	.home-intro__heading {
		margin-top: var(--space-sm);
		margin-bottom: var(--space-md);
		max-width: 28rem;
	}

	.home-intro__body {
		max-width: 36rem;
		color: var(--muted);
	}

	@media (max-width: 600px) {
		.home-hero {
			/* Cap the hero so the title rises toward centre on tall phones. */
			min-height: min(calc(100dvh - var(--nav-height)), 38rem);
		}

		/* Reserve room at the base for the panel, then pull the panel up so it straddles
		   the photo/page seam by the same proportion as desktop (~40% of the panel over
		   the image). The two values move together: the larger padding lifts the lead by
		   the same amount the panel rises, so the panel never crowds the copy. The hero
		   height is capped here, so fixed values track more predictably than vh units. */
		.home-hero__content {
			padding-bottom: 7.5rem;
		}

		.home-search {
			margin-top: -6rem;
		}
	}
</style>
