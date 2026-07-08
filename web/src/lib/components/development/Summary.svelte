<script lang="ts">
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import { formatListingPrice } from '$lib/listing/formatPrice';

	type Props = {
		development: PublicDevelopment;
		showPricing?: boolean;
	};

	let { development, showPricing = true }: Props = $props();

	/** Course-proximity badge label — mirrors PropertySummary's GOLF_BADGE map. */
	const GOLF_BADGE: Record<string, string> = {
		frontline_golf: 'Frontline golf',
		golf_view: 'Golf views',
		golf_resort: 'Golf resort',
		near_golf: 'Near golf',
		close_to_golf: 'Close to golf'
	};

	const locationParts = $derived(
		[
			development.location?.community?.name,
			development.location?.location?.name,
			development.location?.country?.name
		].filter((part): part is string => Boolean(part))
	);

	/** Drop a segment that repeats the one before it (case-insensitive) so a
	    development whose community and location share a name renders "Palmares,
	    Portugal" rather than "Palmares, Palmares, Portugal". */
	const locationLine = $derived.by(() => {
		const parts = locationParts.filter(
			(part, i) => i === 0 || part.toLowerCase() !== locationParts[i - 1].toLowerCase()
		);
		return parts.length > 0 ? parts.join(', ') : (development.location?.addressDisplay ?? null);
	});

	function escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	const displayTitle = $derived.by(() => {
		const raw = (development.title ?? development.developmentName ?? '').trim();
		if (!raw || locationParts.length === 0) return raw || 'Development';

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
		if (!showPricing) return 'Price on application';
		const price = formatListingPrice(development.pricing);
		if (!price || price === 'POA') return 'Price on application';
		// A development range already reads "From €…"; a single figure is framed as a starting price.
		return /^(from|guide)/i.test(price) || price.includes('–') ? price : `From ${price}`;
	});

	const goldBadge = $derived(
		development.golf?.golfRelevance ? (GOLF_BADGE[development.golf.golfRelevance] ?? null) : null
	);

	// Outline badges come from the curated composition summary (e.g. "Apartments",
	// "Penthouses"), capped so the row stays calm.
	const outlineBadges = $derived(
		(development.developmentComposition ?? [])
			.map((item) => item?.trim())
			.filter((item): item is string => Boolean(item))
			.slice(0, 2)
	);
</script>

<header class="summary">
	<h1 class="summary__title">{displayTitle}</h1>
	{#if locationLine}
		<p class="summary__location">{locationLine}</p>
	{/if}

	<div class="summary__meta">
		<p class="summary__price tabular-nums">{priceLabel}</p>
		{#if goldBadge || outlineBadges.length > 0}
			<ul class="summary__badges">
				{#if goldBadge}
					<li class="badge badge--gold">{goldBadge}</li>
				{/if}
				{#each outlineBadges as badge (badge)}
					<li class="badge badge--outline">{badge}</li>
				{/each}
			</ul>
		{/if}
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
