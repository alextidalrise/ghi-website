<script lang="ts">
	import { buildListingHref } from '$lib/listing/canonicalPath';
	import {
		buildDevelopmentMetaParts,
		formatDevelopmentCardPrice
	} from '$lib/listing/developmentCardDisplay';
	import { shouldShowDevelopmentPricing } from '$lib/listing/developmentDisplay';
	import { CARD_HERO_IMAGE } from '$lib/sanity/transforms/propertyCard';
	import type { PublicDevelopmentCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		card: PublicDevelopmentCard;
	};

	let { card }: Props = $props();

	const href = $derived(
		buildListingHref({
			slug: card.slug,
			countrySlug: card.countrySlug,
			locationSlug: card.locationSlug,
			communitySlug: card.communitySlug,
			isCatchAll: card.isCatchAll,
			location: card.location
		})
	);
	const price = $derived(
		shouldShowDevelopmentPricing(card.developmentDisplayMode)
			? formatDevelopmentCardPrice(card.pricing)
			: null
	);
	// Match PropertyCard: prefer the community name, falling back to the full address.
	const locationLine = $derived(card.location?.community?.name ?? card.location?.addressDisplay ?? null);
	const specsLine = $derived(buildDevelopmentMetaParts(card).join(' · ') || null);
	const imageAlt = $derived(card.heroImageAlt ?? card.title ?? 'Development');
</script>

{#snippet cardBody()}
	{#if card.heroImageUrl}
		<img
			class="property-card__image"
			src={card.heroImageUrl}
			alt={imageAlt}
			width={CARD_HERO_IMAGE.width}
			height={CARD_HERO_IMAGE.height}
			loading="lazy"
			decoding="async"
			style:background-image={card.heroImageLqip ? `url(${card.heroImageLqip})` : undefined}
		/>
	{/if}

	<div class="property-card__body">
		<p class="property-card__kicker">Development</p>

		{#if card.title}
			<h3 class="property-card__title">{card.title}</h3>
		{/if}

		{#if locationLine}
			<p class="property-card__location">{locationLine}</p>
		{/if}

		{#if specsLine || price}
			<div class="property-card__meta">
				{#if specsLine}
					<span class="property-card__specs">{specsLine}</span>
				{/if}
				{#if price}
					<span class="property-card__price tabular-nums">{price}</span>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

{#if href}
	<a class="property-card" {href} aria-label={card.title ?? 'View development'}>
		{@render cardBody()}
	</a>
{:else}
	<article class="property-card">
		{@render cardBody()}
	</article>
{/if}

<style>
	/* Frame mirrors PropertyCard so developments sit cleanly in the same grid row. */
	.property-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid var(--border);
		background: var(--white);
		color: inherit;
		text-decoration: none;
	}

	a.property-card:hover .property-card__title,
	a.property-card:focus-visible .property-card__title {
		color: var(--green);
	}

	.property-card__image {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 3 / 2;
		object-fit: cover;
		/* Blurred LQIP shows through until the real image paints over it. */
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.property-card__body {
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: clamp(0.875rem, 0.6rem + 1vw, 1.125rem);
	}

	/* A quiet gold tag marks the card as a development rather than a single home. */
	.property-card__kicker {
		margin-bottom: 0.375rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 600;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	.property-card__location {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.property-card__title {
		margin: 0 0 0.375rem;
		font-family: var(--serif);
		font-size: clamp(1.0625rem, 0.95rem + 0.5vw, 1.1875rem);
		font-weight: 400;
		color: var(--green);
		line-height: 1.25;
		text-wrap: balance;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.property-card__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.125rem 0.75rem;
		margin-top: auto;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
	}

	.property-card__specs {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.property-card__price {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		color: var(--green);
	}
</style>
