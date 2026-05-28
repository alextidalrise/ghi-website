<script lang="ts">
	import { buildListingHref } from '$lib/listing/canonicalPath';
	import { formatListingPrice } from '$lib/listing/formatPrice';
	import {
		CARD_HERO_IMAGE,
		type PublicPropertyCard,
		type PublicPropertyCardSpecs
	} from '$lib/sanity/transforms/propertyCard';

	type Props = {
		card: PublicPropertyCard;
	};

	let { card }: Props = $props();

	const href = $derived(buildListingHref({ slug: card.slug, location: card.location }));
	const price = $derived(formatListingPrice(card.pricing));
	const locationLine = $derived(card.location?.addressDisplay ?? null);
	const specsLine = $derived(formatSpecs(card.specs));
	const imageAlt = $derived(card.heroImageAlt ?? card.publicTitle ?? 'Property listing');

	function formatSpecs(specs: PublicPropertyCardSpecs): string | null {
		if (!specs) return null;

		const parts: string[] = [];
		if (specs.bedrooms != null) parts.push(`${specs.bedrooms} bed`);
		if (specs.bathrooms != null) parts.push(`${specs.bathrooms} bath`);

		return parts.length > 0 ? parts.join(' · ') : null;
	}
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
		/>
	{/if}

	<div class="property-card__body">
		{#if locationLine}
			<p class="property-card__location">{locationLine}</p>
		{/if}

		{#if card.publicTitle}
			<h3 class="property-card__title">{card.publicTitle}</h3>
		{/if}

		{#if specsLine}
			<p class="property-card__specs">{specsLine}</p>
		{/if}

		{#if price}
			<p class="property-card__price tabular-nums">{price}</p>
		{/if}
	</div>
{/snippet}

{#if href}
	<a class="property-card" {href} aria-label={card.publicTitle ?? 'View property listing'}>
		{@render cardBody()}
	</a>
{:else}
	<article class="property-card">
		{@render cardBody()}
	</article>
{/if}

<style>
	.property-card {
		display: block;
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
		aspect-ratio: 3 / 2;
		object-fit: cover;
	}

	.property-card__body {
		padding: var(--space-lg);
	}

	.property-card__location {
		margin-bottom: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	.property-card__title {
		margin: 0;
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 400;
		color: var(--green);
		line-height: 1.3;
	}

	.property-card__specs {
		margin-top: var(--space-sm);
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.property-card__price {
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
	}
</style>
