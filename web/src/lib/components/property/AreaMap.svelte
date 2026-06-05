<script lang="ts">
	import type { PublicMapPayload } from '$lib/sanity/transforms/mapPrivacy';
	import { buildOsmEmbedUrl, buildOsmExternalUrl } from '$lib/listing/osmEmbed';

	type Props = {
		map: PublicMapPayload | null | undefined;
	};

	let { map }: Props = $props();

	const coords = $derived(map?.coordinates ?? null);
	const embedUrl = $derived(buildOsmEmbedUrl(coords));
	const externalUrl = $derived(buildOsmExternalUrl(coords));
</script>

{#if embedUrl}
	<div class="area-map">
		<iframe
			title="Community area map"
			src={embedUrl}
			loading="lazy"
			referrerpolicy="no-referrer-when-downgrade"
		></iframe>
		<div class="area-map__footer">
			{#if map?.level === 'area_only'}
				<p class="area-map__note">Map shows the community area, not the exact property location.</p>
			{/if}
			{#if externalUrl}
				<a class="area-map__link" href={externalUrl} target="_blank" rel="noopener noreferrer">
					Open map in new tab
				</a>
			{/if}
		</div>
	</div>
{/if}

<style>
	.area-map iframe {
		width: 100%;
		height: min(26rem, 60vw);
		border: 1px solid var(--border);
		background: var(--white);
	}

	.area-map__footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem var(--space-md);
		margin-top: 0.65rem;
	}

	.area-map__note {
		font-size: var(--text-small);
		color: var(--muted);
	}

	.area-map__link {
		font-size: var(--text-ui);
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
		white-space: nowrap;
	}

	.area-map__link:hover,
	.area-map__link:focus-visible {
		color: var(--gold);
	}
</style>
