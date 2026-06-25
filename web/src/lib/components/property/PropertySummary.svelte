<script lang="ts">
	import type { PublicPropertyListing } from '$lib/sanity/transforms';
	import { formatListingPrice, formatPropertyType } from '$lib/listing/formatPrice';

	type Props = {
		listing: PublicPropertyListing;
	};

	let { listing }: Props = $props();

	/** Course-proximity badge label. Only the relevances worth surfacing map here;
	    none / unknown / manual_enrichment_needed deliberately fall through to null. */
	const GOLF_BADGE: Record<string, string> = {
		frontline_golf: 'Frontline golf',
		golf_view: 'Golf views',
		golf_resort: 'Golf resort',
		near_golf: 'Near golf',
		close_to_golf: 'Close to golf'
	};

	const locationParts = $derived(
		[
			listing.location?.community?.name,
			listing.location?.location?.name,
			listing.location?.country?.name
		].filter((part): part is string => Boolean(part))
	);

	const locationLine = $derived(
		locationParts.length > 0 ? locationParts.join(', ') : (listing.location?.addressDisplay ?? null)
	);

	function escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/** CMS titles often append the location ("Arco Iris — Marbella", "Villa
	    Solstice, Las Brisas, Nueva Andalucia"), which the location line below then
	    repeats. Strip any trailing location echo (a separator followed by one of
	    this listing's place names), leaving the property's own name. Never strips
	    to empty, so a title that is purely a place name is preserved. */
	const displayTitle = $derived.by(() => {
		const raw = (listing.title ?? '').trim();
		if (!raw || locationParts.length === 0) return raw || 'Property';

		let title = raw;
		let changed = true;
		while (changed) {
			changed = false;
			for (const name of locationParts) {
				const re = new RegExp(`\\s*[—–\\-,]\\s*${escapeRegExp(name)}\\s*$`, 'i');
				const next = title.replace(re, '').trim();
				if (next && next !== title) {
					title = next;
					changed = true;
				}
			}
		}
		return title || raw;
	});

	const priceLabel = $derived.by(() => {
		const price = formatListingPrice(listing.pricing);
		if (!price || price === 'POA') return 'Price on application';
		return price;
	});

	const goldBadge = $derived(
		listing.golf?.golfRelevance ? (GOLF_BADGE[listing.golf.golfRelevance] ?? null) : null
	);

	const outlineBadge = $derived.by(() => {
		const status = listing.pricing?.completionStatus;
		if (status && status !== 'unknown') {
			return status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
		}
		return formatPropertyType(listing.propertyType) || null;
	});

	// Built is the default; treat an unset value (legacy listings) as Built too.
	const buildStatusBadge = $derived.by(() => {
		const specs = listing.specs as Record<string, unknown> | null | undefined;
		return specs?.buildStatus === 'off_plan' ? 'Off-Plan' : 'Built';
	});
</script>

<header class="summary">
	<h1 class="summary__title">{displayTitle}</h1>
	{#if locationLine}
		<p class="summary__location">{locationLine}</p>
	{/if}

	<div class="summary__meta">
		<p class="summary__price tabular-nums">{priceLabel}</p>
		<ul class="summary__badges">
			{#if goldBadge}
				<li class="badge badge--gold">{goldBadge}</li>
			{/if}
			<li class="badge badge--outline">{buildStatusBadge}</li>
			{#if outlineBadge}
				<li class="badge badge--outline">{outlineBadge}</li>
			{/if}
		</ul>
	</div>
</header>

<style>
	.summary__title {
		max-width: 16ch;
	}

	.summary__location {
		margin-top: var(--space-sm);
		font-size: var(--text-ui);
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted);
	}

	.summary__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-sm) var(--space-lg);
		margin-top: var(--space-md);
	}

	.summary__price {
		font-family: var(--serif);
		font-size: var(--text-h2);
		color: var(--green);
		line-height: 1;
	}

	.summary__badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style: none;
	}

	.badge {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		padding: 0.4rem 0.7rem;
		line-height: 1;
	}

	.badge--gold {
		background: var(--gold);
		color: var(--green);
	}

	.badge--outline {
		border: 1px solid var(--green);
		color: var(--green);
	}
</style>
