<script lang="ts">
	import type { PublicPropertyListing } from '$lib/sanity/transforms';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Gallery from './Gallery.svelte';
	import PropertySummary from './PropertySummary.svelte';
	import KeyFacts from './KeyFacts.svelte';
	import Floorplan from './Floorplan.svelte';
	import ContentSection from './ContentSection.svelte';
	import Highlights from './Highlights.svelte';
	import EnquiryRail from './EnquiryRail.svelte';
	import PropertyLocation from './PropertyLocation.svelte';
	import SimilarProperties from '$lib/components/listing/SimilarProperties.svelte';

	type Props = {
		property: PublicPropertyListing;
		breadcrumbs: BreadcrumbItem[];
		similarCards?: SimilarListingCard[];
	};

	let { property, breadcrumbs, similarCards = [] }: Props = $props();
</script>

<article class="listing-page listing-page--property">
	<!-- Split hero: a full-bleed gallery (flush to the left edge and the nav on
	     desktop) beside the headline facts, both in one viewport. Full immersion
	     stays one click away in the gallery lightbox. The breadcrumb trail rides at
	     the top of the info column, above the title. On mobile this collapses to a
	     photo-first stack: the gallery jumps above the breadcrumbs + summary. -->
	<section class="hero">
		<div class="hero__gallery">
			<Gallery media={property.media} title={property.title ?? 'Property'} />
		</div>
		<div class="hero__summary">
			<Breadcrumbs items={breadcrumbs} inline hideCurrent />
			<PropertySummary listing={property} />
			<KeyFacts listing={property} />
			<Floorplan floorplans={property.media?.floorplans} title={property.title ?? 'Property'} />
		</div>
	</section>

	<div class="property-body content-wrap">
		<div class="property-body__main">
			<Highlights content={property.content} />
			<ContentSection title="About" body={property.content?.aboutDescription} bare />
		</div>
		<aside class="property-body__rail">
			<EnquiryRail listing={property} />
		</aside>
	</div>

	<PropertyLocation
		address={property.location?.addressDisplay}
		map={property.location?.map}
		golf={property.golf}
	/>

	{#if similarCards.length > 0}
		<SimilarProperties cards={similarCards} />
	{/if}
</article>

<style>
	.listing-page {
		padding-bottom: 0;
	}

	/* The hero bleeds to the viewport edges (gallery flush left, info column near
	   the right edge). Let every section below share those same near-edge rails
	   instead of the narrow 1060px reading column, so the body lines up under the
	   gallery and breathes on wide screens. Overriding the token cascades to every
	   descendant `.content-wrap` (body, location, golf, similar) at once; prose
	   blocks keep their own ch-based caps, so line length stays readable. */
	.listing-page--property {
		--content-max: none;
	}

	/* Transparent wrapper until the desktop split kicks in, so the gallery and
	   summary participate directly in the mobile/tablet stack. */
	.hero {
		display: contents;
	}

	.hero__summary {
		padding: var(--space-sm) var(--content-padding) 0;
	}

	/* Desktop: a full-bleed gallery flush to the left edge and the nav, beside the
	   info column. The grid keeps only a right gutter; the gallery column runs to
	   x=0 so photography commands the viewport. */
	@media (min-width: 1024px) {
		.hero {
			display: grid;
			grid-template-columns: minmax(0, 1.62fr) minmax(21rem, 1fr);
			gap: clamp(2rem, 3vw, 3.5rem);
			align-items: start;
			padding: 0 var(--content-padding) 0 0;
		}

		/* Pin the gallery while the taller info column (summary → key facts →
		   floorplan) scrolls up past it. The gallery is shorter than the info
		   column, so without this it sat at the top and left dead space below it;
		   sticky keeps it in view through the hero and closes that gap. Engages only
		   when the info column is the taller of the two (it has the travel room);
		   on listings where the gallery is taller it simply rests in place. */
		.hero__gallery {
			position: sticky;
			/* Pin flush under the nav. The gallery's resting position is already at
			   nav-height, so any larger offset would engage sticky at scroll 0 and
			   push it down, opening a gap below the nav. */
			top: var(--nav-height);
			align-self: start;
		}

		.hero__summary {
			padding: 0;
			/* Hold the column off the very top so the title baseline reads against
			   the upper third of the photo, not its top edge. */
			padding-block-start: clamp(0.5rem, 1.5vw, 1.5rem);
		}

		/* Let the gallery fill its column edge-to-edge; its own gutter/cap are
		   removed so the stage bleeds to x=0 and up to the nav. */
		:global(.hero__gallery .gallery) {
			max-width: none;
			margin: 0;
			padding: 0;
		}

		/* Cap the stage so the hero stays close to one viewport (nav + stage +
		   filmstrip). The reclaimed breadcrumb row buys a taller frame. */
		:global(.hero__gallery .gallery__stage) {
			max-height: 74vh;
		}

		/* The headline is in a narrower column now; ease the display ceiling so a
		   long property name never overflows. */
		:global(.hero__summary .summary__title) {
			font-size: clamp(1.875rem, 1rem + 2vw, 3rem);
		}
	}

	/* Two-column reading region: content left, sticky enquiry rail right. */
	.property-body {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-lg);
		padding-block: var(--space-lg) var(--space-xl);
		align-items: start;
	}

	.property-body__main {
		min-width: 0;
	}

	@media (min-width: 880px) {
		.property-body {
			grid-template-columns: minmax(0, 1fr) clamp(20rem, 30%, 23rem);
			gap: clamp(2.5rem, 5vw, 4.5rem);
		}

		/* Sticks through the reading region, releasing at the grid's end so it never
		   overlaps the Location block below. */
		.property-body__rail {
			position: sticky;
			top: calc(var(--nav-height) + var(--space-md));
		}
	}

	/* Mobile: photo-first. The article becomes a flex column and the gallery is
	   pulled above its DOM-preceding breadcrumbs (flush under the nav). */
	@media (max-width: 760px) {
		.listing-page--property {
			display: flex;
			flex-direction: column;
		}

		/* `.content-wrap` centres itself with margin-inline:auto; inside this flex
		   column that shrinks each section to its content width instead of filling,
		   so Location and Similar rendered narrower than the rest. Force full width.
		   `:global` is required because these sections are rendered by child
		   components and don't carry this component's scope hash. */
		.listing-page--property > :global(.content-wrap) {
			width: 100%;
		}

		.hero__gallery {
			order: -1;
		}
	}
</style>
