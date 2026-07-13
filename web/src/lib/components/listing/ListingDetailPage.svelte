<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import ContentSection from '$lib/components/property/ContentSection.svelte';
	import EnquiryRail from '$lib/components/property/EnquiryRail.svelte';
	import PropertyLocation from '$lib/components/property/PropertyLocation.svelte';
	import PropertyDetail from '$lib/components/property/PropertyDetail.svelte';
	import BackToArea from '$lib/components/listing/BackToArea.svelte';
	import SimilarProperties from '$lib/components/listing/SimilarProperties.svelte';
	import DevelopmentGallery from '$lib/components/development/Gallery.svelte';
	import DevelopmentKeyFacts from '$lib/components/development/KeyFacts.svelte';
	import DevelopmentSummary from '$lib/components/development/Summary.svelte';
	import SharedAmenities from '$lib/components/development/SharedAmenities.svelte';
	import UnitsInventory from '$lib/components/development/UnitsInventory.svelte';
	import GoogleReviewsCompact from '$lib/components/reviews/GoogleReviewsCompact.svelte';
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import type { EnquiryFormResult } from '$lib/listing/enquiryAction';
	import {
		shouldShowDevelopmentPricing,
		unitAvailability,
		unitsCtaLabel
	} from '$lib/listing/developmentDisplay';
	import type { ReviewsData } from '$lib/reviews';
	import type { PublicDevelopment, PublicPropertyListing } from '$lib/sanity/transforms';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		pageType: 'property' | 'development';
		property?: PublicPropertyListing | null;
		development?: PublicDevelopment | null;
		breadcrumbs: BreadcrumbItem[];
		similarCards?: SimilarListingCard[];
		form?: EnquiryFormResult | null;
		/** Null until the Google profile has enough reviews; the section then omits itself. */
		reviews?: ReviewsData | null;
	};

	let {
		pageType,
		property = null,
		development = null,
		breadcrumbs,
		similarCards = [],
		form = null,
		reviews = null
	}: Props = $props();

	const displayMode = $derived(development?.developmentDisplayMode ?? 'flat_listing');
	const showInventoryPricing = $derived(shouldShowDevelopmentPricing(displayMode));

	// The inventory is the next step of the funnel, so it owns the hero's one CTA.
	// `null` when there is nothing to anchor to — the same condition that stops
	// UnitsInventory rendering — and enquiry takes the slot instead.
	const unitsLabel = $derived(unitsCtaLabel(unitAvailability(development?.units)));

	const enquireLabel = $derived(
		development?.ctas?.primaryCtaLabel ?? 'Enquire about this development'
	);

	// The final breadcrumb is the development itself; its href is the canonical path
	// that unit rows nest under.
	const developmentPath = $derived(breadcrumbs[breadcrumbs.length - 1]?.href ?? '');

	/** Repeat activation is where the native anchor breaks down. With `#units` already in
	    the URL the browser performs no fragment navigation, so it skips the fragment scroll
	    that honours `scroll-margin-top` — and the only scroll left is the one `focus()`
	    triggers, which on a section taller than the viewport overshoots the heading by
	    exactly the scroll-margin. Drive both ourselves so the first, second and tenth
	    activation land identically. The plain `href` remains the no-JS path. */
	function scrollToUnits(event: MouseEvent) {
		const target = document.getElementById('units');
		if (!target) return; // Nothing to enhance — let the href do its job.
		event.preventDefault();

		// Keep the shareable deep link without re-triggering fragment navigation.
		if (location.hash !== '#units') history.pushState(null, '', '#units');

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
		// `preventScroll` is the point: focus must move for keyboard users without adding
		// the second, conflicting scroll that causes the overshoot.
		target.focus({ preventScroll: true });
	}
</script>

{#if pageType === 'property' && property}
	<PropertyDetail {property} {breadcrumbs} {similarCards} {form} {reviews} />
{:else if pageType === 'development' && development}
	<article class="listing-page listing-page--development">
		<!-- Mirrors the property page: a full-bleed gallery beside the headline facts,
		     breadcrumbs riding the top of the info column. On mobile it collapses to a
		     photo-first stack. -->
		<section class="hero">
			<div class="hero__gallery">
				<DevelopmentGallery {development} />
			</div>
			<div class="hero__summary">
				<Breadcrumbs items={breadcrumbs} inline hideCurrent />
				<DevelopmentSummary {development} showPricing={showInventoryPricing} />
				<DevelopmentKeyFacts {development} />
				<!-- One CTA, never two. Where there is inventory, browsing it is the next step
				     and enquiry is already carried below (sticky rail + fixed mobile console).
				     Most developments are single villas with no units at all, though, and there
				     the hero would otherwise have no action — so enquiry stands in.
				     Real anchors, so both work with JS disabled; `scrollToUnits` only enhances
				     the units one, to keep repeat activations landing consistently. -->
				<div class="hero__actions">
					{#if unitsLabel}
						<a class="hero__cta hero__cta--units" href="#units" onclick={scrollToUnits}>
							{unitsLabel}
							<span class="hero__cta-arrow" aria-hidden="true">↓</span>
						</a>
					{:else}
						<a class="hero__cta" href="#enquire">{enquireLabel}</a>
					{/if}
				</div>
			</div>
		</section>

		<div class="listing-body content-wrap">
			<div class="listing-body__main">
				<SharedAmenities {development} />
				<ContentSection
					title="About this development"
					body={development.content?.aboutDescription}
					bare
				/>
			</div>
			<aside class="listing-body__rail">
				<EnquiryRail listing={development} heading="Enquire about this development" {form} />
			</aside>
		</div>

		<UnitsInventory
			units={development.units}
			unitTypes={development.unitTypes}
			developmentName={development.title}
			{developmentPath}
			showPricing={showInventoryPricing}
		/>

		<PropertyLocation
			description={development.content?.locationDescription}
			address={development.location?.addressDisplay}
			map={development.location?.map}
			golf={development.golf}
		/>

		<!-- Same placement as the property page: reassurance before the reader is offered
		     somewhere else to go. -->
		<div class="content-wrap">
			<GoogleReviewsCompact data={reviews} heading="What our buyers say" />
		</div>

		{#if similarCards.length > 0}
			<SimilarProperties cards={similarCards} />
		{/if}

		<BackToArea {breadcrumbs} />
	</article>
{/if}

<style>
	.listing-page {
		padding-bottom: 0;
	}

	/* Match the property/unit pages: drop the 1060px reading cap so the body,
	   units table, location and similar sections span the near-edge width under
	   the gallery. Prose blocks keep their own ch-based caps, so line length
	   stays readable. */
	.listing-page--development {
		--content-max: none;
	}

	/* Transparent until the desktop split kicks in, so gallery + summary join the
	   mobile/tablet stack directly (same behaviour as the property page). */
	.hero {
		display: contents;
	}

	.hero__summary {
		padding: var(--space-lg) var(--content-padding) 0;
	}

	/* A row rather than a bare link, so the mobile reorder below has a stable hook and
	   the button hugs its label instead of stretching across the column. */
	.hero__actions {
		display: flex;
		margin-top: var(--space-lg);
	}

	/* Where the row follows the key-facts strip, that strip's own padding-bottom is
	   already the gap under its closing hairline — the row's margin stacked on top of it
	   made the space below the rule more than twice the space above. Drop it, so the rule
	   sits symmetrically between the facts and the button.

	   Keyed off the sibling so a development with no key facts (the strip doesn't render)
	   keeps the row's separation from the badges above it. Scoped above the mobile
	   breakpoint because below it the row is reordered *above* the strip, where its own
	   top margin is what separates it from the price. */
	@media (min-width: 761px) {
		:global(.key-facts) + .hero__actions {
			margin-top: 0;
		}
	}

	/* DESIGN.md's Gold button tier, unchanged. */
	.hero__cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 0.85rem 2rem;
		background: var(--gold);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		border: 1px solid var(--gold);
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.hero__cta:hover,
	.hero__cta:focus-visible {
		background: var(--green);
		color: var(--white);
		border-color: var(--green);
	}

	/* The site's text links slide their arrow right 3px on hover; this one travels down,
	   because that is where it takes you. Signals "further down this page", not "away". */
	.hero__cta-arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.hero__cta--units:hover .hero__cta-arrow,
	.hero__cta--units:focus-visible .hero__cta-arrow {
		transform: translateY(3px);
	}

	@media (prefers-reduced-motion: reduce) {
		.hero__cta-arrow {
			transition: none;
		}

		.hero__cta--units:hover .hero__cta-arrow,
		.hero__cta--units:focus-visible .hero__cta-arrow {
			transform: none;
		}
	}

	@media (min-width: 1024px) {
		.hero {
			display: grid;
			grid-template-columns: minmax(0, 1.62fr) minmax(21rem, 1fr);
			gap: clamp(2rem, 3vw, 3.5rem);
			align-items: start;
			padding: 0 clamp(1.5rem, 3vw, 3rem) 0 0;
		}

		.hero__summary {
			padding: 0;
			padding-block-start: clamp(0.5rem, 1.5vw, 1.5rem);
		}

		:global(.listing-page--development .hero__gallery .gallery) {
			max-width: none;
			margin: 0;
			padding: 0;
		}

		:global(.listing-page--development .hero__gallery .gallery__stage) {
			max-height: 74vh;
		}

		:global(.listing-page--development .hero__summary .summary__title) {
			font-size: clamp(1.875rem, 1rem + 2vw, 3rem);
		}
	}

	/* Two-column reading region: about copy left, sticky enquiry rail right. */
	.listing-body {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-lg);
		padding-block: var(--space-lg) var(--space-xl);
		align-items: start;
	}

	.listing-body__main {
		min-width: 0;
	}

	@media (min-width: 880px) {
		.listing-body {
			grid-template-columns: minmax(0, 1fr) clamp(20rem, 30%, 23rem);
			gap: clamp(2.5rem, 5vw, 4.5rem);
		}

		.listing-body__rail {
			position: sticky;
			top: calc(var(--nav-height) + var(--space-md));
		}
	}

	/* Mobile: photo-first — the gallery is pulled above its DOM-preceding breadcrumbs. */
	@media (max-width: 760px) {
		.listing-page--development {
			display: flex;
			flex-direction: column;
		}

		/* `.content-wrap` centres itself with margin-inline:auto; inside this flex
		   column that shrinks each section to its content width instead of filling,
		   so Location and Similar rendered narrower than the rest. Force full width.
		   `:global` is required because these sections are rendered by child
		   components and don't carry this component's scope hash. */
		.listing-page--development > :global(.content-wrap) {
			width: 100%;
		}

		.hero__gallery {
			order: -1;
		}

		.hero__summary {
			display: flex;
			flex-direction: column;
		}

		/* The gallery comes first on phones, so the actions would otherwise land the best
		   part of a screen below the fold. Drop the key-facts strip beneath them: the buyer
		   reads the price, then immediately meets the way into the inventory.

		   Reordering visually is safe here specifically because the strip is a <dl> with no
		   focusable content — there is no DOM-vs-visual tab-order mismatch to create. */
		.hero__summary > :global(.key-facts) {
			order: 1;
		}

		/* Fill the column on phones: a comfortable thumb target, not a minimal one. */
		.hero__cta {
			flex: 1 1 auto;
		}
	}
</style>
