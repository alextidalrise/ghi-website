<script lang="ts">
	import {
		buildPublicImageUrl,
		buildImageSrcset,
		getImagePlaceholder,
		getImageDimensions,
		type ImageBuilderOptions
	} from '$lib/sanity/image';
	import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';

	type Props = {
		/** Pattern B — pass the asset and let the component build URLs + read lqip/dims. */
		asset?: MediaAssetInput | null;
		widths?: number[];
		options?: ImageBuilderOptions;
		/** Pattern A — pass pre-built strings (server transforms that already built URLs). */
		src?: string | null;
		srcset?: string | null;
		lqip?: string | null;
		width?: number | null;
		height?: number | null;
		/** Shared. */
		alt: string;
		sizes?: string;
		loading?: 'lazy' | 'eager';
		fetchpriority?: 'high' | 'low' | 'auto';
		decoding?: 'async' | 'sync' | 'auto';
		/** When true, the image fills a sized parent (object-fit); else responsive (height auto). */
		fill?: boolean;
		objectFit?: 'cover' | 'contain';
		/**
		 * Fade the sharp image in over the blur. Defaults to false for eager images
		 * (LCP-critical: the blurred background shows through the transparent <img>
		 * until it paints — no opacity:0, so no LCP risk and works without JS) and
		 * true for lazy below-the-fold images.
		 */
		fade?: boolean;
		class?: string;
		imgClass?: string;
	};

	let {
		asset,
		widths,
		options = {},
		src,
		srcset,
		lqip,
		width,
		height,
		alt,
		sizes,
		loading = 'lazy',
		fetchpriority = 'auto',
		decoding = 'async',
		fill = false,
		objectFit = 'cover',
		fade,
		class: className = '',
		imgClass = ''
	}: Props = $props();

	// Resolve from whichever input was supplied (Pattern A strings win when present).
	const resolvedSrc = $derived(src ?? (asset ? buildPublicImageUrl(asset, options) : null));
	const resolvedSrcset = $derived(
		srcset ?? (asset && widths ? buildImageSrcset(asset, widths, options) : '')
	);
	const resolvedLqip = $derived(lqip ?? getImagePlaceholder(asset));
	const resolvedDims = $derived(
		asset ? getImageDimensions(asset) : width && height ? { width, height } : null
	);

	// Eager images don't fade (LCP safety); lazy ones do. Explicit prop overrides.
	const useFade = $derived(fade ?? loading !== 'eager');

	let loaded = $state(false);
	let imgEl = $state<HTMLImageElement | null>(null);

	// Reveal logic (only meaningful when fading): reset when the resolved source
	// changes (so reused instances — e.g. a gallery stage swapping images — blur-up
	// again), and immediately reveal cached/SSR images whose onload may not fire
	// after hydration.
	$effect(() => {
		void resolvedSrc; // track for navigation
		loaded = Boolean(imgEl?.complete && imgEl.naturalWidth > 0);
	});
</script>

{#if resolvedSrc}
	<span
		class="blur-image {className}"
		class:blur-image--fill={fill}
		class:blur-image--fade={useFade}
		class:blur-image--loaded={loaded}
		style:--blur-fit={objectFit}
		style:background-image={resolvedLqip ? `url(${resolvedLqip})` : undefined}
	>
		<img
			bind:this={imgEl}
			class={imgClass}
			src={resolvedSrc}
			srcset={resolvedSrcset || undefined}
			{sizes}
			{alt}
			width={resolvedDims?.width}
			height={resolvedDims?.height}
			{loading}
			{fetchpriority}
			{decoding}
			onload={() => (loaded = true)}
			onerror={() => (loaded = true)}
		/>
	</span>
{/if}

<style>
	.blur-image {
		display: block;
		position: relative;
		background-size: var(--blur-fit, cover);
		background-position: center;
		background-repeat: no-repeat;
	}

	/* Fill mode: occupy a sized parent so object-fit applies (cards, gallery stage). */
	.blur-image--fill {
		width: 100%;
		height: 100%;
	}

	.blur-image img {
		display: block;
		width: 100%;
		height: auto;
	}

	.blur-image--fill img {
		height: 100%;
		object-fit: var(--blur-fit, cover);
	}

	/* Fade variant only: hide the sharp image until it loads, then fade it in over
	   the blur. Non-fade images stay opaque (the blur shows through until paint). */
	.blur-image--fade img {
		opacity: 0;
		transition: opacity 300ms ease;
	}

	.blur-image--fade.blur-image--loaded img {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.blur-image--fade img {
			transition: none;
		}
	}
</style>
