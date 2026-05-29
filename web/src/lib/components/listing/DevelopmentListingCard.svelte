<script lang="ts">
	import { buildListingHref } from '$lib/listing/canonicalPath';
	import { formatEnumLabel, shouldShowDevelopmentPricing } from '$lib/listing/developmentDisplay';
	import { formatListingPrice } from '$lib/listing/formatPrice';
	import { CARD_HERO_IMAGE } from '$lib/sanity/transforms/propertyCard';
	import type { PublicDevelopmentCard } from '$lib/sanity/transforms/similarListingCard';

	type Props = {
		card: PublicDevelopmentCard;
	};

	let { card }: Props = $props();

	const href = $derived(buildListingHref({ slug: card.slug, location: card.location }));
	const price = $derived(
		shouldShowDevelopmentPricing(card.developmentDisplayMode)
			? formatListingPrice(card.pricing)
			: null
	);
	const locationLine = $derived(card.location?.addressDisplay ?? null);
	const statusLine = $derived(formatEnumLabel(card.developmentStatus));
	const imageAlt = $derived(card.heroImageAlt ?? card.publicTitle ?? 'Development listing');
</script>

{#snippet cardBody()}
	{#if card.heroImageUrl}
		<img
			class="development-card__image"
			src={card.heroImageUrl}
			alt={imageAlt}
			width={CARD_HERO_IMAGE.width}
			height={CARD_HERO_IMAGE.height}
			loading="lazy"
		/>
	{/if}

	<div class="development-card__body">
		<p class="development-card__badge">Development</p>

		{#if locationLine}
			<p class="development-card__location">{locationLine}</p>
		{/if}

		{#if card.publicTitle}
			<h3 class="development-card__title">{card.publicTitle}</h3>
		{/if}

		{#if statusLine}
			<p class="development-card__status">{statusLine}</p>
		{/if}

		{#if price}
			<p class="development-card__price tabular-nums">{price}</p>
		{/if}
	</div>
{/snippet}

{#if href}
	<a class="development-card" {href} aria-label={card.publicTitle ?? 'View development listing'}>
		{@render cardBody()}
	</a>
{:else}
	<article class="development-card">
		{@render cardBody()}
	</article>
{/if}

<style>
	.development-card {
		display: block;
		border: 1px solid var(--border);
		background: var(--white);
		color: inherit;
		text-decoration: none;
	}

	a.development-card:hover .development-card__title,
	a.development-card:focus-visible .development-card__title {
		color: var(--green);
	}

	.development-card__image {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 2;
		object-fit: cover;
	}

	.development-card__body {
		padding: var(--space-lg);
	}

	.development-card__badge {
		margin-bottom: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.development-card__location {
		margin-bottom: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	.development-card__title {
		margin: 0;
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 400;
		color: var(--green);
		line-height: 1.3;
	}

	.development-card__status {
		margin-top: var(--space-sm);
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.development-card__price {
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
	}
</style>
