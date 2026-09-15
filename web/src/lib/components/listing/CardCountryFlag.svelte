<script lang="ts">
	/**
	 * The country flag stamp overlaid on a listing card photo, used only on mixed-country
	 * surfaces (homepage Featured/Frontline rails, the Front Line Collection grid) where
	 * cards from different countries sit together and the flag disambiguates at a glance.
	 * Single-country surfaces (country/location/golf pages, the same-area Similar rail)
	 * never mount it.
	 *
	 * Legibility over unpredictable photography, kept as quiet as possible. The flag sits
	 * directly on the photo — no white matte block (it read as a hard, over-bright chip) —
	 * carried only by a whisper-thin white frame (rgba .6). The flag's own coloured/dark
	 * bands do most of the separating; the frame lifts it off dark photos and is a harmless
	 * whisper on bright ones. The one soft spot is a white-banded flag (UAE) over a pure-white
	 * photo region, where the top edge blurs — the other bands still identify it. No scrim,
	 * no shadow, square corners.
	 *
	 * Decorative only: aria-hidden and pointer-events:none, so it never intercepts the
	 * card's own link and the country name in the text carries the meaning.
	 */
	import CountryFlagArt from '../CountryFlagArt.svelte';

	type Props = {
		slug?: string | null;
		flagUrl?: string | null;
	};

	let { slug, flagUrl }: Props = $props();

	// Render only when there is a real flag to show — a Sanity SVG, or one of the built-in
	// stamps CountryFlagArt draws (spain/portugal). Never its neutral-green fallback field:
	// a blank green square over a photo is meaningless, worse than nothing.
	const hasFlag = $derived(Boolean(flagUrl) || slug === 'spain' || slug === 'portugal');
</script>

{#if hasFlag}
	<span class="card-flag" aria-hidden="true">
		<CountryFlagArt {slug} {flagUrl} />
	</span>
{/if}

<style>
	.card-flag {
		position: absolute;
		bottom: var(--space-xs);
		left: var(--space-xs);
		z-index: 1;
		display: block;
		line-height: 0;
		/* Whisper-thin frame, no matte block: lifts the flag off dark photos, stays quiet on bright. */
		border: 1px solid rgba(255, 255, 255, 0.6);
		pointer-events: none; /* decorative — let clicks fall through to the card link */
	}

	/* Size the flag artwork (CountryFlagArt renders a 3:2 <img> or inline <svg>). */
	.card-flag :global(img),
	.card-flag :global(svg) {
		display: block;
		width: 1.375rem; /* 22px */
		height: auto;
		aspect-ratio: 3 / 2;
	}
</style>
