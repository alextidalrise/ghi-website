<script lang="ts">
	import DiscoveryBar from '$lib/components/listing/DiscoveryBar.svelte';
	import BuyerGuides from '$lib/components/home/BuyerGuides.svelte';
	import DestinationsByCountry from '$lib/components/home/DestinationsByCountry.svelte';
	import FeaturedListings from '$lib/components/listing/FeaturedListings.svelte';
	import FrontlineListings from '$lib/components/listing/FrontlineListings.svelte';
	import GoogleReviews from '$lib/components/reviews/GoogleReviews.svelte';
	import TrustedPartners from '$lib/components/home/TrustedPartners.svelte';
	import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
	let { data } = $props();
	const c = $derived(data.content);

	const headlineParts = $derived(
		c.heroHeadline
			.split('\n')
			.map((line) =>
				line.split('*').map((text, j) => ({ text, italic: j % 2 === 1 }))
			)
	);

	const pageTitle = $derived(c.seo?.seoTitle?.trim() || 'Golf Homes International');
	const metaDescription = $derived(
		c.seo?.metaDescription?.trim() ||
			'Curated residential properties on and near premier golf courses in southern Europe and beyond.'
	);
	const ogTitle = $derived(c.seo?.openGraphTitle?.trim() || pageTitle);
	const ogDescription = $derived(c.seo?.openGraphDescription?.trim() || metaDescription);

	// The hero is the LCP element, so its byte weight *is* the mobile score. Declaring the
	// slot narrower than the viewport on phones drops the candidate the browser picks from
	// 1280w (138KB) to 960w (52KB). Nothing is lost visually: the photo is a 16:9 crop
	// cover-fitted into a tall phone box, so it is already upscaled ~2.6x vertically, and
	// it sits under two gradient overlays. The upscale — not the source width — is what
	// sets perceived sharpness here.
	// Must stay byte-identical to the preload's imagesizes below, or the preload misses
	// and the image is fetched twice.
	const HERO_SIZES = '(max-width: 900px) 70vw, 100vw';
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={data.canonicalUrl} />
	{#if c.seo?.noindex}
		<meta name="robots" content="noindex" />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.canonicalUrl} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	{#if data.homepageHero?.url}
		<meta property="og:image" content={data.homepageHero.url} />
	{/if}
	{#if data.homepageHero?.srcset}
		<link
			rel="preload"
			as="image"
			imagesrcset={data.homepageHero.srcset}
			imagesizes={HERO_SIZES}
			fetchpriority="high"
		/>
	{/if}
</svelte:head>

<section class="home-hero on-dark">
	{#if data.homepageHero}
		<div
			class="home-hero__bg"
			aria-hidden="true"
			style:background-image={data.homepageHero.lqip ? `url(${data.homepageHero.lqip})` : undefined}
		>
			<img
				src={data.homepageHero.url}
				srcset={data.homepageHero.srcset}
				sizes={HERO_SIZES}
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
			{#each headlineParts as line, i}{#if i}<br />{/if}{#each line as part}{#if part.italic}<em>{part.text}</em>{:else}{part.text}{/if}{/each}{/each}
		</h1>
		{#if data.homepageHeroTagline}
			<p class="home-hero__lead">{data.homepageHeroTagline}</p>
		{/if}
	</div>
</section>

<!-- The search panel bridges the hero and the content below: its upper half sits over
     the photograph, its lower half over the white page, which flows straight into the
     white "Explore by country" section beneath it — no tinted band competing with the
     bar at the seam. It is a sibling of the hero (not a child), so the hero's overflow
     never clips it. -->
<div class="home-search content-wrap">
	<DiscoveryBar
		countries={data.countries}
		locations={data.locations}
		communities={data.communities}
		facetRows={data.facetRows}
		featureFilter={data.featureFilter}
	/>
</div>

<section class="home-content content-wrap">
	<DestinationsByCountry
		countries={data.featuredCountries}
		locations={data.featuredLocations}
		heading={c.destinationsHeading}
	/>

	<!-- Lead-magnet signpost sits below the white "Explore by country" index so its faint
	     green tint never lands directly under the search bar (where it competed with the
	     bar and left awkward whitespace). -->
	<BuyerGuides
		countries={data.featuredCountries}
		heading={c.buyerIntroHeading}
		deck={c.buyerIntroDeck}
		cta={c.buyerIntroCta}
	/>

	<FeaturedListings
		cards={data.featuredCards}
		heading={c.featuredHeading}
		summary={c.featuredSummary}
	/>

	<FrontlineListings
		cards={data.frontlineCards}
		heading={c.frontlineHeading}
		summary={c.frontlineSummary}
		viewAllHref={FRONTLINE_COLLECTION_PATH}
	/>

	<!-- Buyer voice, then the professional network behind it: the two trust bands read as a
	     pair, and the human proof comes first. Renders nothing until there are at least
	     three real reviews on the Google profile.

	     flushTop: this band butts straight onto the green Frontline band above it, per the
	     stacking rule — no section-gap, no top rule. -->
	<GoogleReviews
		data={data.reviews}
		heading={c.reviewsHeading}
		deck={c.reviewsDeck}
		flushTop
	/>

	<TrustedPartners
		partners={data.partnerLogos.length ? data.partnerLogos : undefined}
		heading={c.partnersHeading}
		subhead={c.partnersSubhead}
		ctaLabel={c.partnersCta}
		ctaHref="/partners"
		ctaSupport={c.partnersCtaSupport}
	/>

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
		/* Blurred LQIP shows through until the hero photo paints over it. */
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
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

	/* …with one deliberate exception. Two full-bleed bands stack flush: the green Frontline
	   band's own padding is already the breathing room and its bottom edge is the divider,
	   so the reviews band sits straight on it. Left to the grid's row-gap, the band's top
	   rule ends up marooned in a section-gap of dead white — a hairline belonging to
	   nothing. The band drops that rule itself (flushTop); the page closes the gap. */
	.home-content > :global(.reviews) {
		margin-top: calc(-1 * var(--section-gap));
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
