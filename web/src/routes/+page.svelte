<script lang="ts">
	import DiscoveryBar from '$lib/components/listing/DiscoveryBar.svelte';
	import FeaturedListings from '$lib/components/listing/FeaturedListings.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';

	let { data } = $props();
</script>

<section class="home-hero on-dark">
	<div class="home-hero__bg" aria-hidden="true">
		<img
			src="/design-system/assets/andalucia-golf-villa.png"
			alt=""
			width="1920"
			height="1080"
			fetchpriority="high"
		/>
	</div>
	<div class="home-hero__overlay" aria-hidden="true"></div>

	<div class="home-hero__content content-wrap">
		<p class="text-overline home-hero__overline">Golf Homes International</p>
		<h1 class="home-hero__title">
			Homes beside<br />
			<em>the fairway</em>
		</h1>
		<p class="home-hero__lead">
			A curated portfolio of residential properties on and near premier golf courses — starting
			in southern Europe, with room to grow.
		</p>

		<DiscoveryBar countries={data.countries} locations={data.locations} />
	</div>
</section>

<section class="home-content content-wrap">
	<FeaturedListings cards={data.featuredCards} heading="Featured properties" />

	<FrontlineListings cards={data.frontlineCards} heading="Frontline golf properties" />

	{#if data.featuredCards.length === 0}
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
		min-height: calc(100dvh - var(--nav-height));
		display: flex;
		align-items: flex-end;
		overflow: hidden;
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
			linear-gradient(to top, oklch(0.22 0.03 165 / 0.35) 0%, transparent 40%);
		z-index: 1;
	}

	.home-hero__content {
		position: relative;
		z-index: 2;
		padding-block: var(--hero-padding-y);
		width: 100%;
	}

	.home-hero__overline {
		margin-bottom: var(--space-md);
	}

	.home-hero__title {
		color: var(--linen);
		margin-bottom: var(--space-lg);
	}

	.home-hero__title em {
		font-style: italic;
		font-weight: 600;
	}

	.home-hero__lead {
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 400;
		color: oklch(0.82 0.01 80);
		max-width: 36rem;
		line-height: 1.55;
		letter-spacing: 0.005em;
		margin-bottom: var(--space-xl);
	}

	.home-intro {
		padding-block: var(--section-gap);
	}

	.home-content {
		padding-block: var(--section-gap);
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
</style>
