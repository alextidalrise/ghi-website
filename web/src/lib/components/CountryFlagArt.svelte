<script lang="ts">
	/**
	 * The flag artwork only — no frame. Callers wrap it in their own 1px-framed stamp
	 * (the country selector and the country hero use different stamp sizes, but share
	 * this resolution logic). Prefer the SVG uploaded in Sanity; fall back to a built-in
	 * stamp so a country still renders before an editor uploads its flag. Spain and
	 * Portugal ship hand-drawn fallbacks; any other country gets a neutral green field
	 * until its flag is added. The country name carries the meaning, so the flag is
	 * decorative (empty alt / aria-hidden).
	 */
	type Props = {
		slug: string;
		flagUrl?: string | null;
	};

	let { slug, flagUrl }: Props = $props();
</script>

{#if flagUrl}
	<img src={flagUrl} alt="" width="48" height="32" loading="lazy" decoding="async" />
{:else if slug === 'spain'}
	<svg viewBox="0 0 30 20" aria-hidden="true">
		<rect width="30" height="20" fill="#AA151B" />
		<rect y="5" width="30" height="10" fill="#F1BF00" />
	</svg>
{:else if slug === 'portugal'}
	<svg viewBox="0 0 30 20" aria-hidden="true">
		<rect width="30" height="20" fill="#DA291C" />
		<rect width="12" height="20" fill="#046A38" />
		<circle cx="12" cy="10" r="3.1" fill="#FFE12C" stroke="#046A38" stroke-width="0.7" />
	</svg>
{:else}
	<svg viewBox="0 0 30 20" aria-hidden="true">
		<rect width="30" height="20" fill="#1F3D34" />
	</svg>
{/if}
