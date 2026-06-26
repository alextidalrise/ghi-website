<script lang="ts">
	import { buildPublicImageUrl, getImagePlaceholder, getImageDimensions } from '$lib/sanity/image';
	import BlurImage from '$lib/components/media/BlurImage.svelte';
	import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';
	import type { PublicMediaBundle } from '$lib/sanity/transforms/mediaFilter';

	type GalleryItem = {
		asset: MediaAssetInput;
		alt: string;
		key: string;
		thumbSrc: string;
		thumbSrcset: string;
	};

	type Props = {
		media: PublicMediaBundle | null | undefined;
		title: string;
	};

	let { media, title }: Props = $props();

	let activeIndex = $state(0);
	let lightboxOpen = $state(false);
	let dialogEl = $state<HTMLDialogElement | null>(null);
	let filmstripEl = $state<HTMLDivElement | null>(null);
	let prefersReducedMotion = $state(false);

	// --- Responsive image config -----------------------------------------
	// Stage and lightbox are 3:2 crops; the lightbox shows the whole frame.
	const STAGE_WIDTHS = [1100, 1500, 1900, 2400];
	const THUMB_WIDTHS = [180, 300];
	const LIGHTBOX_WIDTHS = [1000, 1500, 2000, 2600];
	const STAGE_SIZES = '100vw';
	const THUMB_SIZES = '150px';
	const LIGHTBOX_SIZES = '100vw';
	const STAGE_RATIO = 3 / 2;

	function buildSrcset(
		asset: MediaAssetInput,
		widths: number[],
		ratio: number | null,
		fit: 'crop' | 'clip',
		quality: number
	): string {
		const parts: string[] = [];
		for (const w of widths) {
			const url = buildPublicImageUrl(asset, {
				width: w,
				height: ratio ? Math.round(w / ratio) : undefined,
				fit,
				quality
			});
			if (url) parts.push(`${url} ${w}w`);
		}
		return parts.join(', ');
	}

	const items = $derived.by((): GalleryItem[] => {
		if (!media) return [];

		const collected: GalleryItem[] = [];
		const seenUrls = new Set<string>();

		const pushAsset = (asset: MediaAssetInput | null | undefined, key: string) => {
			if (!asset) return;
			const probe = buildPublicImageUrl(asset, { width: 240, height: 160, fit: 'crop' });
			if (!probe || seenUrls.has(probe)) return;
			seenUrls.add(probe);
			collected.push({
				asset,
				alt: asset.altText ?? title,
				key,
				thumbSrc: probe,
				thumbSrcset: buildSrcset(asset, THUMB_WIDTHS, STAGE_RATIO, 'crop', 80)
			});
		};

		for (const image of media.gallery ?? []) {
			pushAsset(image, image.asset?._ref ?? `gallery-${collected.length}`);
		}
		for (const group of media.galleryGroups ?? []) {
			for (const image of group.images ?? []) {
				pushAsset(image, image.asset?._ref ?? `group-${collected.length}`);
			}
		}

		return collected;
	});

	const total = $derived(items.length);
	const active = $derived(items[activeIndex] ?? null);

	const stageSrc = $derived(
		active ? buildPublicImageUrl(active.asset, { width: 1500, height: 1000, fit: 'crop', quality: 82 }) : null
	);
	const stageSrcset = $derived(active ? buildSrcset(active.asset, STAGE_WIDTHS, STAGE_RATIO, 'crop', 82) : '');
	const stageLqip = $derived(active ? getImagePlaceholder(active.asset) : null);
	const lightboxSrc = $derived(
		active ? buildPublicImageUrl(active.asset, { width: 1500, fit: 'clip', quality: 85 }) : null
	);
	const lightboxSrcset = $derived(active ? buildSrcset(active.asset, LIGHTBOX_WIDTHS, null, 'clip', 85) : '');
	const lightboxLqip = $derived(active ? getImagePlaceholder(active.asset) : null);
	const lightboxDims = $derived(active ? getImageDimensions(active.asset) : null);

	// Preload sources for the first stage image so it stays a clean LCP element.
	const preloadSrcset = $derived(items[0] ? buildSrcset(items[0].asset, STAGE_WIDTHS, STAGE_RATIO, 'crop', 82) : '');

	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => (prefersReducedMotion = mq.matches);
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	});

	// Lock background scroll while the lightbox owns the viewport.
	$effect(() => {
		if (!lightboxOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	// Keep the active thumbnail centered in the filmstrip as the stage advances.
	// Scrolls the strip horizontally only — never the page vertically.
	$effect(() => {
		const strip = filmstripEl;
		if (!strip) return;
		void activeIndex; // re-center on navigation
		const child = strip.children[activeIndex] as HTMLElement | undefined;
		if (!child) return;
		const target = child.offsetLeft - (strip.clientWidth - child.clientWidth) / 2;
		strip.scrollTo({ left: Math.max(0, target), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
	});

	// Preload both neighbours so prev/next feels instant — the stage variant always,
	// and the lightbox-resolution variant while the lightbox is open. We warm via
	// srcset + sizes (NOT a single URL) so the browser runs the same responsive
	// selection as the visible <img> and caches the exact candidate it will display
	// — critical on high-DPR screens, where sizes="100vw" picks the largest width.
	// A persistent Set keyed on the srcset prevents re-issuing on every re-render.
	const preloaded = new Set<string>();
	function warm(srcset: string, sizes: string) {
		if (!srcset || preloaded.has(srcset)) return;
		preloaded.add(srcset);
		const img = new Image();
		img.sizes = sizes; // set before srcset so candidate selection uses it
		img.srcset = srcset;
	}
	$effect(() => {
		if (total < 2) return;
		// Stage warms ±1; the lightbox warms ±2 so rapid forward/back clicking
		// (which can outrun a single neighbour) still lands on a cached frame.
		const at = (offset: number) => items[(activeIndex + offset + total * 2) % total].asset;
		for (const offset of [1, -1]) {
			warm(buildSrcset(at(offset), STAGE_WIDTHS, STAGE_RATIO, 'crop', 82), STAGE_SIZES);
		}
		if (lightboxOpen) {
			for (const offset of [1, -1, 2, -2]) {
				warm(buildSrcset(at(offset), LIGHTBOX_WIDTHS, null, 'clip', 85), LIGHTBOX_SIZES);
			}
		}
	});

	function select(index: number) {
		activeIndex = index;
	}

	function prev() {
		if (total === 0) return;
		activeIndex = (activeIndex - 1 + total) % total;
	}

	function next() {
		if (total === 0) return;
		activeIndex = (activeIndex + 1) % total;
	}

	function openLightbox(index: number) {
		activeIndex = index;
		lightboxOpen = true;
		dialogEl?.showModal();
	}

	function closeLightbox() {
		dialogEl?.close();
	}

	function onDialogClose() {
		lightboxOpen = false;
	}

	function onDialogKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			next();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			prev();
		}
	}

	// Click on the backdrop (outside the figure) closes the lightbox.
	function onSurfaceClick(event: MouseEvent) {
		if (event.target === event.currentTarget) closeLightbox();
	}

	// --- Touch swipe (stage + lightbox) ----------------------------------
	// Swipe is the primary mobile navigation (arrows are hidden on phones).
	let pointerStartX = 0;
	let pointerActive = false;
	let swipedAway = false;

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType !== 'touch') return;
		pointerStartX = event.clientX;
		pointerActive = true;
		swipedAway = false;
	}

	function onPointerUp(event: PointerEvent) {
		if (!pointerActive) return;
		pointerActive = false;
		const dx = event.clientX - pointerStartX;
		if (Math.abs(dx) < 40) return;
		swipedAway = true;
		if (dx < 0) next();
		else prev();
	}

	// On a real device a horizontal drag can be aborted by the browser's
	// gesture detector (firing pointercancel, never pointerup). Reset state so
	// the gallery doesn't get wedged and the next tap behaves normally.
	function onPointerCancel() {
		pointerActive = false;
	}

	// A swipe on the stage navigates; it must not also tap through to the lightbox.
	function onStageClick() {
		if (swipedAway) {
			swipedAway = false;
			return;
		}
		openLightbox(activeIndex);
	}
</script>

<svelte:head>
	{#if preloadSrcset}
		<link
			rel="preload"
			as="image"
			imagesrcset={preloadSrcset}
			imagesizes={STAGE_SIZES}
			fetchpriority="high"
		/>
	{/if}
</svelte:head>

{#snippet chevron(dir: 'left' | 'right')}
	<svg
		class="chevron"
		viewBox="0 0 24 24"
		width="22"
		height="22"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d={dir === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'} />
	</svg>
{/snippet}

{#if total > 0}
	<section class="gallery" aria-label="Property photos">
		<div class="gallery__stage">
			<button
				type="button"
				class="gallery__open"
				onclick={onStageClick}
				onpointerdown={onPointerDown}
				onpointerup={onPointerUp}
				onpointercancel={onPointerCancel}
				aria-label={total > 1
					? `View photo ${activeIndex + 1} of ${total} fullscreen`
					: 'View photo fullscreen'}
			>
				{#if stageSrc}
					<BlurImage
						src={stageSrc}
						srcset={stageSrcset}
						lqip={stageLqip}
						sizes={STAGE_SIZES}
						alt={active?.alt ?? title}
						width={1500}
						height={1000}
						fill
						objectFit="cover"
						loading="eager"
						fetchpriority="high"
					/>
				{/if}
				<span class="gallery__zoom" aria-hidden="true">View</span>
			</button>

			{#if total > 1}
				<button type="button" class="gallery__nav gallery__nav--prev" onclick={prev} aria-label="Previous photo">
					{@render chevron('left')}
				</button>
				<button type="button" class="gallery__nav gallery__nav--next" onclick={next} aria-label="Next photo">
					{@render chevron('right')}
				</button>
				<span class="gallery__counter tabular-nums" aria-hidden="true">{activeIndex + 1} / {total}</span>
			{/if}
		</div>

		{#if total > 1}
			<div class="gallery__filmstrip" bind:this={filmstripEl} role="group" aria-label="Photo thumbnails">
				{#each items as item, i (item.key)}
					<button
						type="button"
						class="gallery__thumb"
						class:gallery__thumb--active={activeIndex === i}
						aria-label={`Show photo ${i + 1} of ${total}`}
						aria-pressed={activeIndex === i}
						onclick={() => select(i)}
					>
						<img src={item.thumbSrc} srcset={item.thumbSrcset} sizes={THUMB_SIZES} alt="" loading="lazy" decoding="async" />
					</button>
				{/each}
			</div>
		{/if}
	</section>

	<dialog
		bind:this={dialogEl}
		class="lightbox"
		onclose={onDialogClose}
		onkeydown={onDialogKeydown}
		aria-label="Property photos, fullscreen"
	>
		{#if lightboxOpen && active}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div class="lightbox__surface" onclick={onSurfaceClick}>
				<button type="button" class="lightbox__close" onclick={closeLightbox} aria-label="Close photos">
					<span aria-hidden="true">×</span>
				</button>

				<figure
					class="lightbox__figure"
					onpointerdown={onPointerDown}
					onpointerup={onPointerUp}
					onpointercancel={onPointerCancel}
				>
					<!-- A single persistent <img>: src/srcset/lqip update reactively on
					     navigation. The lqip background shows instantly (no fade), so a
					     cold frame shows the blur immediately rather than a blank screen. -->
					<img
						class="lightbox__img"
						src={lightboxSrc}
						srcset={lightboxSrcset}
						sizes={LIGHTBOX_SIZES}
						alt={active.alt}
						width={lightboxDims?.width}
						height={lightboxDims?.height}
						decoding="async"
						style:background-image={lightboxLqip ? `url(${lightboxLqip})` : undefined}
					/>
				</figure>

				{#if total > 1}
					<button type="button" class="lightbox__nav lightbox__nav--prev" onclick={prev} aria-label="Previous photo">
						{@render chevron('left')}
					</button>
					<button type="button" class="lightbox__nav lightbox__nav--next" onclick={next} aria-label="Next photo">
						{@render chevron('right')}
					</button>
					<span class="lightbox__counter tabular-nums">{activeIndex + 1} / {total}</span>
				{/if}
			</div>
		{/if}
	</dialog>
{/if}

<style>
	/* Near full-bleed: the gallery breaks the 1060px text column so photography
	   commands the viewport. Capped on ultra-wide so the stage never gets absurd. */
	.gallery {
		width: 100%;
		max-width: 1800px;
		margin-inline: auto;
		padding-inline: clamp(1rem, 2.5vw, 2rem);
		padding-block: var(--space-xl);
	}

	/* --- Stage ---------------------------------------------------------- */
	/* The stage's 3:2 is the height authority, capped at 78vh so a full-bleed
	   landscape frame never grows taller than the fold. */
	.gallery__stage {
		position: relative;
		width: 100%;
		aspect-ratio: 3 / 2;
		max-height: 78vh;
		background: var(--green);
		overflow: hidden;
	}

	.gallery__open {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: none;
		cursor: zoom-in;
		/* Reserve vertical panning for page scroll, but let horizontal drags
		   reach the swipe handlers instead of being eaten by the browser's
		   gesture detector (which otherwise fires pointercancel on real phones). */
		touch-action: pan-y;
	}

	.gallery__zoom {
		position: absolute;
		top: var(--space-sm);
		right: var(--space-sm);
		padding: 0.35rem 0.7rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--white);
		background: rgba(31, 61, 52, 0.78);
		opacity: 0;
		transition: opacity var(--duration-hover) var(--ease);
	}

	.gallery__open:hover .gallery__zoom,
	.gallery__open:focus-visible .gallery__zoom {
		opacity: 1;
	}

	.gallery__nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(245, 241, 232, 0.35);
		background: rgba(31, 61, 52, 0.72);
		color: var(--white);
		cursor: pointer;
		transition: background var(--duration-hover) var(--ease), border-color var(--duration-hover) var(--ease);
	}

	.chevron {
		display: block;
	}

	.gallery__nav:hover,
	.gallery__nav:focus-visible {
		background: var(--green);
		border-color: var(--gold);
	}

	.gallery__nav--prev {
		left: var(--space-md);
	}

	.gallery__nav--next {
		right: var(--space-md);
	}

	.gallery__counter {
		position: absolute;
		bottom: var(--space-md);
		right: var(--space-md);
		padding: 0.4rem 0.8rem;
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--white);
		background: rgba(14, 20, 16, 0.78);
	}

	/* --- Filmstrip ------------------------------------------------------ */
	.gallery__filmstrip {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
		overflow-x: auto;
		scroll-padding-inline: 0.5rem;
		padding-bottom: 0.35rem;
		scrollbar-width: thin;
		-webkit-overflow-scrolling: touch;
	}

	.gallery__thumb {
		flex: 0 0 auto;
		height: clamp(64px, 7vw, 92px);
		aspect-ratio: 3 / 2;
		position: relative;
		padding: 0;
		border: 1px solid var(--border);
		background: var(--green);
		cursor: pointer;
		overflow: hidden;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.gallery__thumb img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.78;
		transition: opacity var(--duration-hover) var(--ease);
	}

	.gallery__thumb:hover img,
	.gallery__thumb:focus-visible img {
		opacity: 1;
	}

	.gallery__thumb--active {
		border-color: var(--green);
		outline: 2px solid var(--green);
		outline-offset: -1px;
	}

	.gallery__thumb--active img {
		opacity: 1;
	}

	/* Below the desktop split (< 1024px) the gallery is stacked full-width, so the
	   stage becomes a true edge-to-edge hero, flush under the fixed nav. This runs
	   to the desktop breakpoint so phones AND tablets bleed alike (the desktop rule
	   in PropertyDetail takes over at 1024px). Only the stage bleeds; the filmstrip
	   keeps its gutter. 100vw breakout matches the FrontlineListings convention;
	   .site-main's overflow-x: clip absorbs it without a horizontal scrollbar. */
	@media (max-width: 1023px) {
		.gallery {
			padding-block-start: 0;
		}

		.gallery__stage {
			width: 100vw;
			margin-inline: calc(50% - 50vw);
		}
	}

	/* Arrows cover the photo on a phone; swipe is the gesture, and the counter
	   signals there is more. Hidden on the stage and in the lightbox. Tablets keep
	   the arrows (pointer-friendly, and they sit over the bled photo like desktop). */
	@media (max-width: 760px) {
		.gallery__nav,
		.lightbox__nav {
			display: none;
		}
	}

	/* --- Lightbox ------------------------------------------------------- */
	.lightbox {
		width: 100vw;
		max-width: 100vw;
		height: 100vh;
		max-height: 100vh;
		margin: 0;
		padding: 0;
		border: 0;
		background: var(--hero-dark);
		color: var(--white);
	}

	.lightbox::backdrop {
		background: rgba(14, 20, 16, 0.92);
	}

	.lightbox__surface {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1rem, 4vw, 3.5rem);
	}

	.lightbox__figure {
		margin: 0;
		max-width: 100%;
		max-height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		pointer-events: none;
	}

	.lightbox__img {
		/* width/height attrs supply the aspect-ratio; auto + max constraints scale it
		   within the viewport without distortion and reserve space before load (no
		   reflow on swipe). The lqip background sits behind the contained image. */
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: calc(100vh - 7rem);
		object-fit: contain;
		background-size: contain;
		background-position: center;
		background-repeat: no-repeat;
		pointer-events: auto;
		/* The img is the touch target (the figure is pointer-events:none), so the
		   swipe gesture must be claimed here. Background scroll is already locked. */
		touch-action: pan-y;
	}


	.lightbox__close {
		position: absolute;
		top: clamp(0.75rem, 2vw, 1.5rem);
		right: clamp(0.75rem, 2vw, 1.5rem);
		width: 2.75rem;
		height: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(245, 241, 232, 0.3);
		background: transparent;
		color: var(--white);
		font-size: 1.75rem;
		line-height: 1;
		cursor: pointer;
		transition: background var(--duration-hover) var(--ease), border-color var(--duration-hover) var(--ease);
	}

	.lightbox__close:hover,
	.lightbox__close:focus-visible {
		background: rgba(245, 241, 232, 0.12);
		border-color: var(--gold);
	}

	.lightbox__nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(245, 241, 232, 0.3);
		background: rgba(31, 61, 52, 0.6);
		color: var(--white);
		cursor: pointer;
		transition: background var(--duration-hover) var(--ease), border-color var(--duration-hover) var(--ease);
	}

	.lightbox__nav:hover,
	.lightbox__nav:focus-visible {
		background: var(--green);
		border-color: var(--gold);
	}

	.lightbox__nav--prev {
		left: clamp(0.5rem, 2vw, 1.5rem);
	}

	.lightbox__nav--next {
		right: clamp(0.5rem, 2vw, 1.5rem);
	}

	.lightbox__counter {
		position: absolute;
		bottom: clamp(0.75rem, 2vw, 1.5rem);
		left: 50%;
		transform: translateX(-50%);
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		color: rgba(245, 241, 232, 0.82);
	}

	@media (prefers-reduced-motion: reduce) {
		.gallery__zoom,
		.gallery__nav,
		.gallery__thumb,
		.gallery__thumb img,
		.lightbox__close,
		.lightbox__nav {
			transition: none;
		}
	}
</style>
