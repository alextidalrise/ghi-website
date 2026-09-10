<script lang="ts">
	import { APPROX_MARKER, formatListingPriceParts, type PriceParts } from '$lib/listing/formatPrice';
	import { developmentPriceParts } from '$lib/listing/developmentCardDisplay';
	import { CURRENCIES, type Currency } from '$lib/currency/rates';
	import { isCurrency } from '$lib/currency/convert';
	import { getCurrencyRates } from '$lib/currency/currency.svelte';
	import type { PublicPricing } from '$lib/sanity/transforms/pricingFilter';

	/**
	 * A listing price that follows the visitor's chosen currency without a re-render.
	 *
	 * Pages are edge-cached as visitor-invariant HTML, so the server cannot know the choice.
	 * Instead every variant is rendered — the native figure plus a rounded "approx." conversion
	 * for each other currency — and `html[data-currency]` (set before first paint from the
	 * cookie, flipped by CurrencyStore afterwards) picks the visible one in CSS. Hidden variants
	 * are `display:none`, so assistive tech reads exactly one price. Same-currency listings
	 * show their exact figure with no marker; POA and free-text prices never convert.
	 */
	type Props = {
		pricing: PublicPricing | null | undefined;
		/** A development frames a bare single figure as a starting price and hides POA. */
		frame?: 'listing' | 'development';
		/**
		 * How the listing's own price is disclosed when a conversion is showing: `hint` (title on
		 * hover/focus + a screen-reader suffix — cards), `line` (a visible second line — detail
		 * summaries and unit rows), or `none`.
		 */
		native?: 'hint' | 'line' | 'none';
		/** Rendered when nothing may show, and in place of a bare "POA". Null renders nothing. */
		fallback?: string | null;
	};

	let { pricing, frame = 'listing', native = 'hint', fallback = null }: Props = $props();

	const { rates } = getCurrencyRates();

	const partsFor = (to: Currency | null): PriceParts | null =>
		frame === 'development'
			? developmentPriceParts(pricing, { to, rates })
			: formatListingPriceParts(pricing, { to, rates });

	const own = $derived(partsFor(null));
	/** The native code when it is one the table knows; otherwise nothing converts. */
	const nativeCurrency = $derived(own && isCurrency(own.currency) ? own.currency : null);
	const convertible = $derived(
		own !== null && nativeCurrency !== null && (own.kind === 'single' || own.kind === 'range')
	);
	const variants = $derived(
		convertible
			? CURRENCIES.map((to) => ({ to, parts: partsFor(to)! }))
			: []
	);
	const listedAt = $derived(
		own ? `Listed ${own.prefix === 'From' ? 'from' : 'at'} ${own.figure}` : ''
	);
</script>

{#if !own || (own.kind === 'poa' && fallback)}
	{#if fallback}<span class="price price--plain">{fallback}</span>{/if}
{:else if !convertible}
	<span class="price price--plain"
		>{#if own.prefix}{own.prefix}{' '}{/if}{own.figure}</span
	>
{:else}
	<span class="price" data-price data-native-ccy={nativeCurrency}>
		{#each variants as { to, parts } (to)}
			{#if parts.approx}
				<span
					class="price__v"
					data-ccy={to}
					title={native === 'hint' ? listedAt : undefined}
					>{#if parts.prefix}{parts.prefix}{' '}{/if}<span class="price__approx">{APPROX_MARKER}</span>
					{parts.figure}{#if native === 'hint'}<span class="visually-hidden">, {listedAt.toLowerCase()}</span
						>{/if}</span
				>
			{:else}
				<span class="price__v" data-ccy={to} data-native
					>{#if parts.prefix}{parts.prefix}{' '}{/if}{parts.figure}</span
				>
			{/if}
		{/each}
		{#if native === 'line'}
			<span class="price__native">{listedAt}</span>
		{/if}
	</span>
{/if}

<style>
	.price {
		display: inline;
	}

	/* Exactly one variant is visible. Which one is decided on <html>, by the pre-paint script
	   and then by CurrencyStore — never by the server, so the cached document stays identical
	   for every visitor. The native variant shows whenever the root carries no recognised
	   choice, so a stale or tampered value can never blank a price. */
	.price__v {
		display: none;
	}

	:global(html:not([data-currency='EUR']):not([data-currency='GBP']):not([data-currency='USD']):not(
			[data-currency='AED']
		))
		.price__v[data-native] {
		display: inline;
	}

	:global(html[data-currency='EUR']) .price__v[data-ccy='EUR'],
	:global(html[data-currency='GBP']) .price__v[data-ccy='GBP'],
	:global(html[data-currency='USD']) .price__v[data-ccy='USD'],
	:global(html[data-currency='AED']) .price__v[data-ccy='AED'] {
		display: inline;
	}

	/* The marker: the site's UI sans at a small size, inheriting the figure's colour so it
	   clears contrast wherever the figure does (white cards, the green band). */
	.price__approx {
		font-family: var(--sans);
		font-size: clamp(0.6875rem, 0.45em, 0.875rem);
		font-weight: 400;
		font-style: normal;
		letter-spacing: 0.03em;
		text-transform: none;
		vertical-align: baseline;
	}

	/* The listing's own price beneath a conversion (detail summaries, unit rows). Present in
	   the markup for every listing; visible only while a different currency is showing. */
	.price__native {
		display: none;
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 400;
		font-style: normal;
		letter-spacing: normal;
		line-height: 1.4;
		text-transform: none;
		color: var(--muted);
		margin-top: 0.4rem;
	}

	:global(html[data-currency]) .price__native {
		display: block;
	}

	:global(html[data-currency='EUR']) .price[data-native-ccy='EUR'] .price__native,
	:global(html[data-currency='GBP']) .price[data-native-ccy='GBP'] .price__native,
	:global(html[data-currency='USD']) .price[data-native-ccy='USD'] .price__native,
	:global(html[data-currency='AED']) .price[data-native-ccy='AED'] .price__native {
		display: none;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
