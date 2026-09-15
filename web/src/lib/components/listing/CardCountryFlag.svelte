<script lang="ts">
	/**
	 * The country flag stamp overlaid on a listing card photo, used only on mixed-country
	 * surfaces (homepage Featured/Frontline rails, the Front Line Collection grid) where
	 * cards from different countries sit together and the flag disambiguates at a glance.
	 * Single-country surfaces (country/location/golf pages, the same-area Similar rail)
	 * never mount it.
	 *
	 * Legibility over unpredictable photography is the whole job. The flag sits on a small
	 * tight WHITE MATTE so its own edges never touch the photo — that separates it on ~every
	 * image, dark ones especially, and protects flags that carry white/pale yellow (Spain's
	 * gold, Portugal's yellow) against a bright sky. No outline: an explicit hairline read as
	 * a hard, over-bright chip on the photo, so the matte alone carries the separation (the
	 * flag's own colour still reads against the rare white-on-white pale sky). No scrim, no shadow.
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
		padding: 2px; /* tight white matting: the flag never touches the photo, no hard chip */
		line-height: 0;
		background: var(--white);
		pointer-events: none; /* decorative — let clicks fall through to the card link */
	}

	/* Size the flag artwork (CountryFlagArt renders a 3:2 <img> or inline <svg>). */
	.card-flag :global(img),
	.card-flag :global(svg) {
		display: block;
		width: 1.625rem; /* 26px */
		height: auto;
		aspect-ratio: 3 / 2;
	}
</style>
