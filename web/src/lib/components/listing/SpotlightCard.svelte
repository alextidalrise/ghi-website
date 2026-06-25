<script lang="ts">
	import { buildListingHref } from '$lib/listing/canonicalPath';
	import {
		buildDevelopmentMetaParts,
		formatDevelopmentCardPrice
	} from '$lib/listing/developmentCardDisplay';
	import { formatEnumLabel, shouldShowDevelopmentPricing } from '$lib/listing/developmentDisplay';
	import { formatListingPrice, formatPropertyType } from '$lib/listing/formatPrice';
	import {
		CARD_HERO_IMAGE,
		type PublicPropertyCard,
		type PublicPropertyCardSpecs
	} from '$lib/sanity/transforms/propertyCard';
	import type { PublicDevelopmentCard } from '$lib/sanity/transforms/similarListingCard';

	/** The rail card renders both a single property and a development. The two share the
	    same media + body skeleton; only the top spec line and pricing rule differ. */
	type Props = {
		/** 'light' for the white Featured/Similar rail, 'green' for the Frontline band. */
		surface?: 'light' | 'green';
	} & (
		| { kind?: 'property'; card: PublicPropertyCard }
		| { kind: 'development'; card: PublicDevelopmentCard }
	);

	let { card, kind = 'property', surface = 'light' }: Props = $props();

	const href = $derived.by(() => {
		if (kind === 'property') {
			const propertyCard = card as PublicPropertyCard;
			return buildListingHref({
				slug: propertyCard.slug,
				countrySlug: propertyCard.countrySlug,
				locationSlug: propertyCard.locationSlug,
				communitySlug: propertyCard.communitySlug,
				isCatchAll: propertyCard.isCatchAll,
				location: propertyCard.location
			});
		}

		return buildListingHref({
			slug: card.slug,
			countrySlug: card.countrySlug,
			locationSlug: card.locationSlug,
			communitySlug: card.communitySlug,
			isCatchAll: card.isCatchAll,
			location: card.location
		});
	});
	const locationLine = $derived(card.location?.addressDisplay ?? null);
	const fallbackName = $derived(kind === 'development' ? 'Development listing' : 'Property listing');
	const imageAlt = $derived(card.heroImageAlt ?? card.title ?? fallbackName);
	const linkLabel = $derived(card.title ?? `View ${fallbackName.toLowerCase()}`);

	const specs = $derived(
		kind === 'development'
			? buildDevelopmentSpecs(card as PublicDevelopmentCard)
			: buildSpecs((card as PublicPropertyCard).propertyType, (card as PublicPropertyCard).specs)
	);

	const price = $derived.by(() => {
		if (kind === 'development') {
			const dev = card as PublicDevelopmentCard;
			return shouldShowDevelopmentPricing(dev.developmentDisplayMode)
				? formatDevelopmentCardPrice(dev.pricing)
				: null;
		}
		return formatListingPrice(card.pricing);
	});

	function buildSpecs(
		propertyType: PublicPropertyCard['propertyType'],
		cardSpecs: PublicPropertyCardSpecs
	): string[] {
		const parts: string[] = [];
		const type = formatPropertyType(propertyType);
		if (type) parts.push(type);
		if (cardSpecs?.bedrooms != null) parts.push(`${cardSpecs.bedrooms} bed`);
		if (cardSpecs?.bathrooms != null) parts.push(`${cardSpecs.bathrooms} bath`);
		return parts;
	}

	function buildDevelopmentSpecs(dev: PublicDevelopmentCard): string[] {
		// Prefer the rich inventory line (beds range · units available) shared with the
		// grid card; fall back to "Development · status" when no inventory is aggregated.
		const parts = buildDevelopmentMetaParts(dev);
		if (parts.length > 0) return parts;

		const fallback: string[] = ['Development'];
		const status = formatEnumLabel(dev.developmentStatus);
		if (status) fallback.push(status);
		return fallback;
	}
</script>

{#snippet cardBody()}
	<span class="spotlight-card__media">
		{#if card.heroImageUrl}
			<img
				class="spotlight-card__img"
				src={card.heroImageUrl}
				alt={imageAlt}
				width={CARD_HERO_IMAGE.width}
				height={CARD_HERO_IMAGE.height}
				loading="lazy"
			/>
		{:else}
			<span class="spotlight-card__img spotlight-card__img--placeholder" aria-hidden="true"></span>
		{/if}
		{#if locationLine && surface !== 'green'}
			<span class="spotlight-card__chip">{locationLine}</span>
		{/if}
	</span>

	<span class="spotlight-card__body">
		{#if specs.length > 0}
			<span class="spotlight-card__specs">
				{#each specs as spec}<span>{spec}</span>{/each}
			</span>
		{/if}

		{#if card.title}
			<h3 class="spotlight-card__title">{card.title}</h3>
		{/if}

		{#if price}
			<span class="spotlight-card__price tabular-nums">{price}</span>
		{/if}
	</span>
{/snippet}

{#if href}
	<a class="spotlight-card spotlight-card--{surface}" {href} aria-label={linkLabel}>
		{@render cardBody()}
	</a>
{:else}
	<article class="spotlight-card spotlight-card--{surface}">
		{@render cardBody()}
	</article>
{/if}

<style>
	.spotlight-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: inherit;
		text-decoration: none;
		transition: transform var(--duration-lift) var(--ease);
	}

	.spotlight-card--light {
		border: 1px solid var(--border);
		background: var(--white);
	}

	.spotlight-card__media {
		position: relative;
		display: block;
		aspect-ratio: 3 / 2;
		overflow: hidden;
	}

	/* Gold hairline frames the photograph on the dark premier band. */
	.spotlight-card--green .spotlight-card__media {
		border: 1px solid oklch(0.82 0.05 85 / 0.5);
		transition: border-color var(--duration-lift) var(--ease);
	}

	.spotlight-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.spotlight-card__img--placeholder {
		background: var(--border);
	}

	.spotlight-card--green .spotlight-card__img--placeholder {
		background: oklch(0.3 0.03 165);
	}

	.spotlight-card__chip {
		position: absolute;
		bottom: 0.85rem;
		left: 0.85rem;
		padding: 0.35rem 0.7rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: var(--white);
		color: var(--charcoal);
	}

	.spotlight-card__body {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.spotlight-card--light .spotlight-card__body {
		padding: var(--space-md);
	}

	/* On green the body floats on the band; only the top needs separating room. */
	.spotlight-card--green .spotlight-card__body {
		padding-top: var(--space-md);
	}

	.spotlight-card__specs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.7rem;
		font-family: var(--sans);
		font-size: var(--text-small);
	}

	.spotlight-card--light .spotlight-card__specs {
		color: var(--muted);
	}

	.spotlight-card--green .spotlight-card__specs {
		color: oklch(0.86 0.02 85 / 0.82);
	}

	.spotlight-card__specs span:not(:last-child)::after {
		content: '';
		display: inline-block;
		width: 3px;
		height: 3px;
		margin-left: 0.7rem;
		border-radius: 50%;
		background: var(--gold);
		vertical-align: middle;
	}

	.spotlight-card__title {
		margin: 0.5rem 0 0;
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h4);
		line-height: 1.2;
	}

	.spotlight-card--light .spotlight-card__title {
		color: var(--green);
	}

	.spotlight-card--green .spotlight-card__title {
		color: var(--on-green);
	}

	/* Anchor the price to the bottom of the body. In an equal-height rail, a card whose
	   neighbour has a taller (wrapping) title would otherwise inherit that slack as dead
	   space under its price. `auto` pushes the price down so every card keeps even bottom
	   padding and prices align across the rail; it never collapses below the natural
	   title-to-price gap on the tallest-content card. */
	.spotlight-card__price {
		margin-top: auto;
		padding-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.spotlight-card--light .spotlight-card__price {
		color: var(--charcoal);
	}

	.spotlight-card--green .spotlight-card__price {
		color: var(--gold);
	}

	/* Hover / focus: lift the card, ease the photograph in. */
	a.spotlight-card:hover,
	a.spotlight-card:focus-visible {
		transform: translateY(-6px);
	}

	a.spotlight-card:hover .spotlight-card__img,
	a.spotlight-card:focus-visible .spotlight-card__img {
		transform: scale(1.03);
	}

	/* On the premier band, the gold photo frame brightens on hover. */
	a.spotlight-card--green:hover .spotlight-card__media,
	a.spotlight-card--green:focus-visible .spotlight-card__media {
		border-color: oklch(0.82 0.07 85 / 0.85);
	}

	a.spotlight-card:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		a.spotlight-card:hover,
		a.spotlight-card:focus-visible,
		a.spotlight-card:hover .spotlight-card__img,
		a.spotlight-card:focus-visible .spotlight-card__img {
			transform: none;
		}
	}
</style>
