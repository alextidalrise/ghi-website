<script lang="ts">
	import type { PublicMapPayload } from '$lib/sanity/transforms/mapPrivacy';
	import PortableTextBlock from './PortableTextBlock.svelte';
	import type { PortableTextBlock as PtBlock } from '@portabletext/types';

	type Props = {
		description: PtBlock[] | null | undefined;
		address: string | null | undefined;
		map: PublicMapPayload | null | undefined;
	};

	let { description, address, map }: Props = $props();

	const coords = $derived(map?.coordinates ?? null);
	const mapLabel = $derived(map?.label ?? address ?? null);

	const embedUrl = $derived.by(() => {
		if (!coords) return null;
		const delta = map?.level === 'area_only' ? 0.04 : 0.012;
		const left = coords.lng - delta;
		const right = coords.lng + delta;
		const top = coords.lat + delta;
		const bottom = coords.lat - delta;
		return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;
	});

	const externalMapUrl = $derived(
		coords ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=14/${coords.lat}/${coords.lng}` : null
	);
</script>

<section class="location" aria-labelledby="location-heading">
	<div class="content-wrap location__grid">
		<div class="location__copy">
			<h2 id="location-heading">Location</h2>
			{#if mapLabel}
				<p class="location__address">{mapLabel}</p>
			{/if}
			<PortableTextBlock value={description} />
			{#if externalMapUrl}
				<p class="location__link-wrap">
					<a href={externalMapUrl} target="_blank" rel="noopener noreferrer">Open map in new tab</a>
				</p>
			{/if}
		</div>

		{#if embedUrl}
			<div class="location__map">
				<iframe
					title="Approximate property location"
					src={embedUrl}
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				></iframe>
				{#if map?.level === 'approximate' || map?.level === 'area_only'}
					<p class="location__map-note">Map shows an approximate location for privacy.</p>
				{/if}
			</div>
		{/if}
	</div>
</section>

<style>
	.location {
		padding-block: var(--space-xl);
	}

	.location__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-lg);
	}

	@media (min-width: 900px) {
		.location__grid {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}

	.location__copy h2 {
		margin-bottom: var(--space-sm);
	}

	.location__address {
		font-family: var(--serif);
		font-size: 1.125rem;
		color: var(--green);
		margin-bottom: var(--space-md);
	}

	.location__link-wrap {
		margin-top: var(--space-md);
		font-size: var(--text-ui);
	}

	.location__link-wrap a {
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.location__map iframe {
		width: 100%;
		height: min(24rem, 55vw);
		border: 1px solid var(--border);
		background: var(--linen);
	}

	.location__map-note {
		margin-top: 0.65rem;
		font-size: var(--text-small);
		color: var(--muted);
	}
</style>
