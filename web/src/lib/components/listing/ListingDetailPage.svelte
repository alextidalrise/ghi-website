<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import ContentSection from '$lib/components/property/ContentSection.svelte';
	import EnquiryRail from '$lib/components/property/EnquiryRail.svelte';
	import PropertyLocation from '$lib/components/property/PropertyLocation.svelte';
	import PropertyDetail from '$lib/components/property/PropertyDetail.svelte';
	import SimilarProperties from '$lib/components/listing/SimilarProperties.svelte';
	import DevelopmentGallery from '$lib/components/development/Gallery.svelte';
	import DevelopmentKeyFacts from '$lib/components/development/KeyFacts.svelte';
	import DevelopmentSummary from '$lib/components/development/Summary.svelte';
	import SharedAmenities from '$lib/components/development/SharedAmenities.svelte';
	import UnitsInventory from '$lib/components/development/UnitsInventory.svelte';
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import type { EnquiryFormResult } from '$lib/listing/enquiryAction';
	import { shouldShowDevelopmentPricing } from '$lib/listing/developmentDisplay';
	import type { PublicDevelopment, PublicPropertyListing } from '$lib/sanity/transforms';
	import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		pageType: 'property' | 'development';
		property?: PublicPropertyListing | null;
		development?: PublicDevelopment | null;
		breadcrumbs: BreadcrumbItem[];
		similarCards?: SimilarListingCard[];
		form?: EnquiryFormResult | null;
	};

	let {
		pageType,
		property = null,
		development = null,
		breadcrumbs,
		similarCards = [],
		form = null
	}: Props = $props();

	const displayMode = $derived(development?.developmentDisplayMode ?? 'flat_listing');
	const showInventoryPricing = $derived(shouldShowDevelopmentPricing(displayMode));
	const enquireLabel = $derived(
		development?.ctas?.primaryCtaLabel ?? 'Enquire about this development'
	);

	// The final breadcrumb is the development itself; its href is the canonical path
	// that unit rows nest under.
	const developmentPath = $derived(breadcrumbs[breadcrumbs.length - 1]?.href ?? '');

	// Country / location / community crumbs, most-specific first — the "Back to" rail.
	const backLinks = $derived(
		breadcrumbs
			.slice(1, -1)
			.filter((item): item is { label: string; href: string } => Boolean(item.href))
			.reverse()
	);
</script>

{#if pageType === 'property' && property}
	<PropertyDetail {property} {breadcrumbs} {similarCards} {form} />
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
				<a class="hero__cta" href="#enquire">{enquireLabel}</a>
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

		{#if similarCards.length > 0}
			<SimilarProperties cards={similarCards} />
		{/if}

		{#if backLinks.length > 0}
			<nav class="back-to content-wrap" aria-label="Back to area">
				<span class="back-to__label">Back to</span>
				<ul class="back-to__list">
					{#each backLinks as link (link.href)}
						<li><a class="back-to__link" href={link.href}>{link.label}</a></li>
					{/each}
				</ul>
			</nav>
		{/if}
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

	.hero__cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: var(--space-lg);
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
			border-color var(--duration-hover) var(--ease);
	}

	.hero__cta:hover,
	.hero__cta:focus-visible {
		background: var(--green);
		color: var(--white);
		border-color: var(--green);
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
	}

	/* "Back to" area rail — quiet outline chips, square corners, no fills at rest. */
	.back-to {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm) var(--space-md);
		padding-block: var(--space-xl);
		border-top: 1px solid var(--border);
	}

	.back-to__label {
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.back-to__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		list-style: none;
	}

	.back-to__link {
		display: inline-flex;
		padding: 0.55rem 1.1rem;
		border: 1px solid var(--border);
		color: var(--green);
		font-size: var(--text-ui);
		text-decoration: none;
		transition:
			border-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.back-to__link:hover,
	.back-to__link:focus-visible {
		border-color: var(--green);
		color: var(--charcoal);
	}
</style>
